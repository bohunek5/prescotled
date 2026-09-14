# Sterowniki PR i zasilacze PR-MAD

Opracowanie: 14 września 2026. Źródło danych: lokalne karty PRESCOT PDF i istniejące strony rodzin w repozytorium `prescotpl`, odczytane bez modyfikacji. Fotografie i dokumenty skopiowano do `assets/components/`; nie przetwarzano samych dokumentów ani zdjęć.

## PR-MAD: znaczenie autodetekcji

Każda z sześciu kart producenta zawiera sekcję „Inteligentna technologia Auto-Identify (12V / 24V)”. Określa ona automatyczne rozpoznanie i dostosowanie **napięcia wyjściowego 12 lub 24 V DC**. Punkt 5 montażu na stronie 2 również potwierdza automatyczne rozpoznanie 12/24 V po załączeniu zasilania. Nie jest to autodetekcja sygnału sterującego.

Nie dopisano autodetekcji mocy, protokołu DALI, rodzaju taśmy RGB/CCT, automatycznego bilansowania obwodów ani jednoczesnych niezależnych wyjść 12 i 24 V. Karta nie podaje zakresu minimalnego obciążenia wykrywania, więc nowy opis go nie określa. Nie przeniesiono absolutnej obietnicy wyeliminowania każdej pomyłki instalacyjnej.

| Model | Moc | Wymiary L × W × H | EAN |
| --- | ---: | --- | --- |
| PR-MAD36-1224 | 36 W | 145 × 50 × 29 mm | 5905475368073 |
| PR-MAD60-1224 | 60 W | 145 × 50 × 29 mm | 5905475368080 |
| PR-MAD100-1224 | 100 W | 176 × 50 × 29 mm | 5905475368097 |
| PR-MAD150-1224 | 150 W | 199 × 50 × 29 mm | 5905475368103 |
| PR-MAD200-1224 | 200 W | 218 × 50 × 29 mm | 5905475368110 |
| PR-MAD300-1224 | 300 W | 240 × 50 × 29 mm | 5905475368127 |

Wspólne parametry potwierdzone we wszystkich kartach: wejście 180–265 V AC 50/60 Hz, wyjście DC 12/24 V, obudowa aluminiowa półzalewana, IP20 oraz 36 miesięcy gwarancji. Nie należy przypisywać im 7-letniej gwarancji zasilaczy Scharfer.

Pliki źródłowe: `prescotpl/assets/showcase/pr-mad-{36,60,100,150,200,300}w.pdf`. Zdjęcia: `prescotpl/assets/prmad/pr-mad-{moc}w.webp`. Zastosowania i krótkie opisy: `prescotpl/zasilacze-led/index.html`.

Karty 150/200/300 W podają kolejność natężeń przeciwną do kolejności napięć w wierszu powyżej (np. 150 W: 6,25 A / 12,5 A przy nagłówku 12 V / 24 V). `components.js` nie kopiuje tego niejednoznacznego wiersza. Moc i napięcie są jednoznacznie potwierdzone.

## Sterowniki PRESCOT PR

| Model | Kanały | Przeznaczenie | EAN |
| --- | ---: | --- | --- |
| PR-MONO-12A | 1 | Jednobarwna taśma | 5905475368011 |
| PR-CCT-12A | 2 | Ciepła i zimna biel | 5905475368004 |
| PR-RGB-12A | 3 | Trzy kanały RGB | 5905475368028 |
| PR-RGBW-12A | 4 | RGB i oddzielna biel | 5905475368042 |
| PR-RGBCCT-12A | 5 | RGB oraz ciepła i zimna biel | 5905475368035 |

Podstawą specyfikacji są indywidualne karty `prescotpl/assets/controllers/pr-{mono,cct,rgb,rgbw,rgbcct}-12a.pdf`:

- Napięcie wejściowe i wyjściowe: 12 lub 24 V DC. Odbiornik nie zmienia napięcia zasilania.
- Maksymalny prąd: 12 A **łącznie**, nie 12 A na każdy kanał. Całkowite obciążenie wynosi maks. 144 W przy 12 V lub 288 W przy 24 V. Wartość jest sumą kanałów i nie zastępuje ograniczeń poszczególnych wyjść.
- Sterowanie RF 2,4 GHz, zasięg do 30 m, IP20.
- Odbiornik 74,5 × 35,6 × 16,5 mm; pilot 140,5 × 37,5 × 15,5 mm. Rysunek na stronie 2 każdej karty potwierdza te wymiary i uchwyt 85 × 40,7 × 6,5 mm.
- Każdy zestaw obejmuje odbiornik, pilot oraz uchwyt magnetyczny.
- Indywidualne karty podają **24 miesiące gwarancji**. Ogólna stara strona `prescotpl/sterowniki/index.html` podaje 5 lat bez przypisania do tych konkretnych modeli; tę wartość pominięto.

Instrukcja `prescotpl/assets/controllers/instrukcja-serii.pdf` potwierdza zasilanie pilota 3 V (2 baterie AAA), obsługę suwaka, uchwyt magnetyczny oraz zasadę Vin = Vout. Sterowanie głosowe i aplikacją wymaga dodatkowej bramki, której nie opisujemy jako wyposażenia zestawu. Retransmisja zależy od zasięgu pomiędzy urządzeniami; nie kopiujemy obietnicy „niemal nieograniczonego” zasięgu.

Wspólna instrukcja ma rozbieżności względem indywidualnych kart: 5–24 V zamiast 12/24 V, inne zakresy temperatur, 6 A na kanał u wszystkich modeli. Z tego powodu katalog nowej strony podaje napięcie 12/24 V z karty modelu, maksymalnie 12 A łącznie i nie publikuje sprzecznego prądu per kanał. Nie zakłada też, że sterownik CCT narzuca zakres temperatury bieli 2700–6500 K: faktyczny zakres wynika z taśmy.

W karcie MONO opis zawiera omyłkowe określenie zmiennej temperatury bieli; model ma jeden kanał i służy do regulacji jasności. Nowy opis nie powiela tej pomyłki. W tabeli MONO jednostka wysokości pilota została ucięta do „m”, ale strona 2 jednoznacznie pokazuje 15,5 mm.

## Materiały

Skopiowano 43 pliki (około 19 MB): 6 zdjęć i 6 PDF zasilaczy, po 4 zdjęcia, 1 PDF i 1 krótki MP4 dla każdego z pięciu sterowników oraz wspólną instrukcję PDF. Strona może pobierać dokumenty i filmy dopiero po kliknięciu. Zdjęcia główne obejmują zestaw; dodatkowe `receiverImage` i `remoteImage` pokazują poszczególne elementy.

Wizualny przegląd wszystkich 20 zdjęć sterowników ujawnił odwrócone nazwy plików MONO: `mono-receiver.webp` przedstawia pilot, a `mono-detail.webp` biały odbiornik. Powiązania `receiverImage` i `detailImage` dla MONO zostały zamienione w danych, bez edycji oryginalnych zdjęć. Pozostałe cztery fotografie odbiorników są zgodne z nazwami.

## Odczyt stylu Scharfer

Przejrzano tylko pliki `scharfer-redesign/src/app/style.css`, `globals.css`, stronę główną oraz `components/InteractiveDiagram.tsx`. Projekt został bez zmian.

Scharfer używa białego i jasnoszarego tła, mocnego czerwonego akcentu `#E60000`, ciemnych nagłówków `#111827`, obszaru treści do 1500 px oraz odstępów sekcji 4–8 rem. Są tam duże fotografie produktu, schemat z ponumerowanymi miejscami i osobnymi opisami oraz naprzemienne bloki zdjęcie/tekst. W katalogu występują zaokrąglenia 12 px i rozpisane parametry modeli. Styl typograficzny jest mniej spójny: `style.css` wskazuje Inter, `globals.css` Arial, a część nagłówków ma Outfit.

Do PRESCOT LED warto przejąć czytelny podział na konkretne modele i opis elementów produktu. Typografia, ciepłe tło, granatowe przyciski i pomarańcz powinny pozostać zgodne z nowym projektem oraz konfiguratorem; czerwony motyw Scharfer dotyczy tamtej marki. Schemat Scharfer opiera się na zdjęciu i numerowanych punktach — nie jest rzeczywistym modelem 3D.
