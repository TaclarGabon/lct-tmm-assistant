import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {getFirestore,doc,collection,getDocs,writeBatch} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const app=initializeApp({projectId:"lct-tmm-assistant",appId:"1:829182628231:web:9df7c6cdd99622b6828322",apiKey:"AIzaSyCfevEe_3P8g4AP5jMk8F5NzgjcWWkKcDU",authDomain:"lct-tmm-assistant.firebaseapp.com"});
const auth=getAuth(app),db=getFirestore(app);
const ready=new Promise(resolve=>onAuthStateChanged(auth,resolve));
const root=()=>{if(!auth.currentUser)throw Error('Sign in required');return collection(db,'users',auth.currentUser.uid,'projects')};
const project=id=>doc(root(),id);
async function save(rec){
 const ref=project(rec.id), bytes=new TextEncoder().encode(JSON.stringify(rec)), chunks=[];
 for(let i=0;i<bytes.length;i+=240000){const part=bytes.subarray(i,i+240000);let str='';for(let j=0;j<part.length;j+=8192)str+=String.fromCharCode(...part.subarray(j,j+8192));chunks.push(btoa(str))}
 const old=await getDocs(collection(ref,'chunks')),batch=writeBatch(db);
 if(old.size+chunks.length+1>500)throw Error('Project too large');
 old.forEach(d=>{if(Number(d.id)>=chunks.length)batch.delete(d.ref)});
 chunks.forEach((data,i)=>batch.set(doc(ref,'chunks',String(i)),{data}));
 batch.set(ref,{count:chunks.length,updatedAt:Number(rec.updatedAt)||0});await batch.commit();
}
async function list(){const refs=await getDocs(root());return Promise.all(refs.docs.map(async d=>{const parts=await getDocs(collection(d.ref,'chunks'));const sorted=parts.docs.sort((a,b)=>Number(a.id)-Number(b.id));if(sorted.length!==d.data().count||sorted.some((p,i)=>Number(p.id)!==i))throw Error('Incomplete project');const arrays=sorted.map(p=>Uint8Array.from(atob(p.data().data),c=>c.charCodeAt(0)));const bytes=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let offset=0;for(const a of arrays){bytes.set(a,offset);offset+=a.length}return JSON.parse(new TextDecoder().decode(bytes))}))}
async function remove(id){const ref=project(id),parts=await getDocs(collection(ref,'chunks')),batch=writeBatch(db);parts.forEach(p=>batch.delete(p.ref));batch.delete(ref);await batch.commit()}
window.tmmFirebase={ready,save,list,remove};
const appUI=document.querySelector('.app');
const panel=document.createElement('div');
panel.style.cssText='position:fixed;inset:0;z-index:99999;background:#080c0f;color:#fff;display:grid;place-items:center;padding:20px;overflow:auto';
panel.innerHTML='<form style="width:min(100%,360px);display:grid;gap:12px;background:#151d23;border:1px solid #303b44;border-radius:16px;padding:24px"><h2 style="margin:0;text-align:center">BEARCLAW</h2><p style="text-align:center;color:#cbd5df">TMM Plan Terrain</p><label>Email<input type="email" required autocomplete="username"></label><label>Mot de passe / Password<input type="password" required autocomplete="current-password"></label><button style="background:#f3bd3d;color:#101820;padding:12px;border:0;border-radius:8px;font-weight:bold">Connexion / Sign in</button><small role="alert" style="color:#ffb4a9"></small></form>';
const logo=document.querySelector('.brand img');if(logo){const img=logo.cloneNode(true);img.style.cssText='width:72px;height:72px;object-fit:contain;margin:auto';panel.querySelector('form').prepend(img)}
document.body.append(panel);const form=panel.querySelector('form'),status=panel.querySelector('small');
panel.querySelectorAll('input').forEach(el=>el.style.cssText='display:block;width:100%;padding:12px;margin-top:6px;background:#fff;color:#111;border:1px solid #999;border-radius:6px;font-size:16px');
form.onsubmit=async e=>{e.preventDefault();const b=form.querySelector('button');b.disabled=true;status.textContent='Connexion…';try{await signInWithEmailAndPassword(auth,form.elements[0].value,form.elements[1].value);form.reset();status.textContent=''}catch(e){status.textContent='Connexion impossible : '+(e.code||e.message)}finally{b.disabled=false}};
const sessionButton=document.getElementById('sessionButton');if(sessionButton){sessionButton.removeAttribute('onclick');sessionButton.onclick=async()=>{try{if(typeof saveCurrentProjectNow==='function')await saveCurrentProjectNow();await signOut(auth)}catch(e){alert(e.message)}}}
onAuthStateChanged(auth,u=>{panel.style.display=u?'none':'grid';if(appUI)appUI.style.display=u?'':'none';document.documentElement.classList.toggle('firebase-locked',!u);if(u){if(typeof resumeProfile==='function')resumeProfile();if(typeof backToModes==='function')backToModes();if(typeof syncCloudProjects==='function')syncCloudProjects()}});
