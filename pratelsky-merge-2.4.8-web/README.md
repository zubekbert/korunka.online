# Přátelsky MERGE 2.4.8

Kontrolní hratelná verze slučovací hry ve stylu Suika/Merge. Projekt je napsaný v čistém HTML, CSS a JavaScriptu a používá Matter.js 0.20.0 pro fyziku.

## Spuštění

Nejjednodušší je nahrát celý obsah této složky na webhosting a otevřít `index.html`.

Při lokálním testování je vhodné spustit malý HTTP server:

```bash
python3 -m http.server 8080
```

Potom otevřít `http://localhost:8080`.

Matter.js se načítá z CDN, takže je při prvním načtení potřeba připojení k internetu. Všechny obrázky a zvuky jsou lokální součástí projektu.

## Správné pořadí levelů

Zdenda → Terka → Míra → Karel → Dagmar → Ondra → Tomáš

Tomáš je stejná figurka jako postava označená na obrázku „Řídící“.

## Co obsahuje verze 2.4.1

- všech sedm figurek s průhledným pozadím,
- měkčí supereliptické hitboxy a lehké kutálení po dopadu,
- rychlé slučování stejných postav,
- animaci stažení původních figurek a vyskočení nové,
- částicový efekt a bodový nápis při spojení,
- combo systém se zobrazením `COMBO ×2`, `×3` a dále,
- násobení bodů podle aktuálního comba,
- náhodnou zlatou figurku přibližně jednou za 15 dropů,
- zlatou auru pouze během pádu; po dopadu přežije jen při okamžitém spojení se stejnou figurkou,
- možnost řetězit zlatou větev přes několik bezprostředních merge, jinak aura po dopadu zhasne,
- zlaté jiskry a bodový bonus,
- vlastní syntetický zvuk pro slučování každé úrovně,
- hlas „Já se jmenuji Tomáš Komrska“ při každém vytvoření Tomáše; více hlášek se bezpečně zařadí do fronty,
- automatický světlý a tmavý režim podle času v Praze,
- plynulý přechod vzhledu bez zobrazení času v rozhraní,
- uložení nejlepšího skóre v `localStorage`,
- odemykání postav pouze v aktuálním kole; nová hra začíná znovu prvními třemi.

## Časové pravidlo

- 08:00–17:00 včetně: světlý režim
- 17:01–07:59: tmavý režim

Čas není nikde viditelně napsaný. Aplikace zkusí TimeAPI.io, potom WorldTimeAPI a nakonec bezpečný lokální čas přepočítaný do `Europe/Prague`.

## Ovládání

1. Podrž figurku myší nebo prstem.
2. Posuň ji vodorovně.
3. Puštěním ji shoď.
4. Spojuj stejné postavy.

## Složky

- `assets/characters/` – optimalizované a oříznuté průhledné WebP postavy,
- `assets/audio/` – webová verze Tomášova hlasu,
- `source/` – původní nahrané soubory beze změny,
- `docs/` – zadání, historie, testovací checklist a technické poznámky,
- `test-assets.html` – rychlá vizuální kontrola obrázků a zvuku.

## Důležité ukládání

Ukládá se pouze nejlepší skóre pod klíčem:

```text
pratelsky-merge-best-v24
```

Odemčené postavy, combo ani rozehraná partie se mezi hrami neukládají.

## Přesné pravidlo zlaté figurky ve 2.4.1

Zlatá figurka svítí při pádu. Jakmile dopadne na podlahu nebo na jinou figurku, dostane pouze krátkou technickou toleranci pro zpracování kolize. Pokud se v tomto dopadu spojí se stejným levelem, vzniklá vyšší figurka zůstane zlatá a pravidlo se opakuje. Pokud ke spojení nedojde, aura plynule zhasne a figurka dál funguje jako obyčejná. Dotyk boční stěny zlatou větev neruší.


## Novinka ve verzi 2.4.8

- Na začátku hry i po kliknutí na **Nová hra** se zobrazí falešná načítací obrazovka s rotující hlavou a textem **„Načítání nové hry“**.


## Novinky ve verzi 2.4.8

- Při dosažení **COMBO ×3** se hra krátce zastaví a zobrazí se speciální screen s jedním ze tří nápisů.
- Screen používá dodanou fotografii postavy u počítače.
- Po krátké pauze hra zase automaticky pokračuje.


## Novinky ve verzi 2.4.8

- Na mobilu je nativní pull-to-refresh nahrazen vlastním gestem.
- Při tažení stránky dolů z horní hrany vykoukne smutný muž.
- Po překročení prahu a puštění se spustí vlastní **Nová hra** přes existující fake loading screen.
- Kratší tah se pouze pružně vrátí zpět a hru nerestartuje.


## Vyvážení ve verzi 2.4.8

- Nádoba je přibližně o **10 % užší** a mírně nižší.
- Tomáš je obtížnější na vytvoření, ale hra stále zůstává dobře ovladatelná na mobilu.
- Canvas a dotykové ovládání se nezmenšily; zmenšil se pouze vnitřní herní prostor.


## Novinky ve verzi 2.4.8

- Speciální combo screen se spouští až při **COMBO ×5**.
- Přidány nové varianty screenů a obrázků: ajťák s flákačskými hláškami, spící Tomáš, Tomáš s puškou a Tomáš s velkou hlavou.
- Texty jsou navázané na konkrétní obrázky podle zadání.


## Combo screen 2.4.8

Speciální stop screen se nyní spouští při **COMBO ×5**. Náhodně používá ajťáka s flákačskou hláškou, spícího Tomáše s textem **ODPOČIŇ SI**, Tomáše s puškou s textem **UŽ TOHO OPRAVDU NECH** nebo Tomáše s velkou hlavou s textem **TO JE BLBĚ**.
