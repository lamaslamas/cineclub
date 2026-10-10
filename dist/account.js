// Google OAuth and private snapshots. TMDB credentials never enter these payloads.
const Account = {
  client:null, user:null, ready:false, saving:false, dirty:false, revision:0,
  timer:null, conflict:null, message:'', epoch:0, applying:false,
  configured:false,
  fingerprint(snapshot) { return JSON.stringify({data:snapshot.data,movies:snapshot.movies}); },
  read(key) { try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;} },
  write(key,value) { localStorage.setItem(key,JSON.stringify(value)); },
  snapshot() { return DataFiles.backup(); },
  apply(snapshot) {
    this.applying=true;
    try{DataFiles.pending=DataFiles.validateBackup(snapshot);if(!DataFiles.restore('replace',true))throw Error('Impossibile recuperare i dati sul dispositivo.');}
    finally{DataFiles.pending=null;this.applying=false;}
  },
  draftKey() {return 'cineclub-account-draft-'+this.user.id;},
  saveDraft() {
    try{this.write(this.draftKey(),{revision:this.revision,dirty:this.dirty,snapshot:this.snapshot()});return true;}
    catch{this.message='Memoria piena: scarica un backup prima di uscire.';this.update();return false;}
  },
  lock(locked) {$('#content').inert=locked;$('#filters').inert=locked;$('#filter-toggle').disabled=locked;$('#import-button').disabled=locked;},
  update() {
    $('#account-button').textContent=this.user?'Account':'Accedi';
    $('#account-description').textContent=this.user?`Connesso come ${this.user.email||'utente Google'}. Gusti, watchlist e filtri sono personali.`:'Accedi con Google per ritrovare gusti, watchlist e impostazioni su più dispositivi.';
    $('#account-status').textContent=this.message|| (this.user?(this.dirty?'Modifiche da sincronizzare.':'Dati sincronizzati.'):(this.configured?'Puoi continuare anche senza account.':'Accesso Google in preparazione: manca il collegamento al progetto Supabase.'));
    $('#google-login').hidden=!!this.user;$('#google-login').disabled=!this.configured;
    $('#account-logout').hidden=!this.user;$('#account-sync').hidden=!this.user||!!this.conflict;
    $('#account-sync').disabled=this.saving;
    $('#account-conflict').hidden=!this.conflict;
    $('#account-conflict-description').textContent=this.conflict?.guest?'Questo dispositivo ha già delle scelte. Uniscile al profilo, dando precedenza a quelle locali, oppure usa soltanto i dati del profilo.':'I dati del profilo sono cambiati su un altro dispositivo. Scegli quali conservare. Prima di decidere puoi scaricare una copia delle scelte locali.';
    $('#account-use-device').textContent=this.conflict?.guest?'Unisci le mie scelte':'Usa le scelte di questo dispositivo';
    const note=$('.local-note p');if(note)note.textContent=this.user?'Account Google personale. Le modifiche offline restano sul dispositivo finché vengono sincronizzate.':'I tuoi gusti restano su questo dispositivo. Puoi collegare un account Google.';
  },
  open() {this.update();if(!$('#account-dialog').open)$('#account-dialog').showModal();},
  changed() {
    if(!this.user||!this.ready||this.applying)return;
    this.dirty=true;if(!this.saveDraft())return;
    this.message='Modifiche da sincronizzare.';this.update();clearTimeout(this.timer);
    this.timer=setTimeout(()=>this.sync(),900);
  },
  async readCloud() {
    const {data,error}=await this.client.from('cineclub_profiles').select('revision,payload').eq('user_id',this.user.id).maybeSingle();
    if(error)throw error;
    if(data){DataFiles.validateBackup(data.payload);if(!Number.isSafeInteger(data.revision)||data.revision<1)throw Error('Revisione del profilo non valida.');}
    return data;
  },
  showConflict(cloud,local,guest=false) {
    this.conflict={cloud,local,guest};this.ready=false;this.lock(true);this.message='Scegli come recuperare i tuoi dati.';this.open();
  },
  async start(user) {
    if(busy||$('.movie-card.dragging')){setTimeout(()=>{if(this.user?.id===user.id)this.start(user);},250);return;}
    const ticket=++this.epoch;clearTimeout(this.timer);this.saving=false;this.conflict=null;this.user=user;this.ready=false;this.lock(true);this.message='Recupero il tuo cinema…';this.update();
    const owner=localStorage.getItem('cineclub-account-owner');
    const draft=this.read(this.draftKey());
    let guest=!owner?this.snapshot():this.read('cineclub-guest-snapshot');
    if(!owner){try{this.write('cineclub-guest-snapshot',guest);}catch{this.message='Memoria piena: scarica un backup prima di accedere.';this.open();return;}}
    try {
      if(draft){DataFiles.validateBackup(draft.snapshot);if(!Number.isSafeInteger(draft.revision)||draft.revision<0)throw Error('Bozza locale non valida.');}
      const cloud=await this.readCloud();if(ticket!==this.epoch)return;
      localStorage.setItem('cineclub-account-owner',user.id);
      if(draft?.dirty) {
        this.apply(draft.snapshot);this.revision=draft.revision;this.dirty=true;
        if((cloud?.revision||0)!==this.revision){this.showConflict(cloud,draft.snapshot);return;}
      } else if(cloud) {
        this.revision=cloud.revision;
        if(!owner&&guest&&Object.keys(guest.data.choices).length){this.showConflict(cloud,guest,true);return;}
        this.apply(cloud.payload);this.dirty=false;
      } else {
        this.revision=0;
        const empty={format:'cineclub-backup',version:1,data:{choices:{},ratings:{},history:[],preferences:{}},movies:[]};
        this.apply(draft?.snapshot||(!owner?guest:null)||empty);this.dirty=true;
      }
      this.ready=true;this.lock(false);this.message=this.dirty?'Salvo il tuo cinema…':'Dati sincronizzati.';this.saveDraft();this.update();
      if(this.dirty)await this.sync();
    }catch {
      if(ticket!==this.epoch)return;
      // A verified draft belongs to this Google user and can be edited offline.
      if(draft&&owner===user.id){try{this.apply(draft.snapshot);this.revision=draft.revision;this.dirty=!!draft.dirty;this.ready=true;this.lock(false);}catch{}}
      this.message='Sincronizzazione non disponibile. Controlla la connessione e la configurazione del progetto, poi riprova.';this.open();
    }
  },
  async sync() {
    if(!this.user||!this.ready||this.saving||this.conflict)return;
    if(!this.dirty){await this.start(this.user);return;}
    const ticket=this.epoch,payload=this.snapshot(),fingerprint=this.fingerprint(payload);
    if(!this.saveDraft())return;
    this.saving=true;this.message='Salvataggio…';this.update();
    try {
      const {data,error}=await this.client.rpc('cineclub_save',{expected_revision:this.revision,next_payload:payload});
      if(ticket!==this.epoch)return;if(error)throw error;
      if(data?.conflict){const cloud=await this.readCloud();if(ticket===this.epoch)this.showConflict(cloud,this.snapshot());return;}
      if(!Number.isSafeInteger(data?.revision)||data.revision<1)throw Error('Risposta non valida.');
      this.revision=data.revision;this.dirty=this.fingerprint(this.snapshot())!==fingerprint;
      this.message=this.dirty?'Modifiche da sincronizzare.':'Dati sincronizzati.';this.saveDraft();
      if(this.dirty){clearTimeout(this.timer);this.timer=setTimeout(()=>this.sync(),900);}
    }catch {if(ticket===this.epoch)this.message='Modifiche salvate sul dispositivo. Sincronizzazione non riuscita: riprova quando sei online.';}
    finally{if(ticket===this.epoch){this.saving=false;this.update();}}
  },
  async resolve(useDevice) {
    const c=this.conflict;if(!c)return;
    try {
      this.revision=c.cloud?.revision||0;
      if(useDevice&&c.guest&&c.cloud){
        this.apply(c.cloud.payload);DataFiles.pending=DataFiles.validateBackup(c.local);
        if(!DataFiles.restore('merge',true))throw Error('Unione non riuscita.');
      }else this.apply(useDevice?c.local:c.cloud?.payload||{format:'cineclub-backup',version:1,data:{choices:{},history:[],ratings:{},preferences:{}},movies:[]});
      this.dirty=useDevice;this.conflict=null;this.ready=true;this.lock(false);this.saveDraft();this.update();
      if(this.dirty)await this.sync();else this.message='Dati del profilo recuperati.';this.update();
    }catch{this.message='Recupero non riuscito. Scarica un backup e riprova.';this.update();}
  },
  restoreGuest() {
    const guest=this.read('cineclub-guest-snapshot');
    this.apply(guest||{format:'cineclub-backup',version:1,data:{choices:{},ratings:{},history:[],preferences:{}},movies:[]});
    localStorage.removeItem('cineclub-account-owner');this.lock(false);
  },
  async logout() {
    if(this.user&&this.ready&&!this.saveDraft())return;
    ++this.epoch;clearTimeout(this.timer);this.saving=false;
    const {error}=await this.client.auth.signOut({scope:'local'});
    if(error){this.message='Uscita non riuscita. Riprova.';this.update();return;}
    this.user=null;this.ready=false;this.dirty=false;this.conflict=null;
    try{this.restoreGuest();this.message='Sei uscito. Le modifiche non inviate restano nella bozza locale del tuo account.';}
    catch{this.lock(true);this.message='Recupero dei dati senza account non riuscito. Aggiorna la pagina prima di continuare.';}
    this.update();
  },
  async login() {
    if(!this.configured)return;
    this.message='Ti porto su Google…';this.update();
    const redirectTo=new URL(location.pathname,location.origin).href;
    const {error}=await this.client.auth.signInWithOAuth({provider:'google',options:{redirectTo,scopes:'email profile'}});
    if(error){this.message='Accesso non riuscito. Controlla la configurazione Google e riprova.';this.update();}
  },
  async init() {
    $('#account-button').onclick=()=>this.open();$('#google-login').onclick=()=>this.login();
    $('#account-logout').onclick=()=>this.logout();
    $('#account-sync').onclick=()=>this.ready?this.sync():this.start(this.user);
    $('#account-use-device').onclick=()=>this.resolve(true);$('#account-use-cloud').onclick=()=>this.resolve(false);
    $('#account-backup').onclick=()=>{
      if(this.conflict){DataFiles.download(JSON.stringify(this.conflict.local,null,2),'application/json',`cineclub-copia-locale-${new Date().toISOString().slice(0,10)}.json`);toast('Copia locale scaricata.');}
      else DataFiles.exportBackup();
    };
    const c=window.CINECLUB_ACCOUNT||{};
    // Only the hosted Supabase project URL and a public client key are accepted.
    this.configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.url||'')&&typeof c.publishableKey==='string'&&(c.publishableKey.startsWith('sb_publishable_')||(()=>{try{return JSON.parse(atob(c.publishableKey.split('.')[1])).role==='anon';}catch{return false;}})());
    if(!this.configured){this.update();return;}
    try {
      this.client=CineclubSupabase.createClient(c.url,c.publishableKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'cineclub-google-session'}});
      this.lock(true);
      const {data,error}=await this.client.auth.getSession();if(error)throw error;
      if(data.session?.user)await this.start(data.session.user);
      else {if(localStorage.getItem('cineclub-account-owner'))this.restoreGuest();this.lock(false);}
      this.client.auth.onAuthStateChange((event,session)=>{
        // Run outside the auth callback to avoid locking the SDK session mutex.
        if(event==='SIGNED_IN'&&session?.user&&session.user.id!==this.user?.id)setTimeout(()=>this.start(session.user),0);
        if(event==='SIGNED_OUT'&&this.user)setTimeout(()=>{++this.epoch;this.user=null;this.ready=false;this.dirty=false;this.conflict=null;this.saving=false;clearTimeout(this.timer);try{this.restoreGuest();}catch{this.lock(true);}this.message='Sessione terminata. Accedi di nuovo per sincronizzare.';this.update();},0);
      });
      if(new URLSearchParams(location.search).has('error')){this.message='Google non ha completato l’accesso. Riprova.';this.open();history.replaceState(null,'',location.pathname);}
    }catch{
      this.message='Accesso non disponibile. Riprova più tardi; la bozza del tuo account resta sul dispositivo.';
      try{if(localStorage.getItem('cineclub-account-owner'))this.restoreGuest();else this.lock(false);}catch{this.lock(true);}
      this.open();
    }
    this.update();
    window.addEventListener('online',()=>{if(this.user&&!this.conflict)this.ready?this.sync():this.start(this.user);});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&this.user&&!this.conflict&&!this.saving)this.ready?this.sync():this.start(this.user);});
  }
};
