// Direct, personal TMDB connection: credentials stay in this tab's session.
const TMDB = {
  token: '', connected: false, loading: false, error: '', pages: new Map(), pendingDetails: new Set(), epoch: 0,
  genreNames: {28:'Azione',12:'Avventura',16:'Animazione',35:'Commedia',80:'Crime',99:'Documentario',18:'Dramma',10751:'Famiglia',14:'Fantasy',36:'Storico',27:'Horror',10402:'Musical',9648:'Mistero',10749:'Romantico',878:'Fantascienza',10770:'Film TV',53:'Thriller',10752:'Guerra',37:'Western'},
  providers: [{id:8,name:'Netflix'},{id:9,name:'Prime Video'},{id:337,name:'Disney+'}],
  changed() { if (typeof onTMDBChange === 'function') onTMDBChange(); },
  async request(path, params = {}, token = this.token) {
    if (!token) throw new Error('Collega TMDB per cercare nuovi film.');
    const url = new URL('https://api.themoviedb.org/3/' + path);
    for (const [key, value] of Object.entries(params)) if (value !== '' && value != null) url.searchParams.set(key, String(value));
    const headers = { accept: 'application/json' };
    if (/^[a-f0-9]{32}$/i.test(token)) url.searchParams.set('api_key', token);
    else headers.Authorization = 'Bearer ' + token;
    let response;
    try { response = await fetch(url, {headers, signal: AbortSignal.timeout(15000)}); }
    catch { throw new Error('TMDB non risponde. Controlla la connessione e riprova.'); }
    if ([401,403].includes(response.status)) throw new Error('Chiave o token TMDB non valido. Controlla le credenziali.');
    if (response.status === 429) throw new Error('Troppe richieste a TMDB. Attendi qualche secondo e riprova.');
    if (!response.ok) throw new Error('Non riesco a caricare i film da TMDB. Riprova.');
    return response.json();
  },
  async connect(token) {
    token = token.trim();
    if (!token) throw new Error('Inserisci una chiave API o un token di lettura TMDB.');
    if (token.length > 4096 || /\s/.test(token)) throw new Error('Incolla soltanto la chiave o il token, senza spazi.');
    await this.request('configuration', {}, token);
    this.epoch++; this.token = token; this.connected = true; this.error = ''; this.pages.clear();
    try { sessionStorage.setItem('cineclub-tmdb-session', token); } catch { /* Connection works in memory too. */ }
    this.changed();
  },
  disconnect() {
    this.epoch++; this.token = ''; this.connected = false; this.error = ''; this.loading = false;
    this.pages.clear(); this.pendingDetails.clear();
    try { sessionStorage.removeItem('cineclub-tmdb-session'); } catch {}
    this.changed();
  },
  merge(data) {
    const id = Number(data.id);
    if (!Number.isSafeInteger(id) || id <= 0 || !data.title) return null;
    const year = Number(String(data.release_date || '').slice(0,4)) || null;
    let m = movies.find(m => m.tmdbId === id);
    if (!m) {
      const keys = [data.title, data.original_title].filter(Boolean).map(title => movieKey(title,year));
      m = movies.find(m => keys.includes(movieKey(m.title,m.year)) || keys.includes(movieKey(m.originalTitle || m.title,m.year)));
    }
    const patch = {
      tmdbId:id, title:String(data.title), originalTitle:String(data.original_title || data.title), year,
      genres: (data.genres ? data.genres.map(g=>this.genreNames[g.id] || g.name) : (data.genre_ids || []).map(id=>this.genreNames[id])).filter(Boolean),
      rating: Number(data.vote_count) > 0 ? Number(data.vote_average) : null, ratingSource:'TMDB',
      description: String(data.overview || ''),
      poster: /^\/[a-zA-Z0-9._-]+$/.test(data.poster_path || '') ? 'https://image.tmdb.org/t/p/w500' + data.poster_path : (m?.poster || ''),
      source:'tmdb'
    };
    if (!m) {
      m = {id:1000000000+id, director:'', actors:[], minutes:null, providers:null, color:'#526250', ...patch};
      movies.push(m);
    } else {
      if (!patch.description) delete patch.description;
      if (!patch.genres.length) delete patch.genres;
      if (!year) delete patch.year;
      Object.assign(m,patch);
    }
    return m;
  },
  saveCache() {
    try {
      const records = movies.filter(m => m.source === 'tmdb');
      localStorage.setItem('cineclub-tmdb-movies', JSON.stringify(records));
    } catch { /* Never delete saved preferences when the cache is full. */ }
  },
  key(filters) { return JSON.stringify([filters.genre, filters.min, filters.max, filters.duration, filters.provider]); },
  hasMore(filters) { return this.connected && (this.pages.get(this.key(filters))?.hasMore ?? true); },
  async more(filters) {
    if (!this.connected || this.loading) return;
    const key = this.key(filters), cursor = this.pages.get(key) || {next:1,hasMore:true};
    if (!cursor.hasMore) return;
    const epoch = this.epoch;
    this.loading = true; this.error = ''; this.changed();
    try {
      const provider = this.providers.find(p => p.name === filters.provider);
      const genreId = Object.entries(this.genreNames).find(([,name])=>name===filters.genre)?.[0];
      const params = {language:'it-IT', page:cursor.next, sort_by:'popularity.desc', include_adult:false, include_video:false,
        'primary_release_date.lte': filters.max ? `${filters.max}-12-31` : new Date().toISOString().slice(0,10),
        'primary_release_date.gte': filters.min ? `${filters.min}-01-01` : '',
        with_genres:genreId || '', 'with_runtime.lte':filters.duration ? Number(filters.duration)-1 : '',
        with_watch_providers:provider?.id || '', watch_region:provider?'IT':'', watch_monetization_types:provider?'flatrate':''};
      const data = await this.request('discover/movie',params);
      if (epoch !== this.epoch) return;
      let added = 0;
      for (const result of data.results || []) {
        const before = movies.length; const m = this.merge(result);
        if(m && filters.duration && !m.minutes)m.runtimeUpperBound=Number(filters.duration)-1;
        if (m && provider) { m.providers ||= []; if (!m.providers.some(p=>p.id===provider.id)) m.providers.push(provider); }
        if (movies.length > before) added++;
      }
      this.pages.set(key,{next:cursor.next+1,hasMore:cursor.next<Math.min(Number(data.total_pages)||0,500)});
      this.saveCache();
      return added;
    } catch (e) { if (epoch===this.epoch) this.error=e.message; }
    finally { if (epoch===this.epoch) { this.loading=false; this.changed(); } }
  },
  async enrich(m) {
    if (!this.connected || !m || m.tmdbDetailed || m.tmdbNotFound) return;
    const pendingKey=m.tmdbId || 'local-'+m.id;
    if(this.pendingDetails.has(pendingKey))return;
    const epoch=this.epoch; this.pendingDetails.add(pendingKey);
    try {
      if(!m.tmdbId){
        const search=await this.request('search/movie',{language:'it-IT',query:m.originalTitle||m.title,year:m.year||'',include_adult:false});
        if(epoch!==this.epoch)return;
        const match=(search.results||[]).find(r=>[r.title,r.original_title].filter(Boolean).some(t=>movieKey(t,Number((r.release_date||'').slice(0,4)))===movieKey(m.originalTitle||m.title,m.year)));
        if(!match){m.tmdbNotFound=true;return;}
        m.tmdbId=match.id;
      }
      const data=await this.request(`movie/${m.tmdbId}`,{language:'it-IT',append_to_response:'credits,watch/providers,recommendations,similar'});
      if (epoch!==this.epoch) return;
      this.merge(data);
      m.minutes=Number(data.runtime)||null;
      m.director=(data.credits?.crew || []).filter(p=>p.job==='Director').map(p=>p.name).join(', ');
      m.actors=(data.credits?.cast || []).slice(0,8).map(p=>p.name);
      const region=data['watch/providers']?.results?.IT;
      m.providers=(region?.flatrate || []).map(p=>({id:p.provider_id,name:this.providers.find(x=>x.id===p.provider_id)?.name || p.provider_name}));
      m.watchLink=region?.link || '';
      m.tmdbDetailed=true;
      if (typeof state!=='undefined' && state.choices[m.id]==='like') {
        for (const result of [...(data.recommendations?.results || []),...(data.similar?.results || [])]) {
          const related=this.merge(result); if (!related || related.id===m.id) continue;
          related.similarTo ||= []; if (!related.similarTo.includes(m.id)) related.similarTo.push(m.id);
        }
      }
      this.saveCache(); this.changed();
    } catch { /* Keep the existing card usable if optional metadata cannot load. */ }
    finally { this.pendingDetails.delete(pendingKey); }
  }
};
// Restore movie identities before loading saved votes, so TMDB choices survive reloads.
try {
  const cached=JSON.parse(localStorage.getItem('cineclub-tmdb-movies') || '[]');
  if (Array.isArray(cached)) for (const record of cached) {
    if (!Number.isSafeInteger(record.id) || !Number.isSafeInteger(record.tmdbId) || typeof record.title!=='string' || !Array.isArray(record.genres) || !Array.isArray(record.actors)) continue;
    const old=movies.find(m=>m.id===record.id || m.tmdbId===record.tmdbId);
    const safe={...record, color:'#526250', poster:/^https:\/\/image\.tmdb\.org\/t\/p\/w500\/[a-zA-Z0-9._-]+$/.test(record.poster || '') ? record.poster : (old?.poster || '')};
    if (old) Object.assign(old,safe,{id:old.id}); else if(record.id===1000000000+record.tmdbId) movies.push(safe);
  }
} catch {}
try { TMDB.token=sessionStorage.getItem('cineclub-tmdb-session') || ''; TMDB.connected=Boolean(TMDB.token); } catch {}
