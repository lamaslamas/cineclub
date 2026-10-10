const raw = [
['Interstellar',2014,'Fantascienza,Avventura','Christopher Nolan','Matthew McConaughey,Anne Hathaway',169,8.7,'Un viaggio oltre i confini dello spazio. E un legame che attraversa il tempo.','gEU2QniE6E77NI6lCU6MxlNBvIx'],
['Inception',2010,'Fantascienza,Thriller','Christopher Nolan','Leonardo DiCaprio,Joseph Gordon-Levitt',148,8.8,'Un ladro di segreti entra nei sogni per un ultimo, impossibile incarico.','oYuLEt3zVCKq57qu2F8dT7NIa6f'],
['Dune',2021,'Fantascienza,Avventura','Denis Villeneuve','Timothée Chalamet,Zendaya',155,8.0,'Un pianeta di sabbia, un destino da riscrivere.','d5NXSklXo0qyIYkgV94XAgMIckC'],
['The Grand Budapest Hotel',2014,'Commedia,Avventura','Wes Anderson','Ralph Fiennes,Tony Revolori',100,8.1,'Le stravaganti avventure di un concierge e del suo giovane amico.','eWdyYQreja6JGCzqHWXpWHDrrPo'],
['La La Land',2016,'Romantico,Musical','Damien Chazelle','Ryan Gosling,Emma Stone',128,8.0,'Due sognatori si incontrano nella città delle stelle.','uDO8zWDhfWwoFdKS4fzkUJt0Rf0'],
['Parasite',2019,'Thriller,Dramma','Bong Joon-ho','Song Kang-ho,Choi Woo-shik',132,8.5,'Due famiglie, una casa. E una distanza impossibile da colmare.','7IiTTgloJzvGI1TAYymCfbfl3vT'],
['Il cavaliere oscuro',2008,'Azione,Thriller','Christopher Nolan','Christian Bale,Heath Ledger',152,9.0,'Gotham incontra il caos e Batman affronta la sua prova più difficile.','qJ2tW6WMUDux911r6m7haRef0WH'],
['Pulp Fiction',1994,'Crime,Dramma','Quentin Tarantino','John Travolta,Uma Thurman',154,8.9,'Storie criminali si intrecciano in una Los Angeles imprevedibile.','d5iIlFn5s0ImszYzBPb8JPIfbXD'],
['Fight Club',1999,'Dramma,Thriller','David Fincher','Brad Pitt,Edward Norton',139,8.8,'Un incontro cambia le regole della vita di un impiegato.','pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK'],
['Forrest Gump',1994,'Dramma,Romantico','Robert Zemeckis','Tom Hanks,Robin Wright',142,8.8,'Una vita straordinaria raccontata da un uomo semplice.','arw2vcBveWOVZr6pxd9XTd1TdQa'],
['Arrival',2016,'Fantascienza,Dramma','Denis Villeneuve','Amy Adams,Jeremy Renner',116,7.9,'Per capire chi è arrivato sulla Terra, bisogna imparare ad ascoltare.','x2FJsf1ElAgr63Y3PNPtJrcmpoe'],
['Blade Runner 2049',2017,'Fantascienza,Thriller','Denis Villeneuve','Ryan Gosling,Harrison Ford',164,8.0,'Un segreto dimenticato può cambiare il futuro dell’umanità.','gajva2L0rPYkEWjzgFlBXCAVBE5'],
['Whiplash',2014,'Dramma,Musical','Damien Chazelle','Miles Teller,J.K. Simmons',107,8.5,'Quanto sei disposto a sacrificare per diventare il migliore?','7fn624j5lj3xTme2SgiLCeuedmO'],
['Her',2013,'Romantico,Fantascienza','Spike Jonze','Joaquin Phoenix,Scarlett Johansson',126,8.0,'Una storia d’amore sulla connessione, la solitudine e il futuro.','eCOtqtfvn7mxGl6nfmq4b1exJRc'],
['La città incantata',2001,'Animazione,Fantasy','Hayao Miyazaki','Rumi Hiiragi,Miyu Irino',125,8.6,'Chihiro attraversa la soglia di un mondo popolato da spiriti.','39wmItIWsg5sZMyRUHLkWBcuVCM'],
['The Truman Show',1998,'Dramma,Commedia','Peter Weir','Jim Carrey,Laura Linney',103,8.2,'E se tutta la tua vita fosse uno spettacolo?','vuza0WqY239yBXOadKlGwJsZJFE'],
['Il padrino',1972,'Crime,Dramma','Francis Ford Coppola','Marlon Brando,Al Pacino',175,9.2,'Potere, famiglia e le scelte che cambiano una generazione.','3bhkrj58Vtu7enYsRolD1fZdja1'],
['Matrix',1999,'Fantascienza,Azione','Lana Wachowski','Keanu Reeves,Laurence Fishburne',136,8.7,'La realtà è soltanto l’inizio.','f89U3ADr1oiB1s9GkdPOEpXUk5H'],
['Il Signore degli Anelli: La compagnia dell’anello',2001,'Fantasy,Avventura','Peter Jackson','Elijah Wood,Ian McKellen',178,8.9,'Un piccolo hobbit intraprende un viaggio dal destino immenso.','6oom5QYQ2yQTMJIbnvbkBL9cHo6'],
['Amélie',2001,'Romantico,Commedia','Jean-Pierre Jeunet','Audrey Tautou,Mathieu Kassovitz',122,8.3,'Piccoli gesti e incontri inattesi tra le vie di Parigi.','oTKduWL2tpIKEmkAqF4mFEAWAsv'],
['Get Out',2017,'Horror,Thriller','Jordan Peele','Daniel Kaluuya,Allison Williams',104,7.8,'Una visita ai genitori della fidanzata diventa inquietante.','tFXcEccSQMf3lfhfXKSU9iRBpa3'],
['Coco',2017,'Animazione,Musical','Lee Unkrich','Anthony Gonzalez,Gael García Bernal',105,8.4,'La musica guida Miguel alla scoperta della sua famiglia.','gGEsBPAijhVUFoiNpgZXqRVWJt2'],
['Mad Max: Fury Road',2015,'Azione,Avventura','George Miller','Tom Hardy,Charlize Theron',120,8.1,'Una corsa verso la libertà attraverso il deserto.','8tZYtuWezp8JbcsvHYO0O46tFbo'],
['Titanic',1997,'Romantico,Dramma','James Cameron','Leonardo DiCaprio,Kate Winslet',194,7.9,'Un incontro indimenticabile a bordo del transatlantico.','9xjZS2rlVxm8SFx8kPC3aIGCOYQ'],
['Ritorno al futuro',1985,'Fantascienza,Commedia','Robert Zemeckis','Michael J. Fox,Christopher Lloyd',116,8.5,'Una DeLorean e un viaggio nel tempo pieno di imprevisti.','fNOH9f1aA7XRTzl1sAOx9iF553Q'],
['Oppenheimer',2023,'Dramma,Storico','Christopher Nolan','Cillian Murphy,Emily Blunt',180,8.3,'L’uomo dietro la scoperta che ha cambiato il mondo.','ptpr0kGAckfQkJeJIt8st5dglvd'],
['Dune: Parte due',2024,'Fantascienza,Avventura','Denis Villeneuve','Timothée Chalamet,Zendaya',166,8.5,'Paul Atreides unisce il suo destino a quello dei Fremen.','1pdfLvkbY9ohJlCjQH2CZjjYVvJ'],
['Il favoloso mondo di Mr. Fox',2009,'Animazione,Commedia','Wes Anderson','George Clooney,Meryl Streep',87,7.9,'Una volpe molto elegante prepara il colpo della vita.','njbTizADSZg4PqeyJdDzZGooikv'],
['The Prestige',2006,'Dramma,Thriller','Christopher Nolan','Christian Bale,Hugh Jackman',130,8.5,'Due illusionisti rivali e il prezzo dell’ossessione.','bdN3gXuIZYaJP7ftKK2sU0nPtEA'],
['Moonrise Kingdom',2012,'Romantico,Commedia','Wes Anderson','Jared Gilman,Kara Hayward',94,7.8,'Due ragazzi fuggono insieme su un’isola del New England.','wOgmhrSUwOuZJsQXf2GsI923N0f'],
['Soul',2020,'Animazione,Musical','Pete Docter','Jamie Foxx,Tina Fey',100,8.0,'Un musicista scopre cosa rende la vita degna di essere vissuta.','hm58Jw4Lw8OIeECIq5qyPYhAeRJ'],
['Alien',1979,'Horror,Fantascienza','Ridley Scott','Sigourney Weaver,Tom Skerritt',117,8.5,'Nello spazio nessuno può sentirti urlare.','vfrQk5IPloGg1v9Rzbh2Eg3VGyM'],
['Gladiatore',2000,'Azione,Storico','Ridley Scott','Russell Crowe,Joaquin Phoenix',155,8.5,'Un generale tradito combatte per ritrovare la giustizia.','ty8TGRuvJLPUmAR1H1nRIsgwvim'],
['Perfect Days',2023,'Dramma','Wim Wenders','Koji Yakusho,Tokio Emoto',124,7.9,'La bellezza nascosta nelle piccole abitudini di Tokyo.','aIkGJ2TDDwhBHlwmIi0DflHcLcx'],
['Everything Everywhere All at Once',2022,'Fantascienza,Commedia','Daniel Kwan e Daniel Scheinert','Michelle Yeoh,Ke Huy Quan',139,7.8,'Una donna ordinaria attraversa un multiverso straordinario.','w3LxiVYdWWRvEVdn5RYq6jIqkb1'],
['Se7en',1995,'Crime,Thriller','David Fincher','Brad Pitt,Morgan Freeman',127,8.6,'Due detective inseguono un assassino guidato dai sette peccati.','6yoghtyTpznpBik8EngEmJskVUO'],
['Nuovo Cinema Paradiso',1988,'Dramma,Romantico','Giuseppe Tornatore','Philippe Noiret,Salvatore Cascio',155,8.5,'Una storia di amicizia e amore per il cinema.','9JMPnGx7C0ONeuJA6kwxPFqe6Jv'],
['Shutter Island',2010,'Thriller,Dramma','Martin Scorsese','Leonardo DiCaprio,Mark Ruffalo',138,8.2,'Un’isola, una scomparsa e una verità sfuggente.','nrmXQ0zcZUL8jFLrakWc90IR8z9'],
['Il castello errante di Howl',2004,'Animazione,Fantasy','Hayao Miyazaki','Chieko Baisho,Takuya Kimura',119,8.2,'Una maledizione conduce Sophie in un castello magico.','6pZgHaaPSBU7Q7jWlUHWVxI8I2k'],
['Eternal Sunshine of the Spotless Mind',2004,'Romantico,Fantascienza','Michel Gondry','Jim Carrey,Kate Winslet',108,8.3,'Puoi cancellare un ricordo, ma anche ciò che provi?','5MwkWH9tYHv3mV9OdYTMR5qreIz']
];
const movies=raw.map((m,i)=>({id:i+1,title:m[0],year:m[1],genres:m[2].split(','),director:m[3],actors:m[4].split(','),minutes:m[5],rating:m[6],description:m[7],poster:'assets/movie-'+(i+1)+([34,37,39].includes(i+1)?'.svg':'.jpg'),color:['#716652','#543f59','#42616b','#997064'][i%4],provider:['Netflix','Prime Video','Disney+','Noleggio'][i%4]}));

const starterTMDBIds=[157336,27205,438631,120467,313369,496243,155,680,550,13,329865,335984,244786,152601,129,37165,238,603,120,194,419430,354912,76341,597,105,872585,693134,10315,1124,83666,508442,348,98,976893,545611,807,11216,11324,4935,38];
const starterOriginalTitles={7:'The Dark Knight',15:'Spirited Away',17:'The Godfather',18:'The Matrix',19:'The Lord of the Rings: The Fellowship of the Ring',20:'Amelie',25:'Back to the Future',27:'Dune: Part Two',28:'Fantastic Mr. Fox',33:'Gladiator',37:'Cinema Paradiso',39:"Howl's Moving Castle"};
movies.forEach((m,i)=>{m.tmdbId=starterTMDBIds[i];m.originalTitle=starterOriginalTitles[m.id]||m.title;m.source='starter';m.providers=null;delete m.provider;});
const movieKey=(title,year)=>String(title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')+':'+year;
const existingMovieKeys=new Set(movies.flatMap(m=>[movieKey(m.title,m.year),movieKey(m.originalTitle,m.year)]));
for(const m of expandedMovies){if(!existingMovieKeys.has(movieKey(m.title,m.year))){movies.push(m);existingMovieKeys.add(movieKey(m.title,m.year));}}
