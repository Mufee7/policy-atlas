import {NextRequest,NextResponse} from 'next/server';
import {env} from 'cloudflare:workers';
import {eq,and,or,like} from 'drizzle-orm';
import {getDb} from '@/db';
import {documents,conflictReviews} from '@/db/schema';
import {samples} from '@/lib/samples';
import {uploadSchema} from '@/lib/upload';
import {validateBytes,validateExtraction,canonicalText} from '@/lib/ingestion';
import type {Extraction} from '@/lib/core';
export const dynamic='force-dynamic';
function owner(req:Request){return req.headers.get('oai-authenticated-user-id');}
async function hash(data:Uint8Array){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data as Uint8Array<ArrayBuffer>))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function GET(req:NextRequest){
 const user=owner(req);if(!user)return NextResponse.json({error:'Sign in to access your policy library.'},{status:401});
 try{
  const db=getDb();const download=req.nextUrl.searchParams.get('download');
  if(download){const row=(await db.select().from(documents).where(and(eq(documents.owner,user),eq(documents.id,download))))[0];if(!row)return NextResponse.json({error:'Document not found.'},{status:404});
   if(!row.originalKey||!env.BUCKET)return NextResponse.json({error:'The original file is unavailable for this older upload. Download its extracted TXT instead.'},{status:404});
   const object=await env.BUCKET.get(row.originalKey);if(!object)return NextResponse.json({error:'Original file not found.'},{status:404});
   return new Response(object.body,{headers:{'Content-Type':row.format==='pdf'?'application/pdf':row.format==='docx'?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'text/plain;charset=utf-8','Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(row.filename)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  const rows=await db.select().from(documents).where(eq(documents.owner,user));
  return NextResponse.json({documents:[...samples,...rows.map(({owner,synthetic,extractionJson,originalKey,originalHash,...r})=>({...r,synthetic:synthetic==='true',hasOriginal:!!originalKey,extraction:extractionJson?JSON.parse(extractionJson):null}))]},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'The document library is unavailable. Please try again.'},{status:503});}
}
export async function POST(req:NextRequest){
 const user=owner(req);if(!user)return NextResponse.json({error:'Sign in to upload documents.'},{status:401});
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Cross-origin writes are not allowed.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>8*1024*1024)return NextResponse.json({error:'Upload request exceeds the 8 MB limit.'},{status:413});
 let writtenKey:string|null=null;
 try{
  let raw:Record<string,unknown>;let bytes:Uint8Array|null=null;let extraction:Extraction|null=null;let format:'txt'|'pdf'|'docx'='txt';
  if(req.headers.get('content-type')?.includes('multipart/form-data')){
   const form=await req.formData();const file=form.get('file');const metadata=form.get('metadata');
   if(!file||typeof file==='string'||typeof metadata!=='string'||metadata.length>1800000)throw new Error('Choose a file and provide its metadata.');
   bytes=new Uint8Array(await file.arrayBuffer());format=validateBytes(bytes,file.name);raw=JSON.parse(metadata);raw.filename=file.name;
   if(format==='txt')raw.content=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
   else{extraction=validateExtraction(raw.extraction,format);raw.content=canonicalText(extraction);}
  }else{
   const body=await req.text();if(body.length>700000)throw new Error('Upload is too large.');raw=JSON.parse(body);
   if(typeof raw.filename!=='string'||!raw.filename.toLowerCase().endsWith('.txt'))throw new Error('PDF and DOCX uploads require their original files.');
  }
  const parsed=uploadSchema.safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:parsed.error.issues.map(i=>(i.path.join('.')?i.path.join('.')+': ':'')+i.message).join('; ')},{status:400});
  const b=parsed.data;const contentHash=await hash(new TextEncoder().encode(b.content));const originalHash=bytes?await hash(bytes):null;
  const db=getDb();const rows=await db.select().from(documents).where(eq(documents.owner,user));
  if(rows.length>=100)throw new Error('This prototype supports 100 uploaded versions. Delete an unused upload first.');
  if(rows.some(r=>r.contentHash===contentHash||(originalHash&&r.originalHash===originalHash))||samples.some(s=>s.content===b.content))return NextResponse.json({error:'This file or its exact extracted text is already in your library.'},{status:409});
  if([...rows,...samples].some(r=>r.documentId===b.documentId&&r.version===b.version))return NextResponse.json({error:'This document ID and version already exist. Use a new version for changed content.'},{status:409});
  if(rows.reduce((total,row)=>total+new TextEncoder().encode(row.content).length,0)+new TextEncoder().encode(b.content).length>4*1024*1024)throw new Error('This prototype supports 4 MB of extracted text across uploads. Delete unused documents first.');
  const id=crypto.randomUUID();
  if(bytes){if(!env.BUCKET)throw new Error('Original-file storage is unavailable. Please try again later.');writtenKey=`originals/${id}`;await env.BUCKET.put(writtenKey,bytes);}
  const record={...b,id,owner:user,format,extractionJson:extraction?JSON.stringify(extraction):null,originalKey:writtenKey,originalHash,effectiveUntil:b.effectiveUntil||null,contentHash,synthetic:String(b.synthetic),createdAt:new Date().toISOString()};
  await db.insert(documents).values(record);
  return NextResponse.json({id,warnings:extraction?.warnings||[]},{status:201});
 }catch(e){if(writtenKey)await env.BUCKET?.delete(writtenKey).catch(()=>{});return NextResponse.json({error:e instanceof Error&&!e.message.includes('SQL')&&!e.message.includes('constraint')&&!e.message.includes('query')&&!e.message.includes('D1_')&&!e.message.includes('R2_')?e.message:'Upload could not be saved. Please try again.'},{status:400});}
}
export async function DELETE(req:NextRequest){
 const user=owner(req);if(!user)return NextResponse.json({error:'Sign in required.'},{status:401});
 const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Cross-origin writes are not allowed.'},{status:403});
 const id=req.nextUrl.searchParams.get('id');if(!id||id.startsWith('sample-'))return NextResponse.json({error:'Sample documents cannot be deleted.'},{status:400});
 try{
  const db=getDb();const where=and(eq(documents.owner,user),eq(documents.id,id));const row=(await db.select().from(documents).where(where))[0];
  if(!row)return NextResponse.json({error:'Document not found.'},{status:404});
  if(row.originalKey){if(!env.BUCKET)throw new Error('File storage unavailable.');await env.BUCKET.delete(row.originalKey);}
  await db.batch([db.delete(documents).where(where),db.delete(conflictReviews).where(and(eq(conflictReviews.owner,user),or(like(conflictReviews.pair,id+'|%'),like(conflictReviews.pair,'%|'+id))))]);return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:'Delete failed. Please try again.'},{status:503});}
}
