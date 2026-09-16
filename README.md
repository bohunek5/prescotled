# PRESCOT LED

Strona producenta: **https://bohunek5.github.io/prescotled/**

Osobny projekt prezentujący taśmy LED PRESCOT, własne zasilacze i sterowniki, produkcję, laboratorium oraz marki w dystrybucji. Zawiera 15 rodzin taśm i ich podstrony, 6 modeli PR-MAD oraz 5 sterowników z obracanymi podglądami 3D. Treści i zdjęcia pochodzą z materiałów firmy; źródła opisano w `docs/`.

## Nawigacja i podstrony

Menu Produkty prowadzi do `/tasmy-led/`, `/zasilacze/` i `/sterowniki/`. Pozostałe podstrony: `/zastosowania/`, `/produkcja/`, `/dystrybucja/`, `/do-pobrania/`, `/kontakt/` oraz `/konfigurator/`. Wszystkie mają wspólne menu i stopkę. Dotychczasowe kotwice strony głównej, w tym `#pokaz`, nadal działają.

`navigation.js/css` obsługuje menu mobilne, rozwijane grupy, aktywne pozycje i klawiaturę. `scripts/site-layout.mjs` jest źródłem nagłówka i stopki; `scripts/build-pages.mjs` buduje podstrony na podstawie sekcji strony głównej. Katalog zachowuje wyszukiwanie i filtr gwarancji w adresie podczas powrotu z karty serii.

## Uruchomienie

```sh
npm ci
npm run build
npm run check
npm run dev
```

Podgląd lokalny: `http://127.0.0.1:4186/`. Test przeglądarkowy: `npm run test:browser` przy uruchomionym serwerze i zainstalowanych przeglądarkach Playwright. Domyślna macierz obejmuje Chromium 320/390/768/1024/1440 px i WebKit 390 px. Raporty można skierować poza projekt przez `QA_DIR=/private/tmp/prescotled-qa`.

Test nowych podstron: `BASE_URL=http://127.0.0.1:4186/ npm run test:navigation`. Kontroluje bezpośrednie wejścia, menu i klawiaturę, początkowy rodzaj produktu, modele 3D, PDF-y, powrót do wyszukiwania i przeniesienie wybranej taśmy do lokalnej strony konfiguratora.

## Edycja

- `index.html`, `style.css`, `app.js`: strona główna i interakcje.
- `data/series.js`: opisy i gwarancje rodzin taśm. `npm run build` odświeża katalog, podstrony `serie/`, sitemapę i stronę 404.
- `data/components.js`: dane 6 zasilaczy i 5 sterowników; `components.js/css` obsługuje wybór modelu i demonstracje.
- `products3d.js/css`: poglądowe modele o wymiarach z kart produktu. Renderowanie odbywa się na żądanie, bez ciągłej pętli w bezruchu.
- `config.js`, `preview.js`: adres konfiguratora, konfiguracje zastosowań i krótki pokaz montażu.
- `assets/`: lokalne zdjęcia, logotypy, karty PDF i filmy.

Gwarancje należy zmieniać zgodnie z aktualną dokumentacją konkretnej rodziny lub modelu. PR-MAD ma 3 lata, sterowniki PR-…-12A 2 lata, a rodziny taśm 7, 5 lub 3 lata.

## Konfigurator i publikacja

Pełny konfigurator działa w ramce na lokalnej stronie `/konfigurator/`. Silnik i zasoby są nadal pobierane z `https://bohunek5.github.io/prescotpl/konfigurator/`. Strona przekazuje ustawienia przez `#config=…`; menu oraz pasek adresu pozostają w PRESCOT LED. Na GitHub Pages ramka i strona mają wspólny origin, więc link powrotu wewnątrz studia wraca do lokalnego katalogu. Opcjonalny link otwiera samodzielne studio w nowej karcie. Pokaz montażu importuje jego istniejący moduł `welcome-film.js`; Three.js również pochodzi z opublikowanego katalogu `vendor/`. Bez WebGL lub dostępu do modułu pozostaje zdjęcie i link do konfiguratora.

Nie trzeba budować aplikacji podczas odwiedzin: GitHub Pages publikuje gotowe pliki z gałęzi `main`, katalogu `/`. Przed commitem zmian danych uruchom `npm run build && npm run check`, a dla zmian interakcji również test przeglądarkowy. Pliki `node_modules/`, `output/` i `qa/` są ignorowane.

Repozytoria `prescotpl` i `prescot-led-studio` są odrębne. Aktualizacje tej strony nie wymagają ich modyfikacji.
