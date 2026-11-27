# Schede investimento DiSalento

Strumento interno di Riquality S.r.l.s. (marchio DiSalento) per preparare e condividere le schede di investimento immobiliare.

- **Strumento:** https://antoniodenuccio1995-a11y.github.io/disalento.schedeint/
- **Sorgente:** [`index.html`](index.html), una sola pagina con HTML, CSS e JavaScript. Le librerie per PDF, Excel e ZIP arrivano da cdnjs.
- **Roadmap:** [`ROADMAP.md`](ROADMAP.md)
- **Note tecniche e prove:** [`HANDOFF.md`](HANDOFF.md), cartella [`test/`](test/)

## Cosa fa

- **Scheda A4** in 3 pagine (o 2 nella versione compatta):
  - conti dell'operazione con la rivendita prevista in testa;
  - riquadro dell'investitore (quanto versa, quanto riceve, guadagno, rendimento, pareggio);
  - dettaglio dei conti, divisione del ricavato, scenari e prove di stress;
  - comparabili di zona e foto.
- **Moduli** da accendere e spegnere, spostare tra le pagine, mettere a riga intera o a mezza riga, con spazi regolabili.
- **Grafici spegnibili:**
  - dal prezzo all'utile;
  - quanto riceve l'investitore se il prezzo cambia;
  - dove va il capitale;
  - prezzo al m² rispetto alla zona.
- **Aspetto:** colori e caratteri modificabili; copertina, galleria di 3 foto (anche planimetria) e logo.
- **Pannello in cinque schede:** Casa, Conti, Scenari, Testi, Aspetto; gli avvisi “Da sistemare” portano alla sezione da correggere.
- **Pannello rapido:** tocchi un riquadro nell'anteprima e cambi lì le sue scritte, gli importi e cosa mostrare.
- **Scritte:** tutte modificabili, anche quelle dei grafici e delle tabelle.
- **Importi:** esatti, arrotondati o in k (185k €), per tutta la scheda, per riquadro o, nei conti e nel riquadro dell'investitore, riga per riga.
- **Scenari:** nel grafico e nella tabella si sceglie cosa mostrare.
- **Pagine:** da 1 a 12, con zoom dell'anteprima; chi apre il link vede una vista web e può scaricare il PDF.
- **Download:** PDF, Excel con formule, dati (.json), ZIP completo e pagina 1 in JPG per WhatsApp.
- **Condividi:**
  - la scheda viene salvata online e si aggiorna da sola per chi ha il link;
  - il link dell'investitore (`&v=1`) è sempre in sola lettura;
  - il link con `#k=` serve per modificare ed è solo per noi.
- **Le mie schede:** pannello laterale con tutte le schede, aperto con un codice personale valido su tutti i dispositivi. Cartelle, ricerca, cestino (le schede eliminate si ripristinano per 30 giorni). Dal menu Altro si creano anche una **Nuova scheda** e un **Duplicato**.
- **Tutta pagina:** l'anteprima occupa tutto lo schermo.

Tutti i valori sono al lordo delle imposte.

## Dati

- **Dove stanno:** le schede sono su Supabase, nella tabella `sc_schede`, a cui si accede solo tramite funzioni. Le migrazioni sono in [`supabase/migrations/`](supabase/migrations/) e sono già applicate al progetto `cqfxjvrpspvycocvxghv`.
- **Chiavi e codici:** la chiave di modifica è salvata solo come impronta bcrypt, il codice dell'archivio solo come impronta sha256.
- **La parte pubblica:** il repository è pubblico perché GitHub Pages gratuito lo richiede. Contiene solo lo strumento: le schede, con numeri e foto, restano sul database e si vedono solo con il loro link.

## Pubblicazione

GitHub Pages pubblica la cartella principale di `main`: Settings → Pages → Deploy from a branch → `main` / `(root)`.

Per un dominio aziendale (per esempio `schede.disalento.it`):
1. Nel DNS aggiungere un record CNAME `schede` che punta a `antoniodenuccio1995-a11y.github.io`.
2. Impostare il dominio in Settings → Pages.
3. Aggiornare gli indirizzi in `og:image` dentro `index.html`.

## Calcoli

- prezzo = somma della composizione (m² × €/m², oppure importo a corpo)
- costi di vendita = costi fissi + prezzo × somma delle percentuali
- utile = prezzo − capitale − costi di vendita
- quota investitore = utile × quota % se l'utile è positivo; se c'è perdita, la perdita è tutta dell'investitore e la quota della società è 0
- rientro dell'investitore = capitale + quota investitore
- pareggio = (capitale + costi fissi) / (1 − percentuali / 100)
