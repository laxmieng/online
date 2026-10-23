/* Browser-only edition. This local access screen is not server authentication. */
window.leLocal=(()=>{
 const sessionKey='laxmi-workspace-session',recordKey='laxmi-quotations-v1';
 let databasePromise;
 const session=()=>{try{return Number(sessionStorage.getItem(sessionKey)||window.parent.leSessionExpires||0)>Date.now()}catch{return Number(window.parent.leSessionExpires||0)>Date.now()}};
 const startSession=()=>{const expiry=Date.now()+8*3600000;window.parent.leSessionExpires=expiry;try{sessionStorage.setItem(sessionKey,String(expiry))}catch{}};
 const uuid=()=>crypto.randomUUID?crypto.randomUUID():[...crypto.getRandomValues(new Uint8Array(16))].map(n=>n.toString(16).padStart(2,'0')).join('');
 function database(){
  if(!databasePromise)databasePromise=new Promise((resolve,reject)=>{
   if(!window.indexedDB){resolve(null);return}
   const request=indexedDB.open('laxmi-engineering-quotations',1);
   request.onupgradeneeded=()=>request.result.createObjectStore('workspace');
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>resolve(null);
   request.onblocked=()=>resolve(null);
  });
  return databasePromise;
 }
 async function storage(write,value){
  let db;try{db=await database()}catch{db=null}
  if(!db){try{if(write){localStorage.setItem(recordKey,JSON.stringify(value));return {ok:true}}return JSON.parse(localStorage.getItem(recordKey)||'[]')}catch{throw Error('Browser storage is full or unavailable. Please use a regular browser window.')}}
  return new Promise((resolve,reject)=>{
   const transaction=db.transaction('workspace',write?'readwrite':'readonly'),store=transaction.objectStore('workspace');
   const request=write?store.put(value,'quotations'):store.get('quotations');
   transaction.oncomplete=()=>resolve(write?{ok:true}:request.result||[]);
   transaction.onerror=transaction.onabort=()=>reject(Error('Unable to save or open quotations. Browser storage may be full or disabled.'));
  });
 }
 async function login(username,password){
  if(!crypto.subtle)throw Error('Please open index.html directly in Chrome or Edge, or use an HTTPS website.');
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode('laxmi-local-workspace-v1'),iterations:150000,hash:'SHA-256'},key,256);
  const hash=[...new Uint8Array(bits)].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(username.trim()!=='LAXMI1983'||hash!=='8295b47e59747e667753ebc7ec6ca5c9bff20035d52c40b3b11e3b427fabbb57')throw Error('Incorrect username or password.');
  startSession();
 }
 function adoptSession(){if(location.hash==='#local-workspace'){startSession();try{history.replaceState(null,'',location.pathname+location.search)}catch{}}}
 async function api(path,options={}){
  if(!session()){location.href='login.html';throw Error('Please sign in to continue.');}
  if(path==='session')return {ok:true};
  if(path==='logout'){window.parent.LEApp?.clearPdfDownloads?.();window.parent.leSessionExpires=0;try{sessionStorage.removeItem(sessionKey)}catch{}return {ok:true}}
  if(path==='quotations')return options.method==='PUT'?storage(true,JSON.parse(options.body)):storage(false);
  throw Error('This operation is unavailable.');
 }
 return {login,api,uuid,adoptSession};
})();

