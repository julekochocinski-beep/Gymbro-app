import {englishExercises} from './catalog-en.mjs';
import {t,uiLocale} from './locale.mjs';

const groups = {
  klatka: ['Klatka piersiowa', [
    ['Wyciskanie leżąc','Sztanga','Ustaw stopy stabilnie, ściągnij łopatki i trzymaj nadgarstki nad łokciami. Opuść sztangę do dolnej części klatki i wyciśnij ją bez odbijania.','Wyciskanie sztangi na ławce','Bench press','Ława','Wyciskanie na ławce'],
    ['Wyciskanie hantli','Hantle','Ściągnij łopatki i oprzyj stopy o podłogę. Opuść hantle po obu stronach klatki do komfortowej głębokości, a następnie wyciśnij nad barki.'],
    ['Wyciskanie hantli na skosie','Hantle','Ustaw ławkę pod niewielkim skosem. Opuść hantle po bokach górnej części klatki, po czym wyciśnij je w górę, utrzymując stopy i plecy stabilnie.'],
    ['Wyciskanie na maszynie','Maszyna','Ustaw siedzisko tak, aby uchwyty były na wysokości klatki. Oprzyj plecy, wypchnij uchwyty i wróć powoli, kontrolując ciężar.','Chest press'],
    ['Wyciskanie na suwnicy Smitha na ławce płaskiej','Suwnica Smitha','Ustaw ławkę tak, aby gryf schodził w okolice środka klatki, i dopasuj ograniczniki. Opuść gryf spokojnie i wyciśnij go wzdłuż prowadnic.','Smith bench press','wyciskanie na maszynie Smitha'],
    ['Wyciskanie na suwnicy Smitha na ławce skośnej','Suwnica Smitha','Ustaw niewielki skos ławki i zabezpieczenia tuż poniżej planowanego zakresu ruchu. Opuść gryf do górnej części klatki i wyciśnij go bez odbijania.','Smith incline bench press'],
    ['Wyciskanie sztangi na ławce skośnej','Sztanga','Ustaw niewielki skos ławki. Opuść sztangę pod kontrolą do górnej części klatki i wyciśnij, utrzymując stopy i pośladki na podparciu.'],
    ['Krzyżowanie linek wyciągu','Wyciąg','Stań stabilnie między bloczkami. Zbliż dłonie przed klatką po łuku przy lekko ugiętych łokciach. Wróć, kontrolując rozciągnięcie.','Cable fly'],
    ['Rozpiętki','Hantle','Utrzymaj lekko ugięte łokcie. Rozłóż ręce do komfortowego rozciągnięcia klatki, po czym zbliż hantle nad klatką po tym samym łuku.'],
    ['Pec-deck (rozpiętki na maszynie)','Maszyna','Ustaw siedzisko tak, by uchwyty były na wysokości barków lub nieco niżej. Zbliż uchwyty po łuku, utrzymując kąt w łokciach. Wróć powoli do pozycji startowej.','Butterfly'],
    ['Pompki','Masa ciała','Ustaw dłonie nieco szerzej niż barki i napnij brzuch. Opuść klatkę między dłonie, trzymając ciało w jednej linii, i odepchnij się od podłogi.'],
    ['Wyciskanie hantli leżąc na podłodze','Hantle','Połóż się na plecach z ugiętymi kolanami. Opuść hantle, aż ramiona lekko dotkną podłogi, zatrzymaj ruch i wyciśnij je nad klatkę.','Floor press','Wyciskanie hantli z podłogi',{klatka:1,triceps:.75,barki:.4}],
    ['Wyciskanie sztangi na ławce z ujemnym skosem','Sztanga','Zablokuj nogi w podpórkach i ustaw gryf nad klatką. Opuść sztangę pod kontrolą w kierunku dolnej części klatki i wyciśnij bez odbijania.','Decline bench press','Wyciskanie na skosie ujemnym',{klatka:1,triceps:.6,barki:.35}],
    ['Rozpiętki na wyciągu od dołu do góry','Wyciąg','Ustaw bloczki nisko. Przy lekko ugiętych łokciach zbliż dłonie przed górą klatki po ruchu wznoszącym. Wróć tym samym torem.','Low cable fly','Krzyżowanie linek wyciągu dolnego',{klatka:1,barki:.45}],
    ['Pompki z dłońmi na podwyższeniu','Masa ciała','Oprzyj dłonie o stabilną ławkę lub uchwyt. Trzymając biodra w linii z tułowiem, opuść klatkę do podpory i odepchnij się.','Pompki na podwyższeniu',{klatka:1,triceps:.55,barki:.45}],
    ['Wyciskanie na klatkę na maszynie skośnej','Maszyna','Dopasuj siedzisko, by uchwyty zaczynały przy górnej części klatki. Oprzyj plecy, wypchnij uchwyty po skosie i wróć pod kontrolą.','Incline chest press',{klatka:1,barki:.65,triceps:.55}],
  ]],
  plecy: ['Plecy', [
    ['Podciąganie','Masa ciała','Zacznij ze zwisu bez rozbujania. Ściągnij łokcie w dół, unieś brodę nad drążek bez wyciągania szyi i opuść się pod kontrolą.','Podciąganie na drążku'],
    ['Podciąganie z asystą','Maszyna','Ustaw przeciwwagę, która pozwoli wykonać płynne powtórzenia. Oprzyj kolana lub stopy na podparciu i prowadź łokcie w dół bez odpychania się nogami.'],
    ['Wiosłowanie sztangą','Sztanga','Cofnij biodra i ustabilizuj tułów w pochyleniu. Przyciągnij sztangę do brzucha, nie prostując bioder, i opuść ją pod kontrolą.','Wiosło sztangą'],
    ['Wiosłowanie hantlą jednorącz','Hantle','Podeprzyj się o ławkę i ustaw tułów stabilnie. Poprowadź łokieć w stronę biodra i opuść hantlę bez skręcania tułowia.','One-arm dumbbell row'],
    ['Podciąganie podchwytem','Masa ciała','Złap drążek podchwytem i zacznij z kontrolowanego zwisu. Prowadź łokcie w dół i wróć bez rozbujania nóg.','Chin-up'],
    ['Podciąganie chwytem neutralnym','Masa ciała','Użyj równoległych uchwytów i zacznij bez zamachu. Ściągnij łokcie do boków i wróć do zwisu pod kontrolą.'],
    ['High row','Maszyna','Oprzyj klatkę o poduszkę, jeśli maszyna ją ma. Ściągnij uchwyty po skosie w dół, prowadząc łokcie w tył. Wróć bez odrywania tułowia.'],
    ['Wiosłowanie z podparciem klatki','Maszyna','Oprzyj klatkę o poduszkę i ustaw stopy stabilnie. Przyciągnij łokcie do tyłu, a potem daj łopatkom wrócić do przodu bez odrywania klatki.','Chest-supported row'],
    ['Ściąganie drążka','Wyciąg','Zablokuj uda pod poduszką. Lekko odchyl tułów i prowadź łokcie w dół, ściągając drążek do górnej części klatki. Wróć bez zamachu.'],
    ['Ściąganie drążka wyciągu górnego podchwytem','Wyciąg','Ustaw uda pod poduszką i chwyć drążek podchwytem. Ściągnij łokcie w dół przy tułowiu i oddaj ciężar bez bujania plecami.'],
    ['Przyciąganie drążka wyciągu dolnego szerokim chwytem','Wyciąg','Ustaw stopy stabilnie, utrzymaj spokojny tułów i przyciągnij drążek w stronę dolnych żeber, kierując łokcie szerzej niż przy chwycie wąskim.'],
    ['Przyciąganie V-grip','Wyciąg','Usiądź stabilnie z lekko ugiętymi kolanami. Przyciągnij uchwyt do brzucha, prowadząc łokcie blisko boków. Oddaj ciężar bez bujania tułowiem.'],
    ['Ściąganie linki prostymi rękami','Wyciąg','Stań przed górnym wyciągiem i lekko pochyl tułów. Przy niewielkim, stałym ugięciu łokci przesuń uchwyt po łuku w stronę ud. Wróć powoli.','Pullover na wyciągu'],
    ['Face pull','Wyciąg','Ustaw linę na wysokości oczu. Przyciągnij końce w kierunku skroni, prowadząc łokcie na boki. Wróć bez odchylania tułowia.'],
    ['Szrugsy','Hantle','Trzymaj hantle przy bokach i pozostaw łokcie proste. Unieś barki pionowo w stronę uszu, zatrzymaj na moment i powoli opuść.','Shrugs','Shrug','Shrugsy'],
    ['Prostowanie grzbietu na ławce 45°','Ławka','Ustaw poduszkę poniżej bioder. Zegnij się w biodrach i wróć do linii tułowia z nogami. Zakończ ruch bez odchylania pleców ponad tę linię.','Back extension'],
    ['Wiosłowanie T-bar z podparciem klatki','Maszyna','Ustaw poduszkę tak, by klatka miała stabilne podparcie. Przyciągnij uchwyty w stronę żeber i opuść ciężar bez odrywania klatki.','Supported T-bar row','Wiosło T-bar z podparciem',{srodek_plecow:1,najszerszy:.8,barki_tyl:.55,biceps:.55,przedramiona:.25}],
    ['Ściąganie uchwytu wyciągu górnego jednorącz','Wyciąg','Usiądź stabilnie i złap uchwyt jedną ręką. Ściągnij łokieć w stronę biodra bez skręcania tułowia, a potem powoli wyprostuj ramię.','Single arm lat pulldown','Ściąganie linki jednorącz',{najszerszy:1,biceps:.55,oble:.4,przedramiona:.25}],
    ['Przenoszenie hantli za głowę leżąc','Hantle','Połóż się na ławce i trzymaj jedną hantlę obiema rękami. Opuść ją po łuku za głowę w komfortowym zakresie, utrzymując lekko ugięte łokcie i spokojny tułów.','Pullover z hantlą',{klatka:1,najszerszy:.85,oble:.4}],
    ['Wiosłowanie Pendlay ze sztangą','Sztanga','Pochyl tułów, utrzymaj stabilną pozycję i przyciągnij gryf do dolnych żeber. Odłóż sztangę na podłogę po każdym powtórzeniu.','Pendlay row','Wiosłowanie sztangą z podłogi',{srodek_plecow:1,najszerszy:.8,barki_tyl:.55,biceps:.5,dolny_grzbiet:.45,przedramiona:.3}],
    ['Szrugsy ze sztangą','Sztanga','Trzymaj gryf przed udami z wyprostowanymi ramionami. Unieś barki w stronę uszu i opuść je płynnie bez krążenia.','Barbell shrugs','Wznosy barków ze sztangą',{czworoboczny:1,przedramiona:.3}],
  ]],
  nogi: ['Nogi', [
    ['Przysiad','Sztanga','Ustaw stopy stabilnie i napnij tułów. Ugnij jednocześnie biodra i kolana, prowadząc kolana zgodnie z palcami. Wstań, naciskając całą stopą na podłogę.','Przysiad ze sztangą','Przysiady ze sztangą'],
    ['Przysiad na suwnicy Smitha','Suwnica Smitha','Ustaw ograniczniki i znajdź ułożenie stóp zgodne z torem prowadnic. Zejdź w kontrolowanym zakresie, utrzymując całe stopy na podłożu.','Smith squat'],
    ['Przysiad z hantlą trzymaną z przodu','Hantle','Trzymaj jedną hantlę przy klatce. Zejdź między biodrami, prowadząc kolana zgodnie z palcami, i wstań przez nacisk całych stóp.','Goblet squat','Przysiad goblet'],
    ['Hack squat','Maszyna','Oprzyj plecy i ustaw całe stopy na platformie. Opuść wózek, prowadząc kolana zgodnie z palcami, po czym wypchnij platformę bez utraty kontaktu z podparciem.'],
    ['Martwy ciąg rumuński (RDL)','Sztanga','Ugnij lekko kolana i cofaj biodra, prowadząc sztangę blisko nóg. Zakończ opuszczanie, gdy poczujesz mocne rozciągnięcie tyłu ud bez zmiany pozycji pleców. Wróć przez wyprost bioder.','RDL','Martwy ciąg rumuński'],
    ['Rumuński martwy ciąg z hantlami','Hantle','Cofaj biodra przy lekko ugiętych kolanach i prowadź hantle blisko nóg. Gdy poczujesz rozciągnięcie tyłu ud, wróć przez wyprost bioder.','Dumbbell RDL'],
    ['Martwy ciąg','Sztanga','Ustaw sztangę nad środkiem stopy i napnij tułów przed oderwaniem jej od podłogi. Wstań, prostując kolana i biodra, z gryfem blisko nóg. Opuść go pod kontrolą.'],
    ['Suwnica','Maszyna','Oprzyj plecy i miednicę o siedzisko. Opuść platformę tak głęboko, jak pozwala stabilna pozycja miednicy. Wypchnij ją całymi stopami, prowadząc kolana zgodnie z palcami.'],
    ['Wykroki','Hantle','Zrób krok i opuść tylne kolano w stronę podłogi. Utrzymaj przednią stopę stabilnie i wróć naciskając głównie przednią nogą.'],
    ['Przysiad bułgarski','Hantle','Oprzyj tylną stopę na ławce, a przednią ustaw wystarczająco daleko, by zachować równowagę. Opuść się na przedniej nodze i wstań, naciskając całą stopą.'],
    ['Hip thrust','Sztanga','Oprzyj górę pleców o ławkę. Unieś biodra, aż tułów i uda utworzą linię. Zatrzymaj ruch napięciem pośladków bez przeprostu lędźwi.'],
    ['Hip thrust na maszynie','Maszyna','Ustaw poduszkę lub pas na wysokości bioder i oprzyj stopy o platformę. Unieś biodra, napnij pośladki i wróć powoli, utrzymując żebra nad miednicą.'],
    ['Uginanie nóg','Maszyna','Dopasuj oś maszyny do kolana i ustaw wałek tuż nad piętami. Ugnij kolana bez unoszenia bioder, po czym powoli wyprostuj nogi.'],
    ['Uginanie nóg siedząc','Maszyna','Ustaw oś obrotu przy kolanie, wałek nad piętą i dociśnij uda poduszką. Ściągnij pięty w dół i do tyłu. Wyprostuj nogi powoli.','Seated leg curl'],
    ['Prostowanie nóg','Maszyna','Ustaw kolana przy osi obrotu i wałek nad kostkami. Wyprostuj nogi płynnie bez podrzucania ciężaru i opuść go powoli.','Leg extension'],
    ['Wspięcia na palce','Maszyna','Oprzyj przodostopie na platformie. Opuść pięty w komfortowym zakresie, unieś je jak najwyżej i nie odbijaj na dole.'],
    ['Wspięcia na palce siedząc','Maszyna','Ustaw poduszki nad kolanami i oprzyj przodostopie na platformie. Opuszczaj i unoś pięty płynnie, utrzymując uda pod poduszkami.'],
    ['Przysiad przedni ze sztangą','Sztanga','Oprzyj gryf z przodu barków i utrzymuj łokcie wysoko. Zejdź z całymi stopami na podłodze i wstań, utrzymując gryf nad środkiem stóp.','Front squat',{czworoglowe:1,posladki:.75,brzuch:.4,dolny_grzbiet:.3}],
    ['Wykroki w tył z hantlami','Hantle','Zrób krok w tył i ugnij obie nogi. Odepchnij się od podłoża przednią stopą i wróć do pozycji stojącej bez odbijania z tylnej nogi.','Reverse lunge','Zakroki z hantlami',{czworoglowe:1,posladki:.9,dwuglowe:.3}],
    ['Wejścia na podwyższenie z hantlami','Hantle','Ustaw całą stopę na stabilnym podwyższeniu. Wejdź, naciskając na tę stopę, ogranicz odbicie nogą z podłogi i zejdź powoli.','Step-up','Step ups','Wejścia na skrzynię',{czworoglowe:1,posladki:.9,dwuglowe:.3}],
    ['Martwy ciąg sumo','Sztanga','Ustaw stopy szeroko i skieruj palce lekko na zewnątrz. Chwyć gryf między nogami, napnij tułów i wstań, trzymając sztangę blisko ciała.','Sumo deadlift',{posladki:1,czworoglowe:.85,dolny_grzbiet:.55,dwuglowe:.5,przedramiona:.35}],
    ['Martwy ciąg z gryfem heksagonalnym','Sztanga','Stań w środku gryfu i złap uchwyty po bokach. Napnij tułów, oderwij gryf płynnie od podłogi i zakończ w pozycji stojącej.','Trap bar deadlift','Hex bar deadlift','Martwy ciąg z trap barem',{czworoglowe:1,posladki:.9,dwuglowe:.55,dolny_grzbiet:.45,przedramiona:.4}],
    ['Przeciąganie liny między nogami na wyciągu','Wyciąg','Stań tyłem do niskiego bloczka z liną między nogami. Cofnij biodra przy lekko ugiętych kolanach i wyprostuj je, wracając do pozycji stojącej.','Cable pull through','Pull through',{posladki:1,dwuglowe:.8,dolny_grzbiet:.25}],
    ['Wspięcia na palce na jednej nodze','Masa ciała','Oprzyj przodostopie na stabilnym stopniu i podeprzyj się dłonią. Unieś piętę, zatrzymaj ruch na moment i opuść ją bez odbijania.','Single leg calf raise','Wspięcia jednonóż',{lydki:1}],
  ]],
  barki: ['Barki', [
    ['Wyciskanie nad głowę (OHP)','Sztanga','Zacznij z gryfem przy górnej części klatki i łokciami lekko z przodu. Napnij brzuch, wyciśnij gryf nad głowę i wróć bez odchylania lędźwi.','Wyciskanie żołnierskie','OHP','Wyciskanie nad głowę'],
    ['Wyciskanie hantli nad głowę siedząc','Hantle','Oprzyj plecy o ławkę i ustaw hantle przy barkach. Wyciśnij je nad głowę i opuść pod kontrolą bez wyginania pleców.'],
    ['Wyciskanie na barki na maszynie','Maszyna','Dopasuj siedzisko tak, by uchwyty zaczynały mniej więcej na wysokości barków. Oprzyj plecy i wyciśnij uchwyty w górę bez wychylania tułowia.'],
    ['Unoszenie bokiem','Hantle','Lekko ugnij łokcie i unoś ręce na boki, nieco przed linią tułowia. Zatrzymaj się mniej więcej na wysokości barków i opuść hantle bez zamachu.','Wznosy bokiem'],
    ['Wznosy ramion bokiem na maszynie','Maszyna','Ustaw siedzisko i oprzyj ramiona o poduszki. Unieś łokcie do komfortowej wysokości i opuść ciężar powoli, utrzymując tułów na oparciu.','Lateral raise machine'],
    ['Unoszenie bokiem na wyciągu','Wyciąg','Ustaw bloczek nisko. Utrzymując lekko ugięty łokieć, unoś ramię na bok do komfortowej wysokości i wróć, utrzymując tułów nieruchomo.'],
    ['Unoszenie w opadzie','Hantle','Cofnij biodra i pochyl stabilny tułów. Unieś łokcie szeroko po łuku i opuść hantle bez prostowania tułowia.'],
    ['Peck-deck tył barku','Maszyna','Usiądź przodem do poduszki i ustaw uchwyty na wysokości barków. Przy lekko ugiętych łokciach rozsuń ręce na boki. Wróć bez zamachu.','Reverse pec deck','Odwrotne rozpiętki na maszynie'],
    ['Wyciskanie Arnolda siedząc','Hantle','Zacznij z hantlami przed barkami i dłońmi skierowanymi w stronę twarzy. Wyciskając, płynnie obróć dłonie do przodu. Odwróć ruch podczas opuszczania.','Arnold press','Arnoldki',{barki:1,triceps:.6,czworoboczny:.2}],
    ['Wznosy hantli przed siebie','Hantle','Z lekko ugiętymi łokciami unieś hantle przed siebie do wysokości barków. Opuść je w kontrolowany sposób bez kołysania tułowiem.','Front raise','Unoszenie hantli przodem',{barki:1,czworoboczny:.2}],
    ['Wyciskanie sztangi w uchwycie landmine jednorącz','Sztanga','Trzymaj wolny koniec zamocowanej sztangi przy barku. Wyciśnij go po skosie w górę i wróć, utrzymując stabilny tułów.','Landmine press','Wyciskanie landmine',{barki:1,triceps:.6,klatka:.45,skosy:.25}],
    ['Odwrócone rozpiętki na wyciągu','Wyciąg','Chwyć linki skrzyżowanymi rękami na wysokości barków. Przy lekko ugiętych łokciach rozsuń ramiona na boki i wróć bez bujania.','Cable reverse fly','Rear delt cable fly','Rozpiętki na tył barków na wyciągu',{barki_tyl:1,srodek_plecow:.55,oble:.4}],
  ]],
  ramiona: ['Ramiona', [
    ['Uginanie ramion','Hantle','Trzymaj łokcie przy bokach i zegnij je bez bujania tułowiem. Opuść hantle powoli do komfortowego wyprostu.'],
    ['Młotki','Hantle','Trzymaj hantle neutralnym chwytem, z kciukami skierowanymi w górę. Zegnij łokcie bez wysuwania ich do przodu, po czym opuść hantle spokojnie.'],
    ['Uginanie ramion ze sztangą łamaną','Sztanga','Złap gryf w wygodnym ustawieniu nadgarstków. Zegnij łokcie, trzymając je blisko boków, po czym opuść gryf bez kołysania tułowiem.','EZ-bar curl'],
    ['Uginanie ramion na ławce skośnej','Hantle','Oprzyj plecy i pozwól ramionom swobodnie zwisać. Ugnij łokcie bez wysuwania barków i powoli opuść hantle.'],
    ['Uginanie na modlitewniku','Maszyna','Oprzyj ramiona na poduszce i dopasuj siedzisko do osi łokcia. Ugnij łokcie bez odrywania ramion. Opuść ciężar pod kontrolą.','Preacher curl'],
    ['Prostowanie ramion','Wyciąg','Przytrzymaj łokcie przy bokach i prostuj je, wypychając uchwyt w dół. Wróć, zginając łokcie bez unoszenia ramion lub barków.'],
    ['Prostowanie ramion nad głową na wyciągu','Wyciąg','Ustaw się tyłem do bloczka i skieruj łokcie do przodu. Wyprostuj przedramiona nad głową bez poruszania tułowiem, a potem zegnij łokcie pod kontrolą.'],
    ['Prostowanie ramion z liną na wyciągu','Wyciąg','Trzymaj łokcie blisko tułowia. Wyprostuj ramiona w dół, rozsuń lekko końce liny i wróć bez przesuwania łokci do przodu.'],
    ['Dipy','Masa ciała','Podeprzyj się na poręczach i ugnij łokcie do komfortowej głębokości. Utrzymaj kontrolę barków i wróć do podporu, nie odbijając z dołu.'],
    ['Dipy z asystą','Maszyna','Ustaw przeciwwagę i przyjmij stabilny podpór na poręczach. Opuść się w kontrolowanym zakresie i wyprostuj łokcie bez odpychania się nogami.'],
    ['Wyciskanie francuskie','Sztanga','Zacznij ze sztangą nad klatką i ramionami ustawionymi stabilnie. Ugnij łokcie, opuszczając gryf w stronę czoła lub za głowę, po czym spokojnie wyprostuj ramiona.'],
    ['Uginanie nadgarstków','Hantle','Podeprzyj przedramiona i wysuń dłonie poza krawędź ławki. Zegnij nadgarstki i powoli opuść hantle, utrzymując przedramiona nieruchomo.'],
    ['Uginanie ramienia z hantlą w podporze o udo','Hantle','Usiądź i oprzyj tył ramienia o wewnętrzną stronę uda. Ugnij łokieć, nie odrywając ramienia, i opuść hantlę powoli.','Concentration curl','Uginanie w koncentracji',{biceps:1,przedramiona:.25}],
    ['Uginanie ramion nachwytem ze sztangą','Sztanga','Złap gryf nachwytem i utrzymuj nadgarstki w jednej linii z przedramionami. Ugnij łokcie przy bokach i opuść gryf bez zamachu.','Reverse curl','Uginanie nachwytem',{przedramiona:1,biceps:.55}],
    ['Uginanie ramienia na wyciągu z linką za plecami','Wyciąg','Stań tyłem do niskiego bloczka z ramieniem lekko za tułowiem. Ugnij łokieć bez wysuwania barku i wróć pod kontrolą.','Bayesian curl','Bayesian cable curl',{biceps:1,przedramiona:.25}],
    ['Wyciskanie sztangi wąskim chwytem','Sztanga','Złap gryf mniej więcej na szerokość barków. Opuść go pod kontrolą, prowadząc łokcie bliżej tułowia, a potem wyciśnij bez odbijania.','Close-grip bench press','Wyciskanie wąsko',{triceps:1,klatka:.75,barki:.45}],
    ['Prostowanie ramienia z hantlą w opadzie','Hantle','Podeprzyj się jedną ręką o ławkę. Ustaw ramię ręki z hantlą wzdłuż tułowia, wyprostuj łokieć i wróć bez poruszania ramieniem.','Triceps kickback','Kickback z hantlą',{triceps:1}],
  ]],
  brzuch: ['Brzuch', [
    ['Plank','Masa ciała','Ustaw łokcie pod barkami. Napnij brzuch i pośladki, utrzymaj miednicę w jednej linii z tułowiem i oddychaj bez opuszczania bioder.'],
    ['Deska boczna','Masa ciała','Ustaw łokieć pod barkiem i unieś biodra. Utrzymaj ciało w jednej linii, z biodrami ustawionymi jedno nad drugim. Oddychaj spokojnie.','Side plank'],
    ['Brzuszki','Masa ciała','Ugnij nogi i oprzyj stopy. Zbliż żebra do miednicy, unosząc łopatki i nie ciągnąc głowy rękami. Opuść tułów powoli.'],
    ['Spięcia brzucha na maszynie','Maszyna','Dopasuj siedzisko i oprzyj stopy. Zbliż żebra do miednicy, prowadząc ruch brzuchem. Wróć powoli bez ciągnięcia samymi rękami.','Ab crunch'],
    ['Unoszenie nóg','Masa ciała','Unoś nogi bez zamachu. Podwiń lekko miednicę w górnej fazie i opuść nogi pod kontrolą, utrzymując napięty brzuch.'],
    ['Russian twist','Masa ciała','Usiądź stabilnie z ugiętymi kolanami. Skręcaj klatkę piersiową na boki przy możliwie nieruchomej miednicy. Rób ruch płynnie, bez szarpania ciężarem.'],
    ['Spięcia brzucha na wyciągu w klęku','Wyciąg','Uklęknij przed górnym bloczkiem z liną przy głowie. Zbliż żebra do miednicy i wróć pod kontrolą, utrzymując biodra w podobnej pozycji.','Cable crunch','Brzuszki na wyciągu',{brzuch:1,skosy:.4}],
    ['Martwy robak','Masa ciała','Połóż się na plecach z uniesionymi rękami i ugiętymi nogami. Opuszczaj przeciwną rękę i nogę, utrzymując stabilną miednicę, i zmień stronę.','Dead bug',{brzuch:1,skosy:.65}],
    ['Wyciskanie antyrotacyjne na wyciągu (Pallof press)','Wyciąg','Stań bokiem do bloczka ustawionego na wysokości klatki. Wypchnij uchwyt przed siebie i wróć, pilnując, żeby klatka nie obracała się w stronę wyciągu.','Pallof press','Pallof',{skosy:1,brzuch:.7}],
    ['Odwrotne spięcia brzucha','Masa ciała','Połóż się na plecach i zegnij nogi. Podwiń miednicę, unosząc biodra nieco nad podłogę, a potem opuść je pod kontrolą bez wymachu nogami.','Reverse crunch','Odwrotne brzuszki',{brzuch:1,skosy:.4}],
  ]],
};

// Keep the stored exercise names as stable keys for existing plans and records.
const displayNames = {
  'Wyciskanie leżąc':'Wyciskanie sztangi na ławce płaskiej',
  'Wyciskanie hantli':'Wyciskanie hantli na ławce płaskiej',
  'Wyciskanie hantli na skosie':'Wyciskanie hantli na ławce skośnej',
  'Wyciskanie na maszynie':'Wyciskanie na klatkę na maszynie',
  'Rozpiętki':'Rozpiętki z hantlami',
  'Pec-deck (rozpiętki na maszynie)':'Rozpiętki na maszynie (pec-deck)',
  'Podciąganie':'Podciąganie na drążku nachwytem',
  'Podciąganie z asystą':'Podciąganie na maszynie z przeciwwagą',
  'Wiosłowanie sztangą':'Wiosłowanie sztangą w opadzie tułowia',
  'High row':'Przyciąganie uchwytów z góry na maszynie (high row)',
  'Ściąganie drążka':'Ściąganie drążka wyciągu górnego',
  'Przyciąganie V-grip':'Przyciąganie uchwytu V na wyciągu dolnym',
  'Ściąganie linki prostymi rękami':'Ściąganie linki wyciągu na prostych ramionach',
  'Face pull':'Przyciąganie liny do twarzy (face pull)',
  'Szrugsy':'Szrugsy z hantlami',
  'Prostowanie grzbietu na ławce 45°':'Prostowanie tułowia na ławce rzymskiej',
  'Przysiad':'Przysiad ze sztangą',
  'Hack squat':'Przysiad na suwnicy skośnej (hack squat)',
  'Martwy ciąg rumuński (RDL)':'Rumuński martwy ciąg ze sztangą (RDL)',
  'Martwy ciąg':'Martwy ciąg klasyczny ze sztangą',
  'Suwnica':'Wypychanie nóg na suwnicy',
  'Wykroki':'Wykroki z hantlami',
  'Przysiad bułgarski':'Przysiad bułgarski z hantlami',
  'Hip thrust':'Unoszenie bioder ze sztangą (hip thrust)',
  'Hip thrust na maszynie':'Unoszenie bioder na maszynie (hip thrust)',
  'Uginanie nóg':'Uginanie nóg na maszynie leżąc',
  'Uginanie nóg siedząc':'Uginanie nóg na maszynie siedząc',
  'Prostowanie nóg':'Prostowanie nóg na maszynie',
  'Wspięcia na palce':'Wspięcia na palce stojąc na maszynie',
  'Wspięcia na palce siedząc':'Wspięcia na palce siedząc na maszynie',
  'Wyciskanie nad głowę (OHP)':'Wyciskanie żołnierskie (OHP)',
  'Unoszenie bokiem':'Wznosy hantli bokiem',
  'Unoszenie bokiem na wyciągu':'Wznosy ramion bokiem na wyciągu',
  'Unoszenie w opadzie':'Wznosy hantli w opadzie tułowia',
  'Peck-deck tył barku':'Odwrócone rozpiętki na maszynie',
  'Uginanie ramion':'Uginanie ramion z hantlami',
  'Młotki':'Uginanie ramion chwytem młotkowym',
  'Uginanie na modlitewniku':'Uginanie ramion na modlitewniku na maszynie',
  'Prostowanie ramion':'Prostowanie ramion na wyciągu',
  'Dipy':'Pompki na poręczach (dipy)',
  'Dipy z asystą':'Pompki na poręczach z przeciwwagą',
  'Plank':'Deska (plank)',
  'Unoszenie nóg':'Unoszenie nóg w zwisie',
  'Russian twist':'Skręty tułowia w siadzie (russian twist)',
};

export const categories = Object.entries(groups).map(([key,[label]])=>[key,label]);
export const catalog = Object.entries(groups).flatMap(([group,[,entries]])=>
  entries.map(([label,equipment,technique,...details])=>{
    const weights=typeof details.at(-1)==='object'?details.pop():undefined;
    return {group,label,display:displayNames[label]??label,equipment,technique,aliases:details,weights};
  }));

export const normalize = name => name.toLowerCase().trim().normalize('NFD').replace(/\p{M}/gu,'').replaceAll('ł','l').replace(/\s+/g,' ');
export const catalogWeights=new Map(catalog.filter(item=>item.weights).map(item=>[normalize(item.label),item.weights]));
const catalogNames=new Map(catalog.flatMap(item=>[item.label,item.display,...item.aliases,englishExercises[item.label][0]].map(name=>[normalize(name),item])));
export const exerciseKey = name => normalize(catalogNames.get(normalize(name))?.label??name);
export const exerciseLabel = name => catalogNames.get(normalize(name))?.display??name;
const machineEquipment=new Set(['Maszyna','Wyciąg','Suwnica Smitha']);
export const hasMachineSettings = name => machineEquipment.has(catalogNames.get(normalize(name))?.equipment);
export const isBodyweightExercise = name => catalogNames.get(normalize(name))?.equipment==='Masa ciała';
export function localizedExerciseLabel(name){
  const item=catalogNames.get(normalize(name));
  if(!item) return name;
  return uiLocale()==='en-GB'?englishExercises[item.label][0]:item.display;
}
const searchText=name=>normalize(name).replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function matchesExercise(item,query){
  const needle=searchText(query);
  if(!needle) return true;
  const compact=needle.replaceAll(' ','');
  const english=Object.hasOwn(englishExercises,item.label)?englishExercises[item.label][0]:'';
  return [item.label,item.display,english,item.equipment,t(item.equipment),...(item.aliases??[])].some(value=>{
    if(!value) return false;
    const searchable=searchText(value);
    return searchable.includes(needle)||searchable.replaceAll(' ','').includes(compact);
  });
}
export function exerciseTechnique(item){
  return uiLocale()==='en-GB'&&item&&Object.hasOwn(englishExercises,item.label)?
    englishExercises[item.label][1]:item?.technique;
}
