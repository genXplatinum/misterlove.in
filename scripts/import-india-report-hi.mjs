/** Complete Hindi web edition, generated from the reviewed translation manuscript. */
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const source=JSON.parse(readFileSync(new URL('assets/reports/india-before-and-after-2014/content-hi.json',root),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('assets/reports/india-before-and-after-2014/master-hi-manifest.json',root),'utf8'));
const info=[
 ['अर्थव्यवस्था','पैसा, काम और अर्थव्यवस्था','आय, कीमतें, मज़दूरी, रोज़गार, बैंक, सरकारी पैसा और व्यापार। क्या बदला और कौन-सी तुलना में सावधानी चाहिए?'],
 ['बुनियादी सेवाएँ','रोज़मर्रा की ज़िंदगी का बुनियादी ढाँचा','सड़क, रेल, बिजली, पानी, शौचालय, घर और डिजिटल पहुँच। कनेक्शन मिलना शुरुआत है; सेवा का काम करना असली नतीजा है।'],
 ['लोग','स्वास्थ्य, पढ़ाई और जीवन की स्थिति','उम्र, शिशु और मातृ मृत्यु, पोषण, सीखना, गरीबी और घरेलू सुविधाएँ। हर सर्वेक्षण का वर्ष उसके आँकड़े के साथ है।'],
 ['उत्पादन','खेती, उद्योग, विज्ञान और उत्पादन','किसान, कारखाने, इस्पात, कोयला, इलेक्ट्रॉनिक्स, स्टार्टअप, शोध, अंतरिक्ष और रक्षा। क्षमता, उत्पादन, पंजीकरण और योजना अलग बातें हैं।'],
 ['सार्वजनिक जीवन','सुरक्षा, संस्थाएँ और पर्यावरण','अपराध, पुलिस, अदालत, जेल, नागरिक भागीदारी और पर्यावरण। दर्ज संख्या बढ़े तो उसका मतलब भी समझना होगा।'],
 ['तुलना','राज्य, रैंकिंग और मूल चार्ट','राज्यों का अलग अनुभव, अंतरराष्ट्रीय रैंकिंग और The Matrix के दावे। तारीख, परिभाषा और पद्धति बदलने की जाँच।'],
 ['अंतिम तुलना','किसने बेहतर किया: UPA या NDA?','प्राथमिकताओं और सीमाओं सहित अंतिम आकलन। वृद्धि, सुविधाएँ, आज़ादी, COVID, दूसरे संकट और राजनीतिक श्रेय की सीमा।'],
];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const fmt=s=>String(s).replaceAll('<b>','<strong>').replaceAll('</b>','</strong>').replaceAll('<i>','<em>').replaceAll('</i>','</em>');
const plain=s=>String(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
function table(headers,rows){return `<div class="w-table-scroll" role="region" aria-label="${esc(plain(headers.join(' · ')))}" tabindex="0"><table class="w-table w-table--india"><thead><tr>${headers.map(h=>`<th scope="col">${fmt(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((c,i)=>i===0?`<th scope="row">${fmt(c)}</th>`:`<td>${fmt(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
const parts=source.map((v,i)=>{
 const n=v.n,[label,title,lead]=info[i],toc=[];
 let html=`<p class="w-note">पूरी हिंदी रिपोर्ट में सात भाग और ${manifest.pages} पृष्ठों की एक मास्टर PDF है। इस भाग की मूल जानकारी ${n<=2?'2':'3'} अक्टूबर 2026 तक जाँची गई थी। हर आँकड़े का अपना अवलोकन वर्ष है। पुराने पढ़ने के निर्देशों में पृष्ठ-संख्या मूल अंग्रेज़ी भाग की है; हिंदी पाठ में नीचे की विषय सूची इस्तेमाल करें।</p>`;
 v.pages.forEach((p,j)=>{
  const id=`hi-${n}-${j+1}`;toc.push({id,num:String(j+1).padStart(2,'0'),text:p.title});
  html+=`<h2 class="w-h2" id="${id}">${esc(p.title)}</h2>`;
  if(p.deck)html+=`<p><em>${fmt(p.deck)}</em></p>`;
  if(n===1&&j===1){
   html+='<p>छह भाग प्रमाणों को समझाते हैं। हर जगह पहले की संख्या, हालिया संख्या, बदलाव का मतलब और तुलना की सीमाएँ साथ मिलेंगी। सातवाँ भाग दोनों सरकारों की अंतिम तुलना करता है।</p>';
   html+=table(['भाग','इसमें क्या है?','हिंदी मास्टर में पृष्ठ'],info.map((x,k)=>[String(k+1),x[1],String(manifest.volumes[k].pages)]));
   html+=`<p>सातों भाग पूरे हैं और यहाँ पढ़े जा सकते हैं। ${manifest.pages} पृष्ठों की हिंदी मास्टर PDF में पूरा पाठ, तालिकाएँ, स्रोत, लेखक का नोट और क्लिक करके खुलने वाली विषय सूची है। हर भाग की अपनी स्रोत सूची है।</p><h3 class="w-h3">पहले भाग में</h3><p>तुलना के ज़रूरी शब्द, अर्थव्यवस्था, आय, कीमतें, मज़दूरी, काम, महिलाओं की भागीदारी, घरेलू खर्च, गरीबी, सरकारी पैसा, बैंक, व्यापार, कर्ज़ और निवेश। शब्द नए लगें तो शुरुआत से पढ़ें, या विषय सूची से अपना विषय चुनें।</p>`;
  }else for(const b of p.blocks){
   if(b[0]==='p')html+=`<p>${fmt(b[1])}</p>`;
   else if(b[0]==='sub')html+=`<h3 class="w-h3">${fmt(b[1])}</h3>`;
   else if(b[0]==='table')html+=table(b[1],b[2]);
   else throw new Error(`Unknown block ${b[0]}`);
  }
  if(p.note)html+=`<p class="w-note">${fmt(p.note)}</p>`;
  if(p.refs?.length)html+=`<p class="w-note">स्रोत: ${p.refs.map(r=>`<a href="#hi-${n}-source-${r}" aria-label="${esc(p.title)} का स्रोत ${r}">${r}</a>`).join(', ')}।</p>`;
 });
 const id=`hi-${n}-sources`;toc.push({id,num:'स्रोत',text:'स्रोत और पढ़ने की जानकारी'});
 html+=`<h2 class="w-h2" id="${id}">स्रोत और पढ़ने की जानकारी</h2><div class="prose--sources"><p>संस्था और रिपोर्ट के मूल प्रकाशित नाम रखे गए हैं, ताकि आप इन्हें आसानी से खोज सकें। व्याख्या हिंदी में है।</p><ol>`;
 v.sources.forEach(([org,title,note,url,...extra],j)=>{
  html+=`<li id="hi-${n}-source-${j+1}"><strong>${esc(org)}.</strong> <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>. ${esc(note)}`;
  const extraLinks=[];
  for(let k=0;k<extra.length;k++){
   if(Array.isArray(extra[k]))extraLinks.push(extra[k]);
   else extraLinks.push([extra[k],extra[++k]]);
  }
  for(const [extraTitle,extraURL] of extraLinks){
   if(!/^https?:\/\//.test(extraURL))throw new Error(`Invalid supplemental source URL ${extraURL}`);
   html+=` <a href="${esc(extraURL)}" target="_blank" rel="noopener noreferrer">${esc(extraTitle)}</a>.`;
  }
  html+='</li>';
 });
 html+='</ol><p>यह सूची इसी भाग के लिए है। तारीख, परिभाषा और तुलना की सीमाएँ संबंधित संख्या के साथ समझाई गई हैं। The Matrix के पोस्ट शुरुआती सवाल थे; उनके दावे दिए गए प्रमाणों से जाँचे गए हैं।</p></div>';
 const words=plain(html).split(/\s+/).filter(Boolean).length;
 return{n,label,title,lead,published:'2026-10-04',words,minutes:Math.ceil(words/200),toc,html};
});
writeFileSync(new URL('src/data/writing/india-before-and-after-2014-hi.js',root),`/* Generated from the complete reviewed Hindi manuscript. */\nconst parts=${JSON.stringify(parts,null,2)};\nexport default parts;\n`);
const meta={language:'hi',locale:'hi_IN',ogSlug:'india-before-and-after-2014-hi',published:'2026-10-04',displayDate:'4 अक्टूबर 2026',kicker:'सात भागों का पूरा रिपोर्ट कार्ड',title:'भारत: 2014 से पहले और बाद',subtitle:'आँकड़े, बदलाव और दोनों सरकारों की अंतिम तुलना',standfirst:'भारत में 2014 से पहले और बाद क्या बदला? सात भागों में आसान हिंदी में संख्या, बदलाव और सीमाएँ समझें। कांग्रेस के नेतृत्व वाले UPA और BJP के नेतृत्व वाले NDA की तुलना में COVID और दूसरे बड़े संकट भी शामिल हैं।',summary:'The Matrix India के चार्टों से शुरुआत करके मैंने हर दावे को प्रकाशित प्रमाणों से मिलाया। छह भाग अर्थव्यवस्था, बुनियादी सेवाएँ, स्वास्थ्य और पढ़ाई, खेती और उत्पादन, सुरक्षा और संस्थाएँ, तथा राज्यों और रैंकिंग को समझाते हैं। सातवाँ भाग अंतिम तुलना देता है। बुनियादी ढाँचे का काम पूरा होने, रोज़ की सेवाओं की पहुँच और बैंकिंग से जुड़ाव को सबसे अधिक महत्त्व देने पर NDA को सशर्त बढ़त मिलती है। एक ही पुरानी श्रृंखला में पूरे दशक की वास्तविक GDP वृद्धि में UPA बेहतर है। संस्थागत आज़ादी के स्वतंत्र आकलनों में भी UPA का पक्ष अधिक मज़बूत है। प्राथमिकताएँ बदलने पर समग्र चुनाव बदल सकता है; यह हर क्षेत्र में एक ही विजेता का दावा नहीं है। तुलना में UPA का समय 2004-2014 और NDA का समय 2014 के बाद है। 2014 से पहले का पूरा इतिहास केवल कांग्रेस शासन नहीं था। हिंदी संस्करण पूरा पाठ, डेटा तालिकाएँ, तारीखें और स्रोत रखता है। मूल जानकारी की जाँच 2-3 अक्टूबर 2026 तक है; पूरे 2026 के परिणाम मानकर नहीं चले हैं।',topic:'भारत · अर्थव्यवस्था · सार्वजनिक नीति · UPA और NDA',keywords:['भारत 2014 से पहले और बाद','भारत रिपोर्ट कार्ड हिंदी','UPA और NDA तुलना','कांग्रेस और BJP तुलना','भारत अर्थव्यवस्था','बुनियादी सेवाएँ','The Matrix India','महामारी और आर्थिक वृद्धि'],status:'पूर्ण',parts:7,words:parts.reduce((a,p)=>a+p.words,0),minutes:parts.reduce((a,p)=>a+p.minutes,0),pdf:'india-before-and-after-2014-master-hi.pdf',pdfSize:`${(manifest.bytes/1e6).toFixed(1)} MB`,pdfLabel:`पूरी हिंदी रिपोर्ट · ${manifest.pages} पृष्ठ`,principles:[]};
writeFileSync(new URL('src/data/writing/india-before-and-after-2014-hi-meta.js',root),`/* Generated with the Hindi edition and its verified PDF manifest. */\nexport const hindiReportMeta=${JSON.stringify(meta,null,2)};\n`);
console.log(JSON.stringify({parts:parts.length,words:meta.words,minutes:meta.minutes,sections:parts.map(p=>p.toc.length),pdfPages:manifest.pages},null,2));
