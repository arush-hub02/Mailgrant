import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
for(const dir of ['src','public','scripts','tests']){
  for(const file of await readdir(new URL(`../${dir}/`,import.meta.url))){
    if(!/\.(m?js)$/.test(file))continue;
    const result=spawnSync(process.execPath,['--check',new URL(`../${dir}/${file}`,import.meta.url).pathname.replace(/^\/(\w:)/,'$1')],{encoding:'utf8'});
    if(result.status!==0){console.error(result.stderr);process.exit(1);}
  }
}
for(const html of ['index.html','app.html','access.html','docs.html','privacy.html']){
  const text=await readFile(new URL(`../public/${html}`,import.meta.url),'utf8');
  for(const match of text.matchAll(/(?:src|href)="\/(?!\/)([^"?#]+)"/g)){
    if(match[1].startsWith('auth/'))continue;
    await readFile(new URL(`../public/${match[1]}`,import.meta.url));
  }
}
console.log('JavaScript syntax and HTML asset references passed.');
