# Roadmap – Scheda investimento DiSalento

Aggiornata al 27 novembre 2026. Fonti: richieste di Antonio, handoff, revisione grafica e tecnica, lettura della scheda da parte di un "investitore scettico" simulato.

## Fatto (versione attuale)

- Impaginazione predefinita in 3 pagine A4, ariosa (pagina 1 proposta, pagina 2 conti e grafici, pagina 3 foto grandi e scenari); in alternativa 2 pagine più fitte.
- Colori della scheda tutti modificabili (accento, riquadro investitore, secondo colore, quota società, costi, sfondo riquadri, testo), più i colori delle voci del capitale.
- Titolo dei comparabili modificabile (non più fisso su Ruggiano).
- Moduli: accendi/spegni, ordine, pagina 1–3, riga intera o mezza riga; avviso di pagina troppo piena. Impaginazioni pronte: 2 pagine compatta, 3 pagine con grafici accesi e foto grandi a pagina 3.
- Grafici, tutti spegnibili: A dal prezzo all'utile (una riga, spento), B quanto riceve l'investitore al variare del prezzo (acceso), C dove va il capitale (spento; sfumatura salvia, terracotta, sabbia, colori diversi, o colore per voce), D prezzo al m² rispetto alla zona (dentro "Come stimiamo il prezzo", con media della zona e fonte modificabili).
- Comparabili di zona, prove di stress (lavori più cari, vendita in ritardo) nella tabella scenari.
- Chi incassa ogni voce del capitale e parti collegate; modulo "Verifiche e documenti".
- Foto: copertina in pagina 1, galleria di 3 foto grandi a pagina 3 (o piccole in fondo a pagina 2 nella versione a 2 pagine), planimetria senza ritaglio; logo.
- Download: PDF, Excel con formule, JSON, ZIP completo, pagina 1 in JPG per WhatsApp.
- Telefono: schede Modifica/Anteprima, riepilogo fisso, comandi grandi.
- Perdita: resta all'investitore, la società prende la sua quota solo se c'è utile (da confermare nel contratto).

- Condivisione: tasto Condividi, schede online su Supabase, link per l'investitore (sola lettura, si aggiorna da solo) e link per modificare.
- Archivio "Le mie schede" con un codice personale valido su tutti i dispositivi; Nuova scheda e Duplica.
- Pagine libere come in Canva: "+ Aggiungi una pagina" fino a 12; le pagine vuote non vanno nel PDF.
- Vista web per chi apre il link (foto grande, cifre animate, sezioni che compaiono scorrendo); il PDF resta semplice.
- Righe dei conti e del riquadro dell'investitore da spegnere o riscrivere; controllo automatico dei dati (doppioni, campi vuoti, m² che non tornano).
- Importi esatti, arrotondati o in k (185k €), per tutta la scheda o modulo per modulo; i prezzi al m² e l'Excel restano esatti.
- Scenari: nel grafico "Quanto riceve l'investitore" e nella tabella si sceglie cosa mostrare (pareggio, singoli scenari, rendimento, "riceve", fascia, legenda; righe e colonne della tabella, prove, frase finale).
- Zoom delle pagine A4 (− / percentuale / +, da 35% a 250%), anche sul telefono.

## Dati da completare per Casa Ruggiano (non dipendono dallo strumento)

1. m² per tipologia (abitazione, giardino, parcheggio…).
2. Chi incassa "Intermediazione 3.000 €" e se è collegata a Riquality.
3. Riserva per imprevisti sui lavori.
4. Referente con nome completo, telefono, email.
5. Foto vere: stato attuale, progetto, planimetria.
6. Stato delle verifiche (titolo edilizio, conformità, provenienza, vincoli, preventivo firmato, bozza di contratto).

## Prossimi sviluppi dello strumento (in ordine)

1. **Permessi e cronologia (venerdì).** Accesso con password o account al posto del codice, più persone che modificano, cronologia delle versioni, eliminare o archiviare una scheda, sapere quando l'investitore apre il link. Confronto tra operazioni. È anche la base del software 3D.
2. **"Chi siamo".** Profilo della società riutilizzabile: ragione sociale, sede, partita IVA, legame con DiSalento, studio di architettura collegato, operazioni concluse.
3. **Linea del tempo e versamenti.** Fasi in mesi (compromesso, rogito, permessi, lavori, vendita), quando l'investitore paga cosa e a chi, cosa succede a 12, 18 e 24 mesi senza vendita.
4. **Riserva imprevisti e "capitale massimo"** nel riquadro dell'investitore.
5. **Costi di mantenimento** (IMU, utenze, assicurazione al mese) nelle prove di ritardo.
6. **Scenario peggiore combinato** (prezzo −25% e lavori +20%) come riga e come linea tratteggiata nel grafico B.
7. **PDF con testo vero**, selezionabile e più leggero.
8. **Presentazione per l'investitore** generata dagli stessi dati.
9. **Nota fiscale neutra** (i valori restano al lordo): plusvalenza, fatturazione della quota della società, da verificare con il commercialista.

## Proposte del 27 novembre (da decidere)

1. **Annulla e ripristina** le ultime modifiche (tasto e Ctrl+Z).
2. **Codice QR nel PDF** che apre la versione online sempre aggiornata.
3. **Modalità presentazione**: le pagine a tutto schermo, una alla volta, per mostrarle dal telefono o dal tablet durante un incontro.
4. **Modelli di partenza** per tipo di immobile (villa, rustico, appartamento, terreno), con voci di costo e controlli già pronti.
5. **Avviso sugli arrotondamenti**: con importi in k, segnalare quando una somma mostrata non torna rispetto al totale.

## Da verificare con professionisti

- Avvocato: che "Proposta di investimento" e la presentazione dei rendimenti non facciano passare la scheda per offerta di un prodotto finanziario; forma del contratto; regola della perdita.
- Commercialista: trattamento fiscale per l'investitore e per la quota della società.
- Tecnico: responsabilità dell'investitore come committente in cantiere (coordinatore sicurezza, notifica preliminare).

## Progetto successivo: piattaforma 3D (venerdì)

Un software con un mondo 3D girevole e fluido che mostra le opportunità e permette di inviarle direttamente ai possibili investitori. Funzionalità da discutere. Punto di partenza: i dati di ogni scheda (file .json) e l'archivio del punto 1.
