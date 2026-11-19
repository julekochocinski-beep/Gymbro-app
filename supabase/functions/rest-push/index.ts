import webPush from "npm:web-push@3.6.7";

type RestJob = {
  token: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  due_at: string;
  language: "pl" | "en";
};

const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
const subject = Deno.env.get("VAPID_SUBJECT");
const workerSecret = Deno.env.get("REST_PUSH_WORKER_SECRET");

const keySet = Deno.env.get("SUPABASE_SECRET_KEYS");
const serviceKey = keySet ? JSON.parse(keySet).default : undefined;
const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const projectUrl = Deno.env.get("SUPABASE_URL");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "no-store",
};

const allowedEndpoint = /^https:\/\/(web\.push\.apple\.com\/|fcm\.googleapis\.com\/(fcm\/send|wp)\/|updates\.push\.services\.mozilla\.com\/wpush\/v[0-9]+\/)[^\s#]+$/;

async function rpc(name: string, body: object) {
  const headers: Record<string, string> = {
    apikey: (serviceKey ?? legacyKey)!,
    "Content-Type": "application/json",
  };
  if (!serviceKey) headers.Authorization = `Bearer ${legacyKey}`;
  const response = await fetch(`${projectUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw Error(`Worker RPC failed: ${name} (${response.status})`);
  if (response.status !== 204) return response.json();
}

async function deliver(job: RestJob, vapidDetails: { subject: string; publicKey: string; privateKey: string }) {
  const ttl = Math.min(20, Math.ceil((Date.parse(job.due_at) + 40000 - Date.now()) / 1000));
  if (ttl <= 0 || !allowedEndpoint.test(job.endpoint)) return "discard";

  let details;
  try {
    details = webPush.generateRequestDetails(
      { endpoint: job.endpoint, keys: { p256dh: job.p256dh, auth: job.auth_key } },
      JSON.stringify({ language: job.language }),
      { TTL: ttl, urgency: "high", topic: "gymbro-rest", vapidDetails },
    );
  } catch {
    return "discard";
  }

  try {
    const response = await fetch(details.endpoint, {
      method: details.method,
      headers: details.headers,
      body: details.body,
      redirect: "error",
      signal: AbortSignal.timeout(6000),
    });
    await response.body?.cancel();
    if (response.ok) return "sent";
    if (response.status === 404 || response.status === 410) return "gone";
    if (response.status === 429 || response.status >= 500) return "retry";
    console.warn("Web Push rejected request", response.status);
    return "discard";
  } catch {
    return "retry";
  }
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method === "GET") {
    if (!publicKey || !privateKey || !subject || !workerSecret) {
      return Response.json({ error: "Push is not configured" }, { status: 503, headers: cors });
    }
    return Response.json({ publicKey }, { headers: cors });
  }
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (!workerSecret || request.headers.get("X-GymBro-Worker") !== workerSecret)
    return new Response(null, { status: 401 });
  if (!publicKey || !privateKey || !subject || !projectUrl || !(serviceKey || legacyKey))
    return new Response(null, { status: 503 });

  try {
    const jobs: RestJob[] = await rpc("gymbro_claim_rest_push", {});
    const vapidDetails = { subject, publicKey, privateKey };
    const results = await Promise.allSettled(jobs.map(async job => {
      const result = await deliver(job, vapidDetails);
      await rpc("gymbro_settle_rest_push", { p_token: job.token, p_result: result });
    }));
    const failed = results.filter(result => result.status === "rejected").length;
    if (failed) console.warn("Failed to settle Web Push jobs", failed);
    return Response.json({ processed: jobs.length, failed }, { status: failed ? 502 : 200 });
  } catch {
    console.error("Could not claim Web Push jobs");
    return new Response(null, { status: 502 });
  }
});
