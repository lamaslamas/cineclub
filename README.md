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
- Percorso iniziale con 25 film; catalogo locale di 40 film.
- Watchlist, annulla, cronologia delle scelte e affinità per genere.
- Consigli con spiegazione, filtri per genere, anno, durata e piattaforma demo.
- Importazione ratings.csv di Letterboxd (Name, Year, Rating). Voti da 3 a 5 diventano like; voti inferiori diventano dislike. I titoli fuori catalogo e i voti mancanti vengono contati e ignorati.
- Dati conservati nel localStorage del browser. Non si sincronizzano tra browser, domini o dispositivi. Il trasferimento del codice non trasferisce le preferenze già registrate sul vecchio dominio.

## Struttura

- `dist/index.html`: interfaccia.
- `dist/style.css`: stile responsive.
- `dist/app.js`: interazioni, salvataggio, filtri, import e consigli.
- `dist/catalog.js`: catalogo e metadati.
- `dist/assets/`: locandine e copertine.
- `server.mjs`: server locale senza dipendenze.

Il sistema di raccomandazione pesa generi (3), regista (7), attori (4) e decennio (1). I dislike hanno peso -0,75. Watchlist e film che non interessano non influenzano il punteggio. I film votati e quelli segnati come “Non mi interessa” vengono esclusi dai consigli. Le vecchie scelte “Non visto” restano salvate come “Saltato in precedenza”.

## Verifica

```sh
npm run check
```

I flussi swipe, annulla, watchlist, persistenza, filtri, consigli e importazione CSV sono stati verificati in Chromium. Il layout è stato verificato anche a 390 px.

## Limiti attuali

Le piattaforme del catalogo sono dimostrative, non disponibilità streaming verificate. Ogni film offre una ricerca su JustWatch. TMDB live, disponibilità aggiornata e filtro per abbonamenti personali restano da integrare.

Le locandine TMDB sono incluse localmente; tre copertine sono composizioni tipografiche originali. Prima della distribuzione pubblica/commerciale, verificare i diritti delle immagini e completare l'attribuzione prevista da TMDB. I font Google possono essere richiesti dal browser.

Un repository GitHub privato conserva il codice e non pubblica automaticamente l'app. Non sono incluse credenziali o configurazioni dell'hosting precedente.

## GitHub Pages

La pagina iniziale alla radice usa gli asset di `dist/` e funziona anche sotto il percorso `/cineclub/`.

Dopo aver modificato `dist/index.html`, aggiorna la pagina iniziale:

```sh
npm run build
```

In GitHub: Settings → Pages → Deploy from a branch → main → / (root).

URL previsto dopo l’attivazione: https://lamaslamas.github.io/cineclub/

GitHub Pages pubblica l’app sul web, senza login ChatGPT. Le preferenze rimangono nel browser e sono separate da quelle salvate sul precedente dominio.
