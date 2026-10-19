// Local database setup only. This script never accepts --remote.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';import {resolve,dirname} from 'node:path';import {pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';
if(process.argv.length>2)throw new Error('This helper accepts no arguments and applies local migrations only.');
const built=resolve('dist/server/wrangler.json');if(!existsSync(built))throw new Error('Build the app first with pnpm build, then run pnpm local:db.');
const config=JSON.parse(readFileSync(built,'utf8'));config.main=resolve(dirname(built),config.main);
if(config.assets?.directory)config.assets.directory=resolve(dirname(built),config.assets.directory);
for(const entry of config.d1_databases||[])entry.migrations_dir=resolve('drizzle');
if(!config.d1_databases?.some(d=>d.binding==='DB'))throw new Error('The local DB binding is missing. Check .openai/hosting.json.');
mkdirSync('.sites-runtime',{recursive:true});const local=resolve('.sites-runtime/local-database.json');writeFileSync(local,JSON.stringify(config,null,2)+'\n');
const r=spawnSync(process.execPath,['--import',pathToFileURL(resolve('scripts/sites-env.mjs')).href,resolve('node_modules/wrangler/bin/wrangler.js'),'d1','migrations','apply','DB','--local','--config',local,'--persist-to',resolve('.wrangler/state')],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status??1);console.log('Local database is ready. Hosted data was not modified.');
