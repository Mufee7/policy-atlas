import {NextRequest,NextResponse} from 'next/server';import {and,eq,or} from 'drizzle-orm';
import {getDb} from '@/db';import {documents,conflictReviews} from '@/db/schema';import {samples} from '@/lib/samples';import {conflictExamples} from '@/lib/conflict-examples';import {validDate} from '@/lib/core';import {reviewSchema,reviewSaveSchema,reviewPairKey,reviewSignatureInput} from '@/lib/review-store';
export const dynamic='force-dynamic';

async function resolvePair(user:string,left:string,right:string){
 const owned=await getDb().select().from(documents).where(and(eq(documents.owner,user),or(eq(documents.id,left),eq(documents.id,right))));const all=[...samples,...conflictExamples,...owned];const a=all.find(p=>p.id===left),b=all.find(p=>p.id===right);if(!a||!b)return null;
 const pair=reviewPairKey(left,right);const raw=reviewSignatureInput(a,b);const signature=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))).map(v=>v.toString(16).padStart(2,'0')).join('');return{pair,signature};
}
export async function GET(req:NextRequest){
 const user=req.headers.get('oai-authenticated-user-id');if(!user)return NextResponse.json({error:'Sign in to access your review notes.'},{status:401});
 const left=req.nextUrl.searchParams.get('left')||'',right=req.nextUrl.searchParams.get('right')||'',date=req.nextUrl.searchParams.get('date')||'';
 if(!reviewSchema.safeParse({left,right,date,status:'needs-review',notes:''}).success)return NextResponse.json({error:'Choose two different documents and a valid review date.'},{status:400});
 try{const pair=await resolvePair(user,left,right);if(!pair)return NextResponse.json({error:'A selected document is unavailable.'},{status:404});const record=(await getDb().select().from(conflictReviews).where(and(eq(conflictReviews.owner,user),eq(conflictReviews.pair,pair.pair),eq(conflictReviews.reviewDate,date))))[0];return NextResponse.json({review:record?{status:record.status,notes:record.notes,updatedAt:record.updatedAt,revision:record.revision,stale:record.signature!==pair.signature}:null},{headers:{'Cache-Control':'private, no-store'}});}catch{return NextResponse.json({error:'Saved review could not be loaded. Retry before saving.'},{status:503});}
}
export async function POST(req:NextRequest){
 const user=req.headers.get('oai-authenticated-user-id');if(!user)return NextResponse.json({error:'Sign in to save review notes.'},{status:401});const origin=req.headers.get('origin');if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:'Cross-origin writes are not allowed.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>20000)return NextResponse.json({error:'Review is too large.'},{status:413});
 try{const body=await req.text();if(body.length>20000)return NextResponse.json({error:'Review is too large.'},{status:413});const parsed=reviewSaveSchema.safeParse(JSON.parse(body));if(!parsed.success)return NextResponse.json({error:'Provide a valid review decision, date, and notes up to 3,000 characters.'},{status:400});const b=parsed.data,pair=await resolvePair(user,b.left,b.right);if(!pair)return NextResponse.json({error:'A selected document is unavailable.'},{status:404});const updatedAt=new Date().toISOString(),revision=crypto.randomUUID();
 const db=getDb();
 // Both branches enforce the expected revision in a single database statement.
 // An expected existing record must never be recreated after deletion.
 const changed=b.baseRevision===null
  ?await db.insert(conflictReviews).values({id:crypto.randomUUID(),owner:user,pair:pair.pair,reviewDate:b.date,signature:pair.signature,status:b.status,notes:b.notes,updatedAt,revision}).onConflictDoNothing({target:[conflictReviews.owner,conflictReviews.pair,conflictReviews.reviewDate]}).returning({revision:conflictReviews.revision})
  :await db.update(conflictReviews).set({signature:pair.signature,status:b.status,notes:b.notes,updatedAt,revision}).where(and(eq(conflictReviews.owner,user),eq(conflictReviews.pair,pair.pair),eq(conflictReviews.reviewDate,b.date),eq(conflictReviews.revision,b.baseRevision))).returning({revision:conflictReviews.revision});
 if(!changed.length)return NextResponse.json({error:'This review changed in another tab or session. Your unsaved notes are still here. Export your draft before reloading the latest review.',code:'review-changed'},{status:409});
 return NextResponse.json({ok:true,updatedAt,revision});}catch{return NextResponse.json({error:'Review could not be saved. Please try again.'},{status:503});}
}
