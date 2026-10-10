const DataFiles = {
  actions: new Set(['like','dislike','watch','uninterested','skip']), pending: null,
  cleanPreferences(raw) {
    const result={filters:{genre:'',min:'',max:'',duration:'',provider:''},filtersOpen:raw?.filtersOpen===true};
    const f=raw?.filters;
    if(!f||typeof f!=='object')return result;
    const genres=new Set([...movies.flatMap(m=>m.genres),...Object.values(TMDB.genreNames)]);
    if(typeof f.genre==='string'&&genres.has(f.genre))result.filters.genre=f.genre;
    for(const k of ['min','max'])if(/^\d{4}$/.test(String(f[k]||''))&&Number(f[k])>=1870&&Number(f[k])<=2099)result.filters[k]=String(f[k]);
    if(['120','150'].includes(String(f.duration)))result.filters.duration=String(f.duration);
    if(['Netflix','Prime Video','Disney+'].includes(f.provider))result.filters.provider=f.provider;
    return result;
  },
  cleanMovie(raw) {
    if(!raw||typeof raw!=='object'||!Number.isSafeInteger(raw.id)||raw.id<=0||typeof raw.title!=='string'||!raw.title.trim()||raw.title.length>500)throw Error('Metadati dei film non validi.');
    const text=(value,limit=1000)=>typeof value==='string'?value.slice(0,limit):'';
    const number=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max?value:null;
    const list=value=>Array.isArray(value)?value.filter(v=>typeof v==='string').slice(0,80).map(v=>v.slice(0,500)):[];
    const poster=typeof raw.poster==='string'&&(/^(assets\/movie-\d+\.(jpg|svg))$/.test(raw.poster)||/^https:\/\/image\.tmdb\.org\/t\/p\/w500\/[a-zA-Z0-9._-]+$/.test(raw.poster))?raw.poster:'';
    const m={id:raw.id,title:raw.title,originalTitle:text(raw.originalTitle,500)||raw.title,year:number(raw.year,1870,2099),genres:list(raw.genres),director:text(raw.director,500),actors:list(raw.actors),minutes:number(raw.minutes,1,10000),rating:number(raw.rating,0,10),ratingSource:raw.ratingSource==='TMDB'?'TMDB':'IMDb',description:text(raw.description,10000),poster,color:/^#[a-f0-9]{6}$/i.test(raw.color||'')?raw.color:'#526250',source:['starter','vega','tmdb'].includes(raw.source)?raw.source:'vega',providers:null};
    if(Number.isSafeInteger(raw.tmdbId)&&raw.tmdbId>0)m.tmdbId=raw.tmdbId;
    if(Array.isArray(raw.providers))m.providers=raw.providers.filter(p=>p&&Number.isSafeInteger(p.id)&&p.id>0&&typeof p.name==='string').slice(0,100).map(p=>({id:p.id,name:text(p.name,200)}));
    if(Array.isArray(raw.similarTo))m.similarTo=raw.similarTo.filter(id=>Number.isSafeInteger(id)&&id>0).slice(0,1000);
    if(raw.tmdbDetailed===true&&m.tmdbId)m.tmdbDetailed=true;
    if(Number.isFinite(raw.runtimeUpperBound)&&raw.runtimeUpperBound>0)m.runtimeUpperBound=raw.runtimeUpperBound;
    return m;
  },
  panel() {
    const watched=movies.filter(m=>['like','dislike'].includes(state.choices[m.id])).length;
    const watchlist=movies.filter(m=>state.choices[m.id]==='watch').length;
    return `<section class="data-panel"><div class="eyebrow">SALVA E TRASFERISCI</div><h3>Il tuo cinema, sempre con te.</h3><p>Il backup salva gusti, watchlist, cronologia e filtri. Puoi ripristinarlo su un altro dispositivo.</p><div class="backup-actions"><button id="export-backup" class="primary">${icon('down')} Scarica backup</button><button id="import-backup" class="secondary">${icon('upload')} Ripristina backup</button></div><div class="csv-actions"><button id="export-watched" class="secondary" ${watched?'':'disabled'}>Film visti · CSV (${watched})</button><button id="export-watchlist" class="secondary" ${watchlist?'':'disabled'}>Watchlist · CSV (${watchlist})</button></div><p class="muted">CSV per Letterboxd: titoli, anno e ID TMDB, quando disponibile. Le stelle sono incluse solo se importate: un like non diventa automaticamente un voto.</p><a class="data-link" href="https://letterboxd.com/about/importing-data/" target="_blank" rel="noopener">Come importare il CSV su Letterboxd ↗︎</a><p class="muted">La credenziale TMDB è esclusa dal backup. I file vengono scaricati sul tuo dispositivo.</p></section>`;
  },
  bindPanel() {
    if($('#export-backup'))$('#export-backup').onclick=()=>this.exportBackup();
    if($('#import-backup'))$('#import-backup').onclick=()=>$('#backup-input').click();
    if($('#export-watched'))$('#export-watched').onclick=()=>this.exportCSV('watched');
    if($('#export-watchlist'))$('#export-watchlist').onclick=()=>this.exportCSV('watchlist');
  },
  applyPreferences() {
    const p=this.cleanPreferences(state.preferences||{});filter={...p.filters};
    for(const [id,k]of Object.entries({'genre-filter':'genre','year-min':'min','year-max':'max','duration-filter':'duration','provider-filter':'provider'}))$('#'+id).value=filter[k];
    $('#filter-toggle').classList.toggle('open',p.filtersOpen);
  },
  download(content,type,name) {
    const url=URL.createObjectURL(new Blob([content],{type}));const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  },
  backup() {
    const referenced=new Set([...Object.keys(state.choices).map(Number),...state.history.map(h=>h.id)]);
    return {format:'cineclub-backup',version:1,createdAt:new Date().toISOString(),data:{choices:{...state.choices},history:state.history.map(h=>({id:h.id,action:h.action,previous:h.previous??null,previousRating:h.previousRating??null})),ratings:{...state.ratings},preferences:{filters:{...filter},filtersOpen:$('#filter-toggle').classList.contains('open')}},movies:movies.filter(m=>referenced.has(m.id)).map(m=>this.cleanMovie(m))};
  },
  exportBackup() {this.download(JSON.stringify(this.backup(),null,2),'application/json',`cineclub-backup-${new Date().toISOString().slice(0,10)}.json`);toast('Backup scaricato: gusti, watchlist e impostazioni.');},
  csv(kind) {
    const selected=movies.filter(m=>kind==='watchlist'?state.choices[m.id]==='watch':['like','dislike'].includes(state.choices[m.id]));
    const rows=[['Title','Year','tmdbID','Rating','CineclubStatus']];
    for(const m of selected)rows.push([m.originalTitle||m.title,m.year||'',m.tmdbId||'',state.ratings[m.id]??'',state.choices[m.id]]);
    const cell=v=>{const s=String(v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;};
    return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
  },
  exportCSV(kind) {this.download(this.csv(kind),'text/csv;charset=utf-8',`cineclub-letterboxd-${kind==='watchlist'?'watchlist':'film-visti'}-${new Date().toISOString().slice(0,10)}.csv`);toast('CSV scaricato. Importalo su Letterboxd nella sezione corretta.');},
  validateBackup(input) {
    if(!input||input.format!=='cineclub-backup'||input.version!==1||!input.data||!Array.isArray(input.movies)||input.movies.length>20000)throw Error('Questo file non è un backup Cineclub supportato.');
    const data=input.data;
    if(!data.choices||typeof data.choices!=='object'||Array.isArray(data.choices)||!Array.isArray(data.history)||data.history.length>100000)throw Error('Gusti o cronologia nel backup non validi.');
    const records=input.movies.map(m=>this.cleanMovie(m));
    if(new Set(records.map(m=>m.id)).size!==records.length)throw Error('Il backup contiene identificatori duplicati.');
    const ids=new Set([...movies.map(m=>m.id),...records.map(m=>m.id)]);
    const choices={},ratings={};
    for(const [key,action]of Object.entries(data.choices)) {
      const id=Number(key);if(!Number.isSafeInteger(id)||String(id)!==key||!ids.has(id)||!this.actions.has(action))throw Error('Il backup contiene una scelta non valida o un film senza metadati.');
      choices[id]=action;
    }
    for(const [key,rating]of Object.entries(data.ratings||{})) {
      if(!['like','dislike'].includes(choices[key])||!Number.isFinite(rating)||rating<.5||rating>5||!Number.isInteger(rating*2))throw Error('Il backup contiene un voto in stelle non valido.');
      ratings[key]=rating;
    }
    const history=data.history.map(h=>{
      if(!h||!ids.has(h.id)||!this.actions.has(h.action)||(h.previous!=null&&!this.actions.has(h.previous)))throw Error('Cronologia nel backup non valida.');
      const rating=h.previousRating??null;if(rating!==null&&(!Number.isFinite(rating)||rating<.5||rating>5||!Number.isInteger(rating*2)))throw Error('Voto nella cronologia non valido.');
      return {id:h.id,action:h.action,previous:h.previous??null,previousRating:rating};
    });
    return {choices,ratings,history,preferences:this.cleanPreferences(data.preferences||{}),records};
  },
  async readBackup(file) {
    if(!file)return;
    try {
      if(file.size>20*1024*1024)throw Error('Scegli un backup sotto i 20 MB.');
      this.pending=this.validateBackup(JSON.parse(await file.text()));
      const counts=Object.values(this.pending.choices);const watch=counts.filter(v=>v==='watch').length;
      $('#backup-summary').textContent=`Il file contiene ${counts.length} scelte, ${watch} film in watchlist e ${this.pending.history.length} azioni nella cronologia.`;
      $('#backup-dialog').showModal();
    }catch(e){this.pending=null;toast(e instanceof SyntaxError?'Il file JSON non è valido. Nessun dato è stato modificato.':e.message);}
    finally{$('#backup-input').value='';}
  },
  restore(mode) {
    if(!this.pending)return;
    try {
      const incoming=this.pending,nextMovies=movies.map(m=>({...m})),mapping=new Map();
      for(const record of incoming.records) {
        const byTMDB=record.tmdbId?nextMovies.find(m=>m.tmdbId===record.tmdbId):null;
        const byId=nextMovies.find(m=>m.id===record.id);
        const existing=byTMDB||byId;
        if(existing&&!byTMDB&&movieKey(existing.originalTitle||existing.title,existing.year)!==movieKey(record.originalTitle||record.title,record.year))throw Error('Un identificatore del backup corrisponde a un film diverso. Nessun dato è stato modificato.');
        const id=existing?.id||record.id;mapping.set(record.id,id);
        if(existing)Object.assign(existing,record,{id});else nextMovies.push({...record,id});
      }
      const mapped=id=>mapping.get(Number(id))||Number(id);
      const choiceMap=Object.fromEntries(Object.entries(incoming.choices).map(([id,action])=>[mapped(id),action]));
      const ratingMap=Object.fromEntries(Object.entries(incoming.ratings).map(([id,rating])=>[mapped(id),rating]));
      const history=incoming.history.map(h=>({...h,id:mapped(h.id)}));
      const next=mode==='replace'?{choices:choiceMap,ratings:ratingMap,history,preferences:incoming.preferences}:{choices:{...state.choices,...choiceMap},ratings:{...state.ratings},history:[...state.history],preferences:incoming.preferences};
      if(mode!=='replace')for(const [id,action]of Object.entries(choiceMap)){
        next.history.push({id:Number(id),action,previous:state.choices[id]??null,previousRating:state.ratings[id]??null});
        if(ratingMap[id]!=null)next.ratings[id]=ratingMap[id];else delete next.ratings[id];
      }
      const keys=['cineclub-v1','cineclub-tmdb-movies','cineclub-restored-movies'];const before=keys.map(key=>localStorage.getItem(key));
      const restoredIds=new Set(incoming.records.map(r=>mapped(r.id)));const snapshots=nextMovies.filter(m=>restoredIds.has(m.id)).map(m=>this.cleanMovie(m));
      let oldRestored=[];try{oldRestored=JSON.parse(before[2]||'[]');}catch{}const combined=new Map((Array.isArray(oldRestored)?oldRestored:[]).map(m=>[m.id,m]));snapshots.forEach(m=>combined.set(m.id,m));
      try {
        localStorage.setItem(keys[1],JSON.stringify(nextMovies.filter(m=>m.source==='tmdb')));
        localStorage.setItem(keys[2],JSON.stringify([...combined.values()]));
        localStorage.setItem(keys[0],JSON.stringify(next));
      }catch{
        for(let i=0;i<keys.length;i++)try{before[i]===null?localStorage.removeItem(keys[i]):localStorage.setItem(keys[i],before[i]);}catch{}
        throw Error('Spazio di salvataggio insufficiente. I dati attuali restano invariati.');
      }
      movies.splice(0,movies.length,...nextMovies);state=next;this.pending=null;$('#backup-dialog').close();updateGenres();this.applyPreferences();render();toast(mode==='replace'?'Backup ripristinato.':'Backup unito ai dati attuali.');
    }catch(e){toast(e.message);}
  },
  async importCSV(file) {
    if(!file)return;
    try {
      if(file.size>5*1024*1024)throw Error('Scegli un CSV sotto i 5 MB.');
      const rows=parseCSV(await file.text());if(!rows.length)throw Error('Il CSV è vuoto.');
      const header=rows.shift().map(s=>s.trim().toLowerCase());const title=header.includes('title')?header.indexOf('title'):header.indexOf('name'),year=header.indexOf('year'),rating=header.indexOf('rating'),tmdb=header.indexOf('tmdbid'),status=header.indexOf('cineclubstatus');
      const isWatchlist=/watchlist/i.test(file.name);
      if(title<0&&tmdb<0)throw Error('Il CSV deve contenere Title, Name oppure tmdbID.');
      if(rating<0&&status<0&&!isWatchlist)throw Error('Usa ratings.csv di Letterboxd oppure un file watchlist.csv.');
      let imported=0,unmatched=0,unrated=0;
      for(const row of rows) {
        const value=Number(row[rating]),hasRating=rating>=0&&row[rating]?.trim()&&Number.isFinite(value)&&value>=.5&&value<=5&&Number.isInteger(value*2);
        const action=status>=0&&this.actions.has(row[status])?row[status]:hasRating?(value>=3?'like':'dislike'):isWatchlist?'watch':null;
        if(!action){unrated++;continue;}
        const t=row[title]||'',y=Number(row[year])||null,id=Number(row[tmdb]);
        const m=movies.find(m=>(tmdb>=0&&id>0&&m.tmdbId===id)||([m.title,m.originalTitle].filter(Boolean).some(n=>movieKey(n,y)===movieKey(t,y))&&(!y||m.year===y)));
        if(!m){unmatched++;continue;}
        state.history.push({id:m.id,action,previous:state.choices[m.id]??null,previousRating:state.ratings[m.id]??null});state.choices[m.id]=action;
        if(hasRating&&['like','dislike'].includes(action))state.ratings[m.id]=value;else delete state.ratings[m.id];imported++;
      }
      persist();render();toast(`${imported} scelte importate · ${unmatched} film fuori catalogo · ${unrated} senza voto valido`);
    }catch(e){toast(e.message);}
    finally{$('#csv-input').value='';}
  }
};
// Load restored film metadata before app.js validates votes against the catalog.
try {
  const snapshots=JSON.parse(localStorage.getItem('cineclub-restored-movies')||'[]');
  if(Array.isArray(snapshots)&&snapshots.length<=20000)for(const raw of snapshots){
    const record=DataFiles.cleanMovie(raw),existing=movies.find(m=>m.id===record.id);
    if(existing){if(existing.source!=='tmdb'&&movieKey(existing.originalTitle||existing.title,existing.year)===movieKey(record.originalTitle||record.title,record.year))Object.assign(existing,record);}else movies.push(record);
  }
}catch{}
