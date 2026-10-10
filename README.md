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
- Dati conservati nel localStorage del browser; sincronizzazione con account Google predisposta e attivabile configurando Supabase (vedi sotto). Il trasferimento del codice non trasferisce le preferenze già registrate sul vecchio dominio.

## Struttura

- `dist/index.html`: interfaccia.
- `dist/style.css`: stile responsive.
- `dist/app.js`: interazioni, salvataggio, filtri, import e consigli.
- `dist/catalog.js`: catalogo iniziale e identificatori stabili.
- `dist/expanded-catalog.js`: catalogo offline aggiuntivo.
- `dist/tmdb.js`: API, paginazione, ricerca, credenziali di sessione e cache dei film TMDB.
- `dist/data-files.js`: backup, ripristino, CSV e conservazione dei voti importati.
- `dist/account.js`, `dist/account-config.js`, `supabase/account.sql`: accesso Google, configurazione pubblica e profili privati nel database.
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

Questi file vengono generati sul dispositivo del visitatore: GitHub non riceve gusti, watchlist o backup.

## Account Google e sincronizzazione (da configurare)

L'integrazione è predisposta, ma **non è attiva finché il proprietario non configura Supabase e Google**. Il pulsante Accedi indica questo stato e non promette un accesso funzionante. La versione locale resta utilizzabile.

1. Crea un progetto su [Supabase](https://supabase.com/dashboard). Nel SQL Editor esegui [`supabase/account.sql`](supabase/account.sql). La tabella conserva una copia privata del profilo; ogni utente può leggere soltanto la propria riga. La funzione di salvataggio verifica identità e revisione prima di aggiornare i dati.
2. In Authentication → URL Configuration imposta Site URL `https://lamaslamas.github.io/cineclub/` e aggiungi lo stesso indirizzo esatto alla lista Redirect URLs. Per prove locali aggiungi `http://localhost:4173/` e usa quel dominio nel browser.
3. Segui la [configurazione ufficiale Google per Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google): crea un client OAuth di tipo Web application in Google Cloud, configura la schermata di consenso e imposta come Authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, copiandolo dal provider Google in Supabase. Durante la modalità Testing, aggiungi gli indirizzi Google autorizzati alla lista test users. Abilita il provider Google in Authentication → Sign In / Providers, con Client ID e Client Secret. **Il Client Secret va soltanto in Supabase.**
4. In [`dist/account-config.js`](dist/account-config.js) inserisci Project URL e **publishable key** (`sb_publishable_…`), disponibili nelle impostazioni API del progetto. È accettata anche la vecchia chiave `anon`. Sono configurazioni pubbliche per il browser; **non usare mai una secret key, una service_role o un segreto OAuth**. Pubblica il commit e attendi GitHub Pages.

Il client ufficiale Supabase JS 2.99.1 è incluso in `dist/vendor/supabase.js` per evitare dipendenze CDN a runtime; licenza MIT inclusa. Per rigenerarlo, installa `@supabase/supabase-js@2.99.1` ed `esbuild@0.25.12` in una directory temporanea, esporta `createClient` e compila con `--bundle --format=iife --global-name=CineclubSupabase --platform=browser --minify`. Nessuna dipendenza aggiuntiva è necessaria per avviare l'app.

Con progetto configurato, Accedi → Accedi con Google usa OAuth PKCE. Sessione Google/Supabase e credenziale TMDB sono escluse dai backup e dai dati sincronizzati. Il profilo sincronizza scelte, watchlist, cronologia, voti numerici, filtri e i metadati necessari a recuperare i film su un nuovo dispositivo.

Al primo accesso con dati locali e un profilo già esistente, l'app propone di unire le scelte locali (che hanno precedenza) o recuperare soltanto il profilo. Prima di scegliere si può scaricare un backup. Le modifiche sono salvate subito in una bozza locale separata per account e inviate dopo un breve intervallo; quando la rete torna, la sincronizzazione riprende. Se un altro dispositivo ha modificato il profilo, la revisione impedisce una sovrascrittura silenziosa e viene proposta una scelta esplicita tra copia locale e profilo. La sincronizzazione controlla gli aggiornamenti al ritorno nell'app o con Sincronizza / Riprova; non è una collaborazione in tempo reale.

Uscire ripristina la copia locale precedente all'accesso; non lascia i gusti dell'account come dati dell'utente successivo. Le bozze personali rimangono nel browser per recuperare eventuali modifiche offline al prossimo accesso con lo stesso account. Su dispositivi condivisi, chi ha accesso al profilo del browser può leggere i dati locali: scaricare il backup e cancellare i dati del sito quando necessario. La credenziale TMDB resta legata alla sessione del browser, separata dall'account.

Verifiche eseguite: Chromium con client Supabase ufficiale e risposte di servizio simulate (OAuth PKCE, migrazione, salvataggio, annulla, conflitti tra revisioni, offline e reload, uscita e recupero locale, unione esplicita e layout mobile); SQL eseguito su PostgreSQL locale PGlite (lettura isolata tra due utenti, accesso anonimo negato, aggiornamenti diretti negati, revisioni concorrenti e payload malformati). Backup e CSV verificati dopo l'integrazione. La configurazione live di OAuth richiede un progetto reale; rimane da completare un accesso Google reale e una prova di isolamento con due utenti nel progetto configurato.

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
