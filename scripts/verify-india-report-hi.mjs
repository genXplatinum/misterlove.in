import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import hindi from '../src/data/writing/india-before-and-after-2014-hi.js';
import {getPieceForLanguage} from '../src/data/writing.js';
const root=new URL('../',import.meta.url);
const en=JSON.parse(readFileSync(new URL('assets/reports/india-before-and-after-2014/content.json',root),'utf8'));
const hi=JSON.parse(readFileSync(new URL('assets/reports/india-before-and-after-2014/content-hi.json',root),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('assets/reports/india-before-and-after-2014/master-hi-manifest.json',root),'utf8'));
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
assert(hi.length===7&&hindi.length===7,'Seven full parts required');
let tables=0,cells=0,paragraphs=0,sources=0;
for(let i=0;i<7;i++){
 const a=en[i],b=hi[i],part=hindi[i];
 assert(a.pages.length===b.pages.length,`Part ${i+1}: omitted sections`);
 assert(part.toc.length===a.pages.length+1,`Part ${i+1}: missing contents entries`);
 assert(a.sources.length===b.sources.length,`Part ${i+1}: missing source`);
 for(let j=0;j<a.sources.length;j++){
  assert(JSON.stringify(a.sources[j].slice(0,2))===JSON.stringify(b.sources[j].slice(0,2)),`Changed source identity ${i+1}:${j+1}`);
  assert(JSON.stringify(a.sources[j].slice(3))===JSON.stringify(b.sources[j].slice(3)),`Changed source links ${i+1}:${j+1}`);sources++;
  const entry=b.sources[j];
  const expectedURLs=[entry[3]];
  for(let k=4;k<entry.length;k++){
   const supplemental=Array.isArray(entry[k])?entry[k]:[entry[k],entry[++k]];
   expectedURLs.push(supplemental[1]);
  }
  assert(expectedURLs.every(url=>/^https?:\/\//.test(url)&&part.html.includes(`href="${String(url).replaceAll('&','&amp;').replaceAll('"','&quot;')}"`)),`Missing source link ${i+1}:${j+1}`);
 }
 const ids=new Set([...part.html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 const links=[...part.html.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
 assert(links.every(id=>ids.has(id)),`Part ${i+1}: broken internal reference`);
 for(let j=0;j<a.pages.length;j++){
  if(i===0&&j===1)continue; // The old delivery plan is replaced by the complete-series guide.
  assert(a.pages[j].blocks.length===b.pages[j].blocks.length,`Part ${i+1}, section ${j+1}: omitted blocks`);
  a.pages[j].blocks.forEach((block,k)=>{
   const translated=b.pages[j].blocks[k];
   assert(block[0]===translated[0],`Changed block type ${i+1}:${j+1}:${k}`);
   if(block[0]==='p')paragraphs++;
   if(block[0]==='table'){
    tables++;assert(block[1].length===translated[1].length,'Missing table header');
    assert(block[2].length===translated[2].length,'Missing table row');
    block[2].forEach((row,r)=>assert(row.length===translated[2][r].length,'Missing data cell'));
    cells+=block[1].length+block[2].flat().length;
   }
  });
 }
 assert(!/⁇|\ufffd/.test(part.html),'Translation artifact in text');
 assert(!part.html.includes('href="undefined"'),'Undefined source URL');
}
assert(tables===152&&sources===289,'Incomplete tables or sources');
const pdf=readFileSync(new URL('public/india-before-and-after-2014-master-hi.pdf',root));
assert(createHash('sha256').update(pdf).digest('hex')===manifest.sha256,'Hindi PDF hash mismatch');
assert(manifest.volumes.length===7&&manifest.volumes.reduce((a,v)=>a+v.pages,manifest.frontPages)===manifest.pages,'Hindi page manifest mismatch');
const piece=getPieceForLanguage('india-before-and-after-2014','hi');
assert(piece.language==='hi'&&piece.parts===7&&piece.pdf.endsWith('-hi.pdf'),'Language manifest mismatch');
const dist=new URL('dist/hi/writing/india-before-and-after-2014/index.html',root);
if(existsSync(dist)){
 const html=readFileSync(dist,'utf8');assert(html.includes('https://misterlove.in/hi/writing/india-before-and-after-2014/'),'Missing Hindi canonical');
 assert(html.includes('hreflang="en"')&&html.includes('hreflang="hi"'),'Missing language alternates');
 for(let n=1;n<=7;n++){
  const path=new URL(`dist/hi/writing/india-before-and-after-2014/part-${n}/index.html`,root);
  assert(existsSync(path),`Missing static Hindi part ${n}`);
  const rendered=readFileSync(path,'utf8');
  assert(rendered.includes(hindi[n-1].html),`Incomplete static Hindi part ${n}`);
  assert(rendered.includes('<html lang="hi"'),`Incorrect language in part ${n}`);
  assert(rendered.includes(`https://misterlove.in/hi/writing/india-before-and-after-2014/part-${n}/`),`Incorrect canonical in part ${n}`);
 }
 const distPdf=readFileSync(new URL('dist/india-before-and-after-2014-master-hi.pdf',root));
 assert(createHash('sha256').update(distPdf).digest('hex')===manifest.sha256,'Built Hindi PDF hash mismatch');
}
console.log(JSON.stringify({parts:7,sections:hi.reduce((a,v)=>a+v.pages.length,0),dataTables:tables,dataCells:cells,paragraphs,sources,pdfPages:manifest.pages,pdfSha256:manifest.sha256},null,2));
