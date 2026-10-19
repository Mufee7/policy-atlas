import {z} from 'zod';
import {validDate} from './core.js';
const short=z.string().trim().min(1).max(180);
export const uploadSchema=z.object({
 documentId:z.string().trim().regex(/^[a-zA-Z0-9_-]{1,60}$/),version:short,title:short,department:short,
 status:z.enum(['approved','draft','archived']),effectiveFrom:z.string().refine(validDate,'Invalid start date'),
 effectiveUntil:z.string().optional().default('').refine(s=>!s||validDate(s),'Invalid end date'),
 filename:short.refine(s=>s.toLowerCase().match(/\.(txt|pdf|docx)$/i)!==null,'Only TXT, PDF and DOCX files are supported'),
 content:z.string().min(1).refine(s=>s.trim().length>0,'The document is empty').refine(s=>new TextEncoder().encode(s).length<=524288,'Maximum size is 512 KB').refine(s=>!s.includes('\u0000'),'Binary content is not supported'),synthetic:z.boolean().default(false),
}).refine(s=>!s.effectiveUntil||s.effectiveUntil>s.effectiveFrom,'End date must be after start date (end date is exclusive)');
