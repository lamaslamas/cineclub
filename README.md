# Cineclub

App in italiano per scegliere film con swipe e ricevere consigli basati sui propri gusti. Il progetto è indipendente dall'hosting Sites e non richiede accesso a ChatGPT per essere eseguito.

## Avvio locale

Con Node.js 20 o successivo:

```sh
npm start
```

Apri http://localhost:4173. Non serve installare dipendenze.

In alternativa, con Python:

```sh
python -m http.server 4173 --directory dist
```

## Funzionalità

- Destra: mi piace; sinistra: non mi piace; su: watchlist; giù: non mi interessa.
- Pulsanti, trascinamento e frecce della tastiera.
- Percorso iniziale con 25 film; catalogo offline di 2.897 film, inclusi i primi 40 e metadati dal dataset pubblico Vega.
- Watchlist, annulla, cronologia delle scelte e affinità per genere.
- Consigli con spiegazione, filtri per genere, anno, durata e disponibilità in abbonamento in Italia tramite TMDB.
- Importazione ratings.csv di Letterboxd (Name, Year, Rating). Voti da 3 a 5 diventano like; voti inferiori diventano dislike. I titoli fuori catalogo e i voti mancanti vengono contati e ignorati.
- Dati conservati nel localStorage del browser. Non si sincronizzano tra browser, domini o dispositivi. Il trasferimento del codice non trasferisce le preferenze già registrate sul vecchio dominio.

## Struttura

- `dist/index.html`: interfaccia.
- `dist/style.css`: stile responsive.
- `dist/app.js`: interazioni, salvataggio, filtri, import e consigli.
- `dist/catalog.js`: catalogo iniziale e identificatori stabili.
- `dist/expanded-catalog.js`: catalogo offline aggiuntivo.
- `dist/tmdb.js`: API, paginazione, ricerca, credenziali di sessione e cache dei film TMDB.
- `dist/data-files.js`: backup, ripristino, CSV e conservazione dei voti importati.
- `dist/assets/`: locandine e copertine.
- `server.mjs`: server locale senza dipendenze.

Il sistema di raccomandazione pesa generi (3), regista (7), attori (4) e decennio (1). I dislike hanno peso -0,75. Watchlist e film che non interessano non influenzano il punteggio. I film votati e quelli segnati come “Non mi interessa” vengono esclusi dai consigli. Le vecchie scelte “Non visto” restano salvate come “Saltato in precedenza”.

## Verifica

```sh
npm run check
```

I flussi swipe, annulla, watchlist, persistenza, filtri, consigli e importazione CSV sono stati verificati in Chromium. Il layout è stato verificato anche a 390 px.

## Backup e CSV Letterboxd

In **I tuoi gusti → Salva e trasferisci** sono disponibili:

- **Scarica backup**: file JSON con scelte (inclusi i film esclusi), watchlist, cronologia, filtri e metadati dei film necessari a ripristinarli. Le credenziali TMDB sono sempre escluse.
- **Ripristina backup**: verifica il file e mostra un riepilogo. **Unisci** aggiorna le scelte contenute nel file e mantiene le altre; **Sostituisci** ripristina soltanto scelte, cronologia e impostazioni del backup. Entrambe recuperano i filtri. Gli ID TMDB equivalenti vengono uniti, evitando duplicati.
- **Film visti · CSV**: esporta soltanto like e dislike per l’importazione dei film visti su Letterboxd.
- **Watchlist · CSV**: esporta soltanto i film da vedere, da importare nella watchlist di Letterboxd.

I CSV UTF-8 usano `Title,Year,tmdbID,Rating,CineclubStatus`. Il formato e gli importatori sono descritti nella [documentazione ufficiale Letterboxd](https://letterboxd.com/about/importing-data/). La colonna aggiuntiva `CineclubStatus` conserva la preferenza Cineclub ed è ignorata da Letterboxd. Non vengono inventati voti o date di visione: `Rating` contiene solo una valutazione in stelle precedentemente importata, altrimenti resta vuota.

I voti importati da `ratings.csv` vengono ora conservati nella loro scala originale 0,5–5, oltre al like/dislike usato dai consigli. Una nuova scelta sullo stesso film rimuove il vecchio voto numerico; Annulla lo ripristina. I voti importati prima di questa modifica non possono essere ricostruiti: reimportare il CSV originale per recuperarli.

L’importazione accetta sia `Name` (export Letterboxd) sia `Title` (formato di import), può trovare i film per `tmdbID` e accetta i CSV prodotti dall’app. I file chiamati `watchlist.csv` vengono importati come watchlist anche senza stelle.

I filtri sono salvati anche tra aggiornamenti della pagina. I backup sono validati prima di qualsiasi modifica; file non validi non alterano i dati correnti. Il ripristino interrompe l’operazione se non c’è spazio sufficiente nel browser.

Questi file vengono generati sul dispositivo del visitatore: GitHub non riceve gusti, watchlist o backup. Non è ancora disponibile la sincronizzazione con un account.

## Connessione TMDB

Nell’app premi **Collega TMDB** e inserisci il token di lettura API (consigliato) oppure la chiave API v3 del tuo account [TMDB](https://www.themoviedb.org/settings/api).

La connessione è personale e diretta dal browser. Le credenziali restano in `sessionStorage` (o in memoria se non disponibile): non vengono incluse nel codice, nella cache film, nei voti o nel repository. Scollega cancella la credenziale ma conserva i film e i gusti. Una nuova sessione/browser può richiedere nuovamente la credenziale.

Le pagine Discover sono caricate a gruppi di 20, con filtri remoti per genere, anno, durata e provider in Italia. La scheda recupera trame, locandine, durata, regia, cast e disponibilità in abbonamento. Per i like si recuperano anche film simili e raccomandazioni TMDB; questi aggiungono peso al sistema locale. I film già scelti non vengono riproposti; “Non mi interessa” li esclude dai consigli.

I metadati TMDB dei film caricati sono salvati in una cache locale per conservare watchlist e voti dopo il refresh. Gli ID iniziali 1–40 restano invariati; i nuovi ID TMDB sono 1.000.000.000 + ID del servizio. I titoli già presenti vengono uniti per ID TMDB o titolo originale/anno.

L’integrazione è stata verificata nel browser con risposte TMDB simulate: token/API key, paginazione, filtri, provider, errori e riprova, disconnessione, cache e conservazione delle scelte. La raggiungibilità reale dell’API è stata verificata; la verifica autenticata live richiede una credenziale personale, da inserire nell’app.

Per un’app aperta a tutti senza chiedere una credenziale a ciascun utente, occorre un backend che custodisca il token del proprietario. GitHub Pages serve soltanto file statici: non inserire il token in file JS, HTML, JSON o segreti interpolati nella build pubblica.

## Dati e limiti

Il catalogo offline aggiuntivo proviene da [Vega movies.json](https://github.com/vega/vega-datasets/blob/main/data/movies.json), un dataset storico. I titoli possono essere in lingua originale e i metadati mancanti sono indicati come non disponibili. Non sono inventate trame, locandine, durata o disponibilità. TMDB arricchisce le schede quando connesso. I consigli sono mostrati a gruppi di 24 per mantenere reattiva la pagina.

Le piattaforme demo sono state rimosse. La disponibilità in abbonamento è indicata solo quando fornita da TMDB; JustWatch resta accessibile per verificare noleggio, acquisto e aggiornamenti. I font Google possono essere richiesti dal browser.

Il catalogo si può rigenerare da una copia locale del dataset usando `python scripts/expand-catalog.py /percorso/movies.json`. Non cambiare l’ordine del dataset sorgente senza migrare gli ID dei film aggiuntivi.

This product uses the TMDB API but is not endorsed or certified by TMDB.

## GitHub Pages

La pagina iniziale alla radice usa gli asset di `dist/` e funziona anche sotto il percorso `/cineclub/`.

Dopo aver modificato `dist/index.html`, aggiorna la pagina iniziale:

```sh
npm run build
```

In GitHub: Settings → Pages → Deploy from a branch → main → / (root).

URL previsto dopo l’attivazione: https://lamaslamas.github.io/cineclub/

GitHub Pages pubblica l’app sul web, senza login ChatGPT. Le preferenze rimangono nel browser e sono separate da quelle salvate sul precedente dominio.
