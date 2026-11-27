# Passaggio di consegne: Schede investimento DiSalento

Note tecniche per riprendere il lavoro in una nuova sessione. Aggiornate al 27 novembre 2026.

Per ripartire: apri una nuova sessione con il repository `antoniodenuccio1995-a11y/disalento.schedeint` e scrivi «Leggi HANDOFF.md e ROADMAP.md e continua».

> Questo repository è pubblico. Qui non vanno messi link con `#k=`, codici dell'archivio, numeri delle schede o analisi interne sulle operazioni.

## Cos'è

- **Scopo:** strumento interno di Riquality S.r.l.s. (marchio DiSalento) per preparare schede di investimento immobiliare da proporre a investitori privati.
- **Indirizzo:** https://antoniodenuccio1995-a11y.github.io/disalento.schedeint/
- **Pubblicazione:** GitHub Pages da `main` / (root), quindi ogni push su `main` va online in un minuto circa.
- **Vecchio indirizzo:** `/Trading-sport/scheda/` rimanda a quello nuovo tenendo `?s=` e `#k=`. Il rinvio sta nel repository `Trading-sport`, cartella `scheda-investimento/`.
- **Valori:** tutti al lordo delle imposte.
- **Lingua:** testi della scheda e dell'interfaccia in italiano, scritti in modo semplice e umano.

## File

| File | Cosa contiene |
|---|---|
| `index.html` | Tutto lo strumento: HTML, CSS e JavaScript in un solo file (circa 1.800 righe). |
| `ROADMAP.md` | Cosa è fatto, cosa manca, proposte. |
| `README.md` | Descrizione per chi apre il repository. |
| `supabase/migrations/` | Copia delle funzioni del database. Le originali applicate stanno in `Trading-sport/supabase/migrations/`. |
| `anteprima.jpg` | Immagine dell'anteprima dei link (Open Graph). |
| `robots.txt` | Blocca l'indicizzazione; c'è anche `noindex` nella pagina. |
| `test/` | Prove automatiche con Playwright (vedi sotto). |
| `logo-disalento.png`, `logo-riquality.png` | Loghi usati in automatico: DiSalento in testata e nella vista web (in bianco sulla foto), Riquality nel piè di pagina. |

## Come è fatto `index.html`

**Librerie.** Arrivano da cdnjs, caricate `async`: html2canvas 1.4.1, jsPDF 2.5.1, SheetJS xlsx 0.18.5, JSZip 3.10.1. I caratteri vengono da Google Fonts e si caricano solo quando li scegli.

**Stato e testi**
- **`S`:** la scheda intera. Si salva in `localStorage` (`scheda-investimento-v2`) se è una bozza locale, su Supabase se è una scheda online.
- **`normalize(o)`:** ogni dato caricato passa di qui. Fa le migrazioni dalle versioni vecchie e accetta solo chiavi note (`lab`, `off`, `fmt`, `layout`, colori, caratteri).
- **`L`:** i testi della scheda.
- **`T(k)`:** restituisce la scritta personalizzata in `S.lab`, altrimenti quella di `L`. Tutte le scritte della scheda passano da `T()`, quindi si possono cambiare tutte; `TESTI` le elenca riquadro per riquadro.
- **`K(k)`:** disegna il titoletto di un blocco, se non è spento.
- **`ON(k)`:** dice se una voce è accesa. `S.off[k] = true` la spegne, così le voci nuove partono accese.

**Moduli e impaginazione**
- **Moduli:** `BLOCKS` è l'elenco dei moduli, `LAYOUT3` l'impaginazione predefinita a 3 pagine, `LAYOUT` quella a 2.
- **`S.layout`:** gli elementi sono `{id, p, w:'full'|'half', on, sp}`, con `S.pagine` da 1 a 12.
- **Mezze righe:** un modulo a mezza riga senza compagno diventa a riga intera.
- **Pagine vuote:** si vedono solo in anteprima (classe `ph-only`) e non vanno nel PDF.

**Disegno**
- **`R`:** contiene un renderer per modulo, che restituisce HTML oppure `{ph}` (un segnaposto solo per l'anteprima).
- **`render()`:** costruisce le pagine A4 (794 × 1123 px) nello `#stage`, controlla le pagine troppo piene e aggiorna riepilogo e avvisi (`checks`, `controlloDati`).
- **`GR`:** i grafici in SVG con colori espliciti, così html2canvas li copia uguali nel PDF.
  - `cascata`: A, dal prezzo all'utile.
  - `prezzi`: B, quanto riceve l'investitore. Le voci si mostrano con `d.vis`.
  - `capitale`: C.
  - `mq`: prezzo al m².

**Pannello di sinistra**
- Le sezioni (`details.sec`) hanno `data-cat` e stanno in cinque schede: Casa, Conti, Scenari, Testi, Aspetto. `setCat()` le cambia e ricorda l'ultima (`sc-cat`); `apriSez(nome)` apre una sezione dal suo titolo, passando alla scheda giusta.
- "Da sistemare prima di inviarla" resta sopra le schede; ogni avviso porta alla sezione da correggere.
- Menu "Altro" in alto: Scheda (nuova, duplica), Scarica (Excel, ZIP, JPG, JSON), Altro (carica, ripristina).

**Pannello rapido**
- Toccando un riquadro dell'anteprima (solo in modifica) si apre `#qp`, scritto da `qpHTML(id)`: importi del riquadro, voci da mostrare, scritte e un tasto per la sezione dei dati.
- Sul computer sta sopra la colonna di sinistra, sul telefono sale dal basso.
- Usa gli stessi gestori dell'editor (`onEdInput`, `onEdChange`); quando si chiude, `lists()` riallinea l'editor.

**Formati e viste**
- **Formato degli importi:**
  - `fmtAbs(n, modo)` con i modi `eur` (esatti), `tondo` (arrotondati) e `k` (185k €).
  - `S.fmt[idModulo]`, oppure `S.fmt._` per tutta la scheda; le righe dei due riquadri principali (`FMT_ROWS`) possono avere un formato loro.
  - `conFmt(id, fn)` imposta il formato mentre si disegna un modulo, grafici compresi.
  - I prezzi al m² restano sempre esatti (`eurX`). L'Excel è sempre esatto.
- **Vista web:** `renderWeb()` mostra cosa vede chi apre il link: foto grande, cifre animate e sezioni che compaiono scorrendo. Il PDF resta quello delle pagine A4.
- **Zoom delle pagine A4:** `fit()` e `setZoom()`, con i livelli in `ZL`. Il livello scelto resta nel browser (`sc-zoom`).

**Download**
- **PDF:** fotografie html2canvas delle pagine, con i link cliccabili.
- **Excel:** con formule vere, che funzionano anche in caso di perdita.
- **Altri formati:** JSON, ZIP e JPG della pagina 1.

## Database (Supabase)

- **Progetto:** `cqfxjvrpspvycocvxghv`, lo stesso dell'app Trading-sport. La chiave pubblicabile è già in `index.html`.
- **Tabella:** `sc_schede`, con RLS attiva e nessuna policy: si accede solo dalle funzioni `security definer`:
  - `sc_crea`, `sc_leggi`, `sc_versione`, `sc_salva`;
  - `sc_verifica`, `sc_elenco`, `sc_collega`, `sc_impronta`.
- **Chiavi e codici:**
  - la chiave di modifica è salvata come impronta bcrypt;
  - il codice dell'archivio come sha256 di `'sc-archivio:' || codice`, almeno 8 caratteri.
- **Salvataggio:** versionato. Se nel frattempo qualcun altro ha salvato arriva l'errore 40001; con la chiave sbagliata arriva il 42501.
- **Modalità:**
  - **bozza locale:** senza `?s=`;
  - **modifica:** `?s=id` più `#k=chiave`. La chiave viene ricordata in `sc-chiavi`, il codice dell'archivio in `sc-codice`;
  - **lettura:** senza chiave, oppure con `&v=1` (sempre in sola lettura). Le schede si aggiornano ogni 8 secondi.
- **Dentro claude.ai:** la CSP blocca Supabase, quindi l'artifact mostra un tasto per aprire il sito.

## Prove automatiche

```bash
cd test && npm install
```

```bash
node test.js ../index.html out/base --photos --exports --mobile
```

```bash
for t in fmt cloud righe pag web logo qp menu; do node $t.js ../index.html out/$t; done
```

`harness.js` serve le librerie e i caratteri da `node_modules` e blocca la rete; `cloud.js` e `web.js` simulano Supabase. Playwright e Chromium sono già installati nelle sessioni cloud.

Le prove controllano:
- PDF, Excel e ZIP;
- telefono senza scorrimento orizzontale;
- condivisione con link in sola lettura e aggiornamento automatico;
- righe dei riquadri;
- pagine aggiunte e tolte;
- vista web su computer e telefono;
- formati degli importi, voci degli scenari e zoom;
- loghi in testata, nel piè di pagina e nella vista web;
- pannello rapido su computer e telefono;
- schede del pannello, menu "Altro" e avvisi che portano alla sezione giusta.

## Regole di lavoro

- Su questo repository si lavora direttamente su `main`, con il permesso di Antonio. Su `Trading-sport` si passa da un branch e da una PR.
- Prima di pubblicare: lanciare le prove e guardare gli screenshot (grafici, pagine A4, telefono).
- Mai nei commit, nel repository o nei messaggi agli investitori: il link con `#k=` e il codice dell'archivio.
- I rapporti interni sui numeri delle operazioni restano fuori dal repository.

## Aperto

- Logo Riquality: quello caricato è piccolo (109 × 119 px); se ne esiste uno più grande, sostituire `logo-riquality.png`.
- Le richieste per venerdì e le proposte sono in `ROADMAP.md`.
