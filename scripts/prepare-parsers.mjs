import {copyFileSync,mkdirSync} from 'node:fs';
mkdirSync('public/parsers',{recursive:true});
copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','public/parsers/pdf.worker.min.mjs');
copyFileSync('node_modules/pdfjs-dist/LICENSE','public/parsers/PDFJS-LICENSE');
