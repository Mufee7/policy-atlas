import {mkdirSync,readFileSync,writeFileSync,readdirSync,lstatSync,existsSync,renameSync} from 'node:fs';
import {resolve,dirname,relative,isAbsolute,sep} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import net from 'node:net';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function inside(root,path){const r=relative(resolve(root),resolve(path));return r!==''&&!r.startsWith('..'+sep)&&r!=='..'&&!isAbsolute(r);}
function filesAt(root){
 const files=[];
 function walk(dir){for(const item of readdirSync(dir)){const path=resolve(dir,item),s=lstatSync(path);if(s.isSymbolicLink())throw new Error('Symbolic links are not supported: '+path);if(s.isDirectory())walk(path);else if(s.isFile())files.push({path:relative(root,path).replaceAll('\\','/'),bytes:s.size,sha256:hash(readFileSync(path))});else throw new Error('Unsupported state entry: '+path);}}
 if(lstatSync(root).isSymbolicLink())throw new Error('State directory cannot be a link');
 walk(root);return files.sort((a,b)=>a.path.localeCompare(b.path));
}
export function verifyBackup(folder){
 const manifest=JSON.parse(readFileSync(resolve(folder,'backup.json'),'utf8'));
 if(manifest.kind!=='policy-atlas-local-state-v1'||!Array.isArray(manifest.files)||!manifest.files.length)throw new Error('Invalid or empty local backup');
 for(const f of manifest.files){if(typeof f.path!=='string'||f.path.includes('\\')||f.path.includes(':')||f.path.split('/').some(p=>!p||p==='.'||p==='..')||!inside(resolve(folder,'state'),resolve(folder,'state',f.path)))throw new Error('Unsafe backup path');}
 const actual=filesAt(resolve(folder,'state'));
 if(JSON.stringify(actual)!==JSON.stringify(manifest.files))throw new Error('Backup file/hash mismatch');
 return manifest;
}
export function backupState(state,output){
 if(inside(state,output)||resolve(state)===resolve(output))throw new Error('Backup must be outside the state directory');
 const before=filesAt(state);if(!before.length)throw new Error('No local state to back up');
 mkdirSync(output,{recursive:false});
 for(const f of before){const dest=resolve(output,'state',f.path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,readFileSync(resolve(state,f.path)),{flag:'wx'});}
 if(JSON.stringify(filesAt(state))!==JSON.stringify(before))throw new Error('State changed during backup. Stop every local server and retry; this copy is incomplete.');
 writeFileSync(resolve(output,'backup.json'),JSON.stringify({kind:'policy-atlas-local-state-v1',createdAt:new Date().toISOString(),note:'Private local emulator state; not encrypted. Restore with the same app/dependency versions.',files:before},null,2)+'\n',{flag:'wx'});
 verifyBackup(output);return output;
}
export function restoreState(folder,state){
 verifyBackup(folder);
 if(inside(state,folder)||inside(folder,state)||resolve(folder)===resolve(state))throw new Error('Backup and state directories must be separate');
 mkdirSync(dirname(state),{recursive:true});
 const staging=state+'.restore-'+randomUUID();
 // Copy verified bytes into a separate staging directory before changing live state.
 const manifest=verifyBackup(folder);mkdirSync(staging);
 for(const f of manifest.files){const dest=resolve(staging,f.path);mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,readFileSync(resolve(folder,'state',f.path)),{flag:'wx'});}
 if(JSON.stringify(filesAt(staging))!==JSON.stringify(manifest.files))throw new Error('Restore staging hash mismatch');
 const rollback=existsSync(state)?state+'.before-restore-'+randomUUID():null;
 if(rollback){if(lstatSync(state).isSymbolicLink())throw new Error('State cannot be a link');renameSync(state,rollback);}
 try{renameSync(staging,state);}catch(error){if(rollback)renameSync(rollback,state);throw error;}
 return {state,rollback};
}
async function listening(port){return new Promise(resolve=>{const socket=net.connect({host:'127.0.0.1',port});socket.setTimeout(700);socket.on('connect',()=>{socket.destroy();resolve(true);});socket.on('error',()=>resolve(false));socket.on('timeout',()=>{socket.destroy();resolve(false);});});}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const [action,folder,...flags]=process.argv.slice(2);
 if(!['backup','restore','verify'].includes(action)||!folder||flags.some(f=>f!=='--stopped'))throw new Error('Usage: node scripts/local-backup.mjs backup|restore|verify FOLDER [--stopped]');
 if(action==='verify'){console.log(verifyBackup(resolve(folder)));}
 else{
  if(!flags.includes('--stopped'))throw new Error('Stop ALL local dev/preview servers first, then pass --stopped. This includes custom ports.');
  for(const port of [5173,8787])if(await listening(port))throw new Error('Port '+port+' is listening. Stop the local server before '+action+'.');
  const state=resolve('.wrangler/state');
  console.log(action==='backup'?backupState(state,resolve(folder)):restoreState(resolve(folder),state));
 }
}
