import {z} from 'zod';import {validDate} from './core.js';
const id=z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const reviewSchema=z.object({left:id,right:id,date:z.string().refine(validDate),status:z.enum(['needs-review','potential-conflict','compatible','historical-change','needs-clarification']),notes:z.string().max(3000)}).refine(b=>b.left!==b.right,'Choose different documents.');
// null means the caller loaded an empty review; omission must never bypass the guard.
export const reviewSaveSchema=reviewSchema.and(z.object({baseRevision:z.string().uuid().nullable()}));
type Source={id:string;title:string;documentId:string;version:string;content:string;status:string;effectiveFrom:string;effectiveUntil:string|null};
export function reviewPairKey(a:string,b:string){return[a,b].sort((x,y)=>x.localeCompare(y)).join('|');}
export function reviewSignatureInput(a:Source,b:Source){return JSON.stringify([a,b].sort((x,y)=>x.id.localeCompare(y.id)).map(p=>({id:p.id,title:p.title,documentId:p.documentId,version:p.version,content:p.content,status:p.status,from:p.effectiveFrom,until:p.effectiveUntil})));}
