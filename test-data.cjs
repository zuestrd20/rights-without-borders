const fs=require('fs'), vm=require('vm'), assert=require('node:assert/strict');
const ctx={window:{}}; vm.runInNewContext(fs.readFileSync('data.js','utf8'),ctx);const d=ctx.window.RIGHTS_DATA;
assert(d && d.countries.length>=6); assert(d.taiwan.length>=9); assert(d.cases.length>=5);
const ids=new Set(), urls=new Set(); let items=0;
function sources(obj){assert(obj.sources?.length,`Missing sources: ${obj.title}`);for(const s of obj.sources){assert(s.label); assert(/^https:\/\//.test(s.url));new URL(s.url); urls.add(s.url)}}
for(const c of d.countries){assert(!ids.has(c.id));ids.add(c.id);assert(c.name&&c.region&&c.intro);assert(c.items.length);for(const i of c.items){assert(i.topic&&i.kind&&i.title&&i.text&&i.date);sources(i);items++}}
for(const i of d.taiwan){assert(i.topic&&i.kind&&i.title&&i.text&&i.date);sources(i);items++}for(const c of d.cases){assert(c.date&&c.title&&c.text);sources(c)}
assert(new Set(d.taiwan.map(i=>i.topic)).size>=9);
console.log(JSON.stringify({countries:d.countries.length,rightsItems:items,taiwanItems:d.taiwan.length,cases:d.cases.length,uniqueSourceURLs:urls.size,status:'PASS'},null,2));
