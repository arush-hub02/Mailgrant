import {spawn,spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir,readFile,writeFile,rename,unlink,open,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {createServer} from 'node:net';
import {randomUUID} from 'node:crypto';

const script=fileURLToPath(import.meta.url),root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const directory=join(root,'.wrangler'),record=join(directory,'local-run.json'),log=join(directory,'local-server.log');
const wrangler=join(root,'node_modules','wrangler','bin','wrangler.js');
const env={...process.env,GOMAXPROCS:process.env.GOMAXPROCS||'2',WRANGLER_LOG_PATH:join(directory,'logs'),WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:join(directory,'config')};
const normalize=value=>value.replaceAll('/','\\').toLowerCase();
export function ownsRun(state,commandLine){
  return !!(state&&Number.isSafeInteger(state.pid)&&state.pid>0&&typeof state.run_id==='string'&&/^[0-9a-f-]{36}$/i.test(state.run_id)&&resolve(state.root||'')===root&&typeof commandLine==='string'&&normalize(commandLine).includes(normalize(script))&&commandLine.includes(` run ${state.run_id} `));
}
function processInfo(pid){
  if(!Number.isSafeInteger(pid)||pid<1)return null;
  const command=`Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" | Select-Object ProcessId,CommandLine | ConvertTo-Json -Compress`;
  const result=spawnSync('powershell.exe',['-NoProfile','-Command',command],{encoding:'utf8',windowsHide:true});
  if(result.status!==0)return null;try{return JSON.parse(result.stdout);}catch{return null;}
}
async function saved(){try{return JSON.parse(await readFile(record,'utf8'));}catch{return null;}}
async function forget(){try{await unlink(record);}catch(error){if(error.code!=='ENOENT')throw error;}}
function runNode(args){const result=spawnSync(process.execPath,[wrangler,...args],{cwd:root,env,stdio:['ignore','inherit','inherit'],windowsHide:true});if(result.status!==0)throw new Error('Local preparation failed. See the command output above.');}
async function probe(port){try{const response=await fetch(`http://127.0.0.1:${port}/api/config`,{signal:AbortSignal.timeout(1000),cache:'no-store'});const data=await response.json();return data.application==='mailgrant'?data:null;}catch{return null;}}
function available(port){return new Promise(resolve=>{const server=createServer();server.once('error',()=>resolve(false));server.listen(port,'127.0.0.1',()=>server.close(()=>resolve(true)));});}
function openBrowser(url){
  const chromePaths=[
    process.env['PROGRAMFILES']&&join(process.env['PROGRAMFILES'],'Google','Chrome','Application','chrome.exe'),
    process.env['PROGRAMFILES(X86)']&&join(process.env['PROGRAMFILES(X86)'],'Google','Chrome','Application','chrome.exe'),
    process.env['LOCALAPPDATA']&&join(process.env['LOCALAPPDATA'],'Google','Chrome','Application','chrome.exe')
  ].filter(Boolean);
  const chrome=chromePaths.find(p=>existsSync(p));
  if(chrome){
    try{
      const child=spawn(chrome,[url],{detached:true,stdio:'ignore'});
      child.unref();
      return;
    }catch{}
  }
  const child=spawn(process.env.ComSpec||'cmd.exe',['/c','start','',url],{windowsHide:true,stdio:'ignore'});
  child.unref();
}
async function stop(){
  const state=await saved();if(!state){console.log('Mailgrant is already stopped.');return;}
  const info=processInfo(state.pid);
  if(!info){await forget();console.log('No saved Mailgrant process is running.');return;}
  if(!ownsRun(state,info.CommandLine))throw new Error('The saved process does not match this project. No process was stopped.');
  const result=spawnSync('taskkill.exe',['/PID',String(state.pid),'/T','/F'],{encoding:'utf8',windowsHide:true});
  if(result.status!==0)throw new Error('Could not stop the saved Mailgrant process. Check its status before trying again.');
  await forget();console.log('Mailgrant stopped. Your local database and settings are preserved.');
}
async function start(args){
  const index=args.indexOf('--port'),port=index<0?8787:Number(args[index+1]);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Choose a port between 1024 and 65535.');
  const noBrowser=args.includes('--no-browser'),state=await saved();
  if(state){const info=processInfo(state.pid);if(ownsRun(state,info?.CommandLine)){const status=await probe(state.port);if(!status)throw new Error(`The saved Mailgrant process is not responding. Read ${log}, then run stop.bat and start.bat again.`);const url=`http://localhost:${state.port}/app.html`;console.log(`Mailgrant is already running: ${url}`);if(!noBrowser)openBrowser(url);return;}if(info)throw new Error('A different process now uses the saved PID. No process was changed.');await forget();}
  if(!await available(port))throw new Error(`Port ${port} is unavailable. Stop its application yourself or use start.bat --port 8792. For live Google login, update APP_ORIGIN and the Google localhost redirect URI to match the chosen port.`);
  await mkdir(directory,{recursive:true});
  try{await access(wrangler);}catch{
    console.log('Installing project dependencies…');const install=spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npm ci'],{cwd:root,env,stdio:'inherit',windowsHide:true});if(install.status!==0)throw new Error('Dependency installation failed. Check Node.js and your internet connection.');
  }
  console.log('Preparing the local database…');runNode(['d1','migrations','apply','mailgrant','--local']);
  const runId=randomUUID(),output=await open(log,'a');
  const child=spawn(process.execPath,[script,'run',runId,String(port)],{cwd:root,env,detached:true,windowsHide:true,stdio:['ignore',output.fd,output.fd]});
  await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();await output.close();
  const next={pid:child.pid,run_id:runId,root,port};await writeFile(`${record}.tmp`,JSON.stringify(next));await rename(`${record}.tmp`,record);
  for(let attempt=0;attempt<60;attempt++){
    const status=await probe(port);if(status){const url=`http://localhost:${port}/app.html`;console.log(`Mailgrant is running: ${url}`);console.log(`Local log: ${log}`);if(!noBrowser)openBrowser(url);return;}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  throw new Error(`The server did not become ready. Read ${log}. Run stop.bat before trying again.`);
}
async function main(){
  if(process.platform!=='win32')throw new Error('These launchers are for Windows. Use npm run dev on other systems.');
  const [action,...args]=process.argv.slice(2);
  if(action==='start')return start(args);
  if(action==='stop')return stop();
  if(action==='run'){
    const child=spawn(process.execPath,[wrangler,'dev','--port',args[1],'--ip','127.0.0.1','--log-level','warn'],{cwd:root,env,windowsHide:true,stdio:'inherit'});
    child.once('error',()=>process.exit(1));child.once('exit',code=>process.exit(code??1));return;
  }
  throw new Error('Use start.bat or stop.bat.');
}
if(process.argv[1]&&resolve(process.argv[1])===script)main().catch(error=>{console.error(error.message);process.exitCode=1;});
