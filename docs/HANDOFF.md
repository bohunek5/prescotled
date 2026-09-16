# Aktualizacja — 16 września 2026

Na prośbę użytkownika dopracowano nawigację i dodano 9 pełnych podstron, zachowując wygląd strony głównej i istniejący pokaz sześciu sekund. Menu Produkty / O firmie jest wspólne dla strony głównej, 15 stron serii i nowych podstron. Mobile: rozwijanie grup, Escape, fokus, blokada przewijania tła. Stopka zawiera mapę podstron. Strona 404 ma tę samą nawigację.

Konfigurator otwiera się teraz wewnątrz `/prescotled/konfigurator/` jako iframe istniejącego studia, z zachowaniem `#config=…`. Silnik nie został skopiowany ani zmieniony. Na wspólnym origin GitHub Pages link powrotu i logo ramki kierują do nowej witryny. Pełne warunki gwarancji, prywatność i dokumentacja źródłowa otwierają się jako jawnie opisane linki w nowej karcie; główna nawigacja, marki i karty oferty pozostają lokalne.

Źródła: `scripts/site-layout.mjs`, `scripts/build-pages.mjs`, `navigation.js/css`, `app.js`; generacja `npm run build`. Nowy test `npm run test:navigation`. Domyślna strona katalogu pokazuje wszystkie 15 serii, strona główna zachowuje filtr 7 lat. Wyszukiwanie i gwarancja są w query string, dzięki czemu wracają po przejściu z produktu.

Weryfikacja lokalna: `npm run check` — 26 dokumentów HTML i 1165 lokalnych odnośników. Oba zestawy testów przeglądarkowych PASS: Chromium 320/390/768/1024/1440, WebKit 390. Raporty i zrzuty: `/private/tmp/prescotled-navigation-qa/`. Test wspólnego origin obejmuje osadzenie wybranego modelu i powrót ze środka ramki do katalogu.

Poniżej stan sprzed tej aktualizacji; uwagi o zewnętrznym przejściu do konfiguratora są historyczne.

# Stan projektu — 15 września 2026

Docelowa strona: https://bohunek5.github.io/prescotled/ ; osobne repozytorium `bohunek5/prescotled`.

## Uzgodniony zakres

Własna marka PRESCOT LED i polska produkcja taśm są głównym tematem strony. KLUŚ, ELBA, Scharfer oraz MiBoxer mają oddzielną sekcję dystrybucji. Wzornictwo nawiązuje do konfiguratora: jasne tło, duża prosta typografia, granatowe przyciski i subtelne ciepłe akcenty.

Gotowe funkcje: 15 serii i podstrony, filtrowanie gwarancji 7/5/3, wyszukiwanie, 11 podglądów 3D zasilaczy/sterowników, prezentacja autodetekcji 12/24 V i regulacji światła, pokaz montażu DELUX 3 w 1, zastosowania w kuchni/schodach/meblach, produkcja z filmem, laboratorium, dokumenty oraz kontakt.

Przekroje, akcesoria i pełne modelowanie są obsługiwane przez istniejący zewnętrzny konfigurator. Pokaz korzysta z jego wersji `1deadf165ec6`: sześć sekund montażu, usunięcie podkładu 3M, wklejenie PCB, osłona, zaślepki i jedno łagodne zapalenie światła. Na ostatnią prośbę użytkownika nie ma pokazu LOW/MEDIUM/HIGH. Zachować opisowe podpisy montażu i zgodność wersji w config.js oraz preview.js. Nowa strona nie modyfikuje jego źródeł ani katalogu produktów.

## Źródła i ograniczenia

Zobacz `content-sources.md`, `components-sources.md`, `assets.md`. Nie uogólniać gwarancji DELUX na wszystkie produkty. Zdjęcia zastosowań opisano jako inspiracje, nie jako udokumentowane realizacje firmy. Modele zasilaczy i sterowników są poglądowe, z wymiarami według kart; dokładne zdjęcia i schematy znajdują się w załączonych kartach każdego modelu.

Nie dodano koszyka, cennika ani fikcyjnego formularza. Zapytania kierują do prawdziwego działu sprzedaży; konfigurator pozostaje osobną aplikacją.

## Kontynuacja

Pracować wyłącznie w tym repozytorium. Nadrzędny katalog `my-ai-agents` zawiera wiele niepowiązanych zmian — nie wykonywać w nim `git add .`. Przed publikacją odświeżyć generowane podstrony i przeprowadzić kontrole opisane w README.
