# Powiadomienie o końcu przerwy

Timer nadal odlicza do czasu zapisanego w `draft.rest.deadline`. Dźwięk i wibracja
pozostają dostępne na pierwszym planie. Po zgodzie w ustawieniach GymBro wysyła
termin przerwy do Supabase z urządzenia, na którym zmieniono timer. Zmiana o
15 sekund zastępuje termin. Pominięcie przerwy, cofnięcie serii, która ją uruchomiła,
oraz zakończenie lub porzucenie treningu anulują oczekujący alert.

Supabase Cron sprawdza kolejkę co 5 sekund i uruchamia Edge Function tylko wtedy,
gdy jest co wysłać. Historia wykonań tego zadania jest skracana codziennie do
ostatnich dwóch dni. Sieć i system mogą dodać
opóźnienie. Anulowanie wymaga połączenia z serwerem i nie wycofuje powiadomienia,
które zostało już wysłane. Po krótkiej utracie połączenia aplikacja próbuje
zsynchronizować najnowszą zmianę. Kolejka odrzuca przeterminowane wysyłki.

## Przygotowanie środowiska testowego

1. W oddzielnym projekcie Supabase dodaj konto testowe w **Authentication**.
   Jeśli sprawdzasz też synchronizację profilu, odtwórz schemat aplikacji w
   tym projekcie. Do próby timera i push w SQL Editor uruchom
   [migrację](../supabase/migrations/20261119170000_rest_push.sql).
2. Wygeneruj oddzielną parę kluczy VAPID i losowy sekret workera. Na komputerze
   z Node.js możesz użyć tych poleceń:

   ```sh
   npx web-push@3.6.7 generate-vapid-keys --json
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   W **Edge Functions → Secrets** zapisz `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
   `VAPID_SUBJECT` (np. `mailto:` z rzeczywistym adresem kontaktowym) oraz
   `REST_PUSH_WORKER_SECRET`. Prywatny klucz i sekret przechowuj w Supabase.
   Publiczny klucz aplikacja pobiera z Edge Function.
3. W **Vault** utwórz `gymbro_rest_push_project_url` z adresem HTTPS testowego
   projektu Supabase i `gymbro_rest_push_worker_secret` z tą samą wartością co
   `REST_PUSH_WORKER_SECRET`. Wdróż funkcję na testowy projekt:

   ```sh
   supabase functions deploy rest-push --project-ref REF_PROJEKTU_TESTOWEGO
   ```

   Konfiguracja funkcji jest w `supabase/config.toml`. Odczyt klucza publicznego
   (GET) jest publiczny. Wysyłka (POST) wymaga nagłówka z sekretem workera.
   Po wdrożeniu uruchom [skrypt Cron](../supabase/rest-push-cron.sql) w SQL Editor.
4. W kopii gałęzi do wdrożenia testowego ustaw testowy adres i **publiczny**
   klucz Supabase w `supabase.mjs`. Podaj tę kopię do osobnego wdrożenia HTTPS
   na Vercelu. Adres Supabase w kodzie źródłowym głównego projektu jest
   produkcyjny, więc do testów na iPhonie użyj adresu tej oddzielnej kopii.

## Test na prawdziwym iPhonie i Apple Watchu

- **PWA i zgoda.** Na iPhonie z iOS 16.4 lub nowszym dodaj *testowy* adres
  w Safari do ekranu początkowego. Otwórz GymBro z ikony, zaloguj się, przejdź
  do **Ustawienia → Powiadomienia o przerwie → Włącz powiadomienia** i zaakceptuj
  zgodę iOS. Stan powinien zmienić się na „Powiadomienia włączone na tym
  urządzeniu”. W zwykłej karcie Safari na iPhonie aplikacja powinna wskazać,
  żeby otworzyć ją z ekranu początkowego.
- **Zablokowany iPhone.** Na czas próby odłóż i zablokuj Apple Watch, wyłącz tryb
  skupienia i sprawdź w iOS, czy GymBro może pokazywać alerty na zablokowanym
  ekranie. Ustaw 30 sekund przerwy po ćwiczeniu, zaznacz serię i zablokuj iPhone'a.
  Oczekiwany wynik to jedno powiadomienie „Koniec przerwy”. Orientacyjny próg
  akceptacji w stabilnej sieci to od końca przerwy do 15 sekund po nim.
  Stuknięcie w powiadomienie powinno otworzyć trening.
- **Apple Watch.** Załóż odblokowany Apple Watch, sprawdź połączenie z iPhonem
  i włącz przekazywanie alertów GymBro w aplikacji Watch, jeśli ta opcja jest
  dostępna. Powtórz próbę z zablokowanym iPhonem. Oczekiwany wynik to alert na
  zegarku, jeśli ustawienia Apple kierują go na Watch. iOS może dostarczyć alert
  na jedno z urządzeń. Zapisz urządzenie, które pokazało alert, i opóźnienie.
- **Zmiana i anulowanie.** Przy 45 sekundach kliknij `+15 s` i zablokuj ekran.
  Alert ma pojawić się po nowym terminie, a przy pierwotnym terminie ma być
  cisza. Powtórz z `−15 s`. W osobnych próbach kliknij **Pomiń**, cofnij
  ukończoną serię albo zakończ trening na długo przed terminem. Po starym
  terminie i oknie dostawy aplikacja nie powinna zgłaszać końca tej przerwy.
- **Wyłączenie i działanie bez push.** Wyłącz powiadomienia i zacznij nową
  przerwę. Przy zablokowanym ekranie nie powinno być alertu push. Na otwartym
  ekranie odliczanie i dotychczasowy sygnał mają nadal działać. Powtórz dla
  odmowy zgody systemowej.

Dokumentacja [Web Push w iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/),
[powiadomień Apple Watch](https://support.apple.com/en-gb/108369)
i [wywoływania Edge Function przez Cron](https://supabase.com/docs/guides/functions/schedule-functions).
