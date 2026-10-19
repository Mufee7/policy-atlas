import {readFileSync} from 'node:fs';
import {unzipSync} from 'fflate';
import {verifyCheckpoint,sha256} from './checkpoint-utils.mjs';
if(process.argv.length!==3)throw new Error('Usage: node scripts/verify-checkpoint.mjs path.zip');
const archive=new Uint8Array(readFileSync(process.argv[2]));
const manifest=verifyCheckpoint(unzipSync(archive));
console.log(JSON.stringify({verified:true,snapshotKind:manifest.snapshotKind,files:manifest.files,archiveSha256:sha256(archive),contentSha256:manifest.contentSha256},null,2));
