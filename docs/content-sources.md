# Źródła treści PRESCOT LED

Stan opracowania: 14 września 2026. Źródłowe repozytorium `prescotpl` i aplikacja `prescot-led-studio` zostały odczytane bez zmian. Treści nowej strony dotyczą własnej oferty taśm PRESCOT LED. KLUŚ, ELBA, Scharfer i MiBoxer są prezentowane osobno jako marki w dystrybucji.

## Rodziny taśm i gwarancje

Podstawą podziału na 7, 5 i 3 lata są karty rodzin w `prescotpl/tasmy-led/index.html`, elementy `.elementor-testimonial`. Każda karta zawiera nazwę oraz okres gwarancji; źródłowe opisy zastosowań pochodzą ze stron poszczególnych rodzin. DELUX 3 w 1 jest potwierdzony osobną kartą producenta.

| Identyfikator | Seria | Lata | Opis źródłowy |
| --- | --- | ---: | --- |
| threeinone | DELUX 3 w 1 | 7 | `prescot-led-studio/assets/sources/delux-3in1.pdf`, s. 1–2 |
| delux-pro | DELUX PRO | 7 | `prescotpl/dpro/index.html` |
| delux-low-brightness | DELUX Low Brightness | 7 | `prescotpl/dlow/index.html` |
| delux-slim | DELUX Slim | 7 | `prescotpl/dslim4/index.html` |
| delux-standard | DELUX 160LED Standard | 7 | `prescotpl/160s/index.html` |
| true-color | DELUX True Color | 7 | `prescotpl/truecolor/index.html` |
| delux-high-brightness | DELUX High Brightness | 7 | `prescotpl/dhigh/index.html` |
| onecut | OneCut | 5 | `prescotpl/onecut/index.html` |
| bread | Bread | 5 | `prescotpl/produkt/index.html` |
| premium-dense | Premium 70 / 120 / 140 / 210 | 5 | `prescotpl/p70140210/index.html` |
| premium-classic | Premium 60 / 120 | 5 | `prescotpl/p60120/index.html` |
| premium-s-shape | Premium S-Shape | 5 | `prescotpl/special/index.html` |
| premium-rgbw | Premium RGBW | 5 | `prescotpl/prgbw/index.html` |
| cob | Premium COB | 3 | `prescotpl/dslim4-copy/index.html` |
| cob-digital | Premium COB Digital | 3 | `prescotpl/cobdigital/index.html` |

Nie przenosimy 7-letniej gwarancji na całą ofertę ani na marki dystrybuowane. OneCut zachowuje 5 lat, mimo występującej w starszym opisie nazwy „Delux OneCut”. Seria COB pozostaje podzielona od polskich serii SMD: nie dodano jej odznaki „Polska produkcja” bez potwierdzenia konkretnego modelu. Usługa własnego brandu/OEM nie jest serią z ustalonym jednym okresem gwarancji.

## DELUX 3 w 1

PDF producenta dotyczy modelu `24D160-11-3080-1010`. Strona 1 potwierdza 84 miesiące gwarancji, 24 V, tryby 3 / 6 / 11 W/m, 160 LED/m, 3000 K, moduł cięcia 50 mm i szerokość 10 mm. Strona 2 pokazuje cztery pola `+24V / −L / −M / −H`. Gwarancja zależy od prawidłowego przechowywania, montażu i użytkowania; określenie „bezwarunkowa” nie zostało przeniesione do nowej strony.

W wierszu strumienia świetlnego PDF ma niespójne jednostki: `460lm/m - 930lm/W - 1750lm/W`. Nowa prezentacja rodziny nie publikuje tego wiersza, aby nie powielać błędu jednostek. Tryby mocy są podane jednoznacznie i zostały zachowane.

## Redakcja opisów

`data/series.js` zawiera krótki lead w `description`, dwa akapity rozwinięcia w `paragraphs`, cechy i zastosowania. Zachowano charakter oraz przeznaczenie z opisów firmy, skracając je do formy odpowiedniej dla mobilnego katalogu. To opracowanie istniejących tekstów, a nie ich pełny przedruk. Nie dodawano nowych liczb technicznych ani obietnic sprzedażowych. Link `sourceUrl` prowadzi do pełnej istniejącej strony rodziny lub karty produktu.

Celowo nie przeniesiono:

- Sprzecznego opisu skuteczności DELUX PRO: jedna część strony podaje „powyżej 200 lm/W”, inna „nawet 200 lm/W”. Nowa karta nie uogólnia tej liczby na rodzinę.
- Akapitu RGBW o 1,6 W/m, który wygląda na skopiowany z Low Brightness i nie pasuje do wskazanego modelu RGBW.
- Stwierdzeń o całkowitym braku spadków napięcia, zerowym ryzyku przegrzania, identycznej jasności dowolnie długiej instalacji oraz braku olśnienia niezależnie od montażu.
- Zapewnień o identyczności widma True Color ze światłem dziennym i wpływie na samopoczucie. Pozostał zweryfikowany parametr CRI 97 oraz zastosowanie do oddawania barw.
- Zapewnienia, że S-Shape można wyginać „do woli” lub bez ryzyka uszkodzenia. Zachowana jest możliwość gięcia w płaszczyźnie podkładu.
- Sterowania COB Digital „piksel po pikselu” rozumianego jako pojedynczy mikrochip. Nowy opis mówi o adresowalnych sekcjach; ich liczba zależy od modelu.
- Gwarancji, że każda taśma SMD daje linię bez punktów w każdym profilu. Wskazano rolę osłony i głębokości profilu.

## Powiązania z konfiguracją

Identyfikatory `configStrip` zostały sprawdzone w `prescot-led-studio/catalog.js`. Powiązanie zawsze otwiera określony wariant, którego nazwę zawiera `configModelName`:

| Rodzina | Identyfikator konfiguratora | Wariant |
| --- | --- | --- |
| DELUX 3 w 1 | `threeinone` | `24D160-11-3080-1010` |
| DELUX Low Brightness | `delux-lb4014` | `24D001-050-10-WW`, 3000 K |
| DELUX Slim | `slim` | `24DS004-050-4-WW`, 24 V, 3000 K |
| DELUX True Color | `delux` | `24D160-10-3097-810`, CRI 97 |
| Premium S-Shape | `sshape` | `EF018-050-6-WW`, 3000 K |
| Premium RGBW | `premium-rgbw` | `24E033-100-RGBWW50`, 24 V, 3000 K |
| Premium COB | `cob-ip67` | `24EC320WW1IP67`, 24 V, 3000 K, IP67 |

Nie przypisano zwykłego DELUX ani innej zastępczej taśmy do DELUX PRO, Standard, High Brightness, OneCut, Bread, Premium 60/120, Premium 70/120/140/210 oraz COB Digital. Te rodziny mają link do rzeczywistej strony, bez pozornego otwierania nieodpowiedniego wariantu.

W historycznym `prescot-led-studio/assets/sources/strip-records.json` rekord COB LB `24EC384-042-8-WWL` ma wartość 5 lat, sprzeczną z aktualnym podziałem na stronie rodzin (3 lata). Ten rekord nie jest źródłem gwarancji ani modelem startowym nowej karty COB. Wybrany do konfiguracji `24EC320WW1IP67` ma w nazwie produktowej oznaczenie `3Y`; URL źródłowy zapisany w katalogu konfiguratora: `https://prescot.com.pl/pl/p/Tasma-LED-Premium-24V-320ledm-COB-10Wm-3000K-IP67-700lmm-10mm-CRI90-3Y-1m/19273`.

## Kontakt i odrębna dystrybucja

Źródło kontaktu: `prescotpl/kontakt/index.html`. Dane centrali: PRESCOT sp. z o.o., ul. Wileńska 1, 11-500 Giżycko; telefon +48 87 428 21 18; sprzedaż `komponenty@prescot.pl`; sekretariat `sekretariat@prescot.pl`; reklamacje `reklamacje@prescot.pl`; poniedziałek–piątek 8:00–16:00. Nie przenosić starej stopki nazywającej PRESCOT producentem profili architektonicznych.

W sekcji sprzedaży nowej strony podano bezpośredni numer +48 87 777 64 82, potwierdzony w stopce działającej strony https://prescot.pl/polityka-prywatnosci/ (odczyt 14 września 2026). Do tej istniejącej strony prowadzi też link prywatności — eksport `prescotpl` nie zawiera lokalnej kopii polityki.

Źródło podziału dystrybucji: `prescotpl/dystrybucja/index.html`, sekcje `sl-klus`, `sl-elba`, `sl-scharfer`, `sl-miboxer`. Wystarczy opisać konkretne kategorie: KLUŚ — profile, osłony i akcesoria; ELBA — oprawy drogowe, miejskie, parkowe i przemysłowe; Scharfer — zasilacze LED; MiBoxer / Mi-Light — sterowanie oświetleniem. Nie przenosimy niezweryfikowanych uogólnień o pozycji lidera, najwyższej skuteczności ani certyfikacji całego portfolio.
