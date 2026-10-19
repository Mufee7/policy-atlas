import {test} from 'node:test';
import assert from 'node:assert/strict';
import {uploadSchema} from '../lib/upload.js';
const good={documentId:'POL-100',version:'1.0',title:'Test policy',department:'People',status:'approved',effectiveFrom:'2026-01-01',filename:'policy.txt',content:'1. Rule\nA complete rule.',synthetic:true};
test('valid metadata is trimmed and keeps logical identity separate',()=>{const p=uploadSchema.parse({...good,title:' Test policy '});assert.equal(p.title,'Test policy');assert.equal(p.documentId,'POL-100');assert.equal(p.version,'1.0')});
test('rejects blank, binary and oversized content',()=>{for(const content of ['  ','x\u0000y','x'.repeat(524289)])assert.equal(uploadSchema.safeParse({...good,content}).success,false)});
test('rejects unsupported types and invalid status',()=>{assert.equal(uploadSchema.safeParse({...good,filename:'file.doc'}).success,false);assert.equal(uploadSchema.safeParse({...good,status:'published'}).success,false)});
test('rejects invalid and reversed effective dates',()=>{for(const change of [{effectiveFrom:'2026-02-30'},{effectiveUntil:'2025-12-31'},{effectiveUntil:'2026-01-01'}])assert.equal(uploadSchema.safeParse({...good,...change}).success,false)});
test('synthetic flag is explicit, false by default',()=>{const {synthetic,...b}=good;assert.equal(uploadSchema.parse(b).synthetic,false)});
