import {canonicalText,validateBytes,validateExtraction} from './ingestion';
import type {Extraction} from './core';
export async function extractFile(file:File,onProgress:(s:string)=>void):Promise<{content:string;extraction:Extraction|null}>{
 const bytes=new Uint8Array(await file.arrayBuffer());const format=validateBytes(bytes,file.name);
 if(format==='txt')return{content:new TextDecoder('utf-8',{fatal:true}).decode(bytes),extraction:null};
 if(format==='docx'){
  onProgress('Reading Word paragraphs…');const imported=await import('mammoth/mammoth.browser');const mammoth=imported.default??imported;
  const result=await mammoth.extractRawText({arrayBuffer:bytes.buffer});
  const raw=result.value.replace(/\r\n?/g,'\n').replace(/\n\n$/,'');
  const extraction=validateExtraction({format:'docx',units:raw.split(/\n\n/).map((text,idx)=>({number:idx+1,text}))},'docx');
  for(const m of result.messages.slice(0,5))if(m.type==='warning')extraction.warnings.push(String(m.message).slice(0,250));
  return{content:canonicalText(extraction),extraction};
 }
 onProgress('Loading PDF text reader…');const pdfjs=await import('pdfjs-dist');
 pdfjs.GlobalWorkerOptions.workerSrc='/parsers/pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:bytes,useSystemFonts:true,stopAtErrors:true});
 task.onPassword=()=>{void task.destroy()};
 try{
  const pdf=await task.promise;if(pdf.numPages>100)throw new Error('PDF files are limited to 100 pages.');const units=[];
  for(let n=1;n<=pdf.numPages;n++){
   onProgress(`Reading PDF page ${n} of ${pdf.numPages}…`);const page=await pdf.getPage(n);const data=await page.getTextContent();const lines:string[]=[];let current='',lastY:number|null=null;
   for(const item of data.items){if(!('str' in item))continue;const y=item.transform[5];if(lastY!==null&&Math.abs(y-lastY)>3&&current){lines.push(current.trimEnd());current='';}if(current&&item.str&&!current.endsWith(' '))current+=' ';current+=item.str;lastY=y;if(item.hasEOL){lines.push(current.trimEnd());current='';lastY=null;}}
   if(current)lines.push(current.trimEnd());units.push({number:n,text:lines.join('\n')});page.cleanup();
  }
  const extraction=validateExtraction({format:'pdf',units},'pdf');return{content:canonicalText(extraction),extraction};
 }catch(e){if(e instanceof Error&&(e.name==='PasswordException'||e.message.toLowerCase().includes('password')||e.message.toLowerCase().includes('worker was destroyed')))throw new Error('Password-protected PDFs are not supported. Upload an unprotected copy.');throw e instanceof Error?e:new Error('PDF could not be read. It may be damaged or unsupported.');}
 finally{await task.destroy().catch(()=>{});}
}
