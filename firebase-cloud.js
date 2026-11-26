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
const panel=document.createElement('div');panel.style.cssText='position:fixed;bottom:8px;right:8px;z-index:9999;background:#151d23;color:white;padding:8px;border-radius:8px;max-width:95vw';
panel.innerHTML='<form><input type="email" placeholder="Email" required autocomplete="username"><input type="password" placeholder="Password" required autocomplete="current-password"><button>Connect</button></form><button type="button" hidden>Disconnect</button><small></small>';
document.body.append(panel);const form=panel.querySelector('form'),logout=panel.querySelector('button[type=button]'),status=panel.querySelector('small');
form.onsubmit=async e=>{e.preventDefault();try{await signInWithEmailAndPassword(auth,form.elements[0].value,form.elements[1].value);form.reset()}catch(e){status.textContent=e.code||e.message}};
logout.onclick=()=>signOut(auth);
onAuthStateChanged(auth,u=>{form.hidden=!!u;logout.hidden=!u;status.textContent=u?' Firebase connected':'';if(u&&typeof window.syncCloudProjects==='function')window.syncCloudProjects()});
