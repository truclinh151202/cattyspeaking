// Shared, deterministic checks. These do not assess pronunciation.
export const clean = s => String(s || '').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9' ]/g,' ').replace(/\s+/g,' ').trim();
export const NUMBER = {one:1,a:1,an:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
export const PRODUCTS = {apple:{plural:'apples',price:2},banana:{plural:'bananas',price:1},orange:{plural:'oranges',price:3}};
const itemRE = /\b(?:(one|two|three|four|five|six|seven|eight|nine|ten|[1-9]|10|a|an)\s+)?(apples?|bananas?|oranges?)\b/g;
export function parseOrder(raw){
 const t=clean(raw),out=[];let m;
 while((m=itemRE.exec(t))){const before=t.slice(0,m.index),negative=/\b(?:no|not|don't|do not|without|cancel)\s*(?:want\s*)?(?:any\s*)?$/.test(before);
  const key=m[2].replace(/s$/,''),qty=m[1]?(NUMBER[m[1]]||+m[1]):null;
  out.push({item:key,qty,negative,index:m.index});
 }
 return out;
}
const negation = /\b(?:not|no|don't|do not|can't|cannot|won't|isn't|aren't|didn't|never|without|cancel)\b/;
function orderIntent(t){return /\b(?:i(?:'d| would)? (?:like|want|need|love)|can i|could i|may i|i(?:'ll| will) (?:take|have)|give me|please)\b/.test(t)||/^(?:actually )?(?:(?:one|two|three|four|five|six|seven|eight|nine|ten|[1-9]|10|a|an) )?(?:apples?|bananas?|oranges?)\b/.test(t);}
export function localCheck(text,task,question=''){
 const t=clean(text);if(!t)return {status:'empty',verified:false,met:[],missing:[]};
 const price=/\b(how much|price|cost)\b/.test(t),mentions=parseOrder(t),expected=task.n?.replace(/s$/,'');
 // A conservative offline check for built-in fruit tasks only.
 if(!expected)return {status:'unverified',verified:false,met:[],missing:[],reason:'semantic'};
 let chosen=mentions.filter(x=>x.item===expected).at(-1);
 if(!chosen && /how many/.test(clean(question)) && /^(one|two|three|four|five|six|seven|eight|nine|ten|[1-9]|10)( please)?$/.test(t))chosen={item:expected,qty:NUMBER[t.split(' ')[0]]||+t.split(' ')[0],negative:false};
 const uncertainty=/\b(?:maybe|or|either)\b/.test(t);
 // Negation that cannot be resolved safely must not produce success.
 const ambiguousNeg=negation.test(t);
 if(uncertainty||ambiguousNeg||(!orderIntent(t)&&!(/how many/.test(clean(question))&&chosen)))return {status:'clarify',verified:false,met:[],missing:[],reason:'clarify'};
 const item=!!chosen&&!chosen.negative,qty=item&&chosen.qty===task.qty,met=[],missing=[];
 (item?met:missing).push('item');(qty?met:missing).push('quantity');if(task.price)(price?met:missing).push('price');
 const grammar=/\b(?:one|a|an|1) (?:apples|bananas|oranges)\b|\b(?:two|three|four|five|[2-9]) (?:apple|banana|orange)\b/.test(t)?'plural':null;
 return {status:missing.length?(met.length?'part':'retry'):'done',verified:true,met,missing,grammar};
}
function numberIPA(n){const one=['ˈzɪroʊ','wʌn','tu','θri','fɔr','faɪv','sɪks','ˈsɛvən','eɪt','naɪn','tɛn','ɪˈlɛvən','twɛlv','ˌθɝˈtin','ˌfɔrˈtin','ˌfɪfˈtin','ˌsɪksˈtin','ˌsɛvənˈtin','ˌeɪˈtin','ˌnaɪnˈtin'];return n<20?one[n]:({2:'ˈtwɛnti',3:'ˈθɝti',4:'ˈfɔrti',5:'ˈfɪfti',6:'ˈsɪksti'}[Math.floor(n/10)]||String(n))+(n%10?' '+one[n%10]:'');}
export function newShop(){return {stage:'order',order:{},turns:0,complete:false,ended:false,reply:'Hello! What would you like?',ipa:'/həˈloʊ wʌt wʊd ju laɪk/'};}
export function shopTurn(state,raw){
 const s=structuredClone(state),t=clean(raw);if(s.ended)return s;s.turns++;let reply='',ipa='';
 const rows=parseOrder(t),positive=rows.filter(x=>!x.negative),ambiguous=/\b(?:or|maybe|either)\b/.test(t);
 if(ambiguous){reply='Which fruit and how many would you like?';ipa='/wɪtʃ frut ænd haʊ ˈmɛni wʊd ju laɪk/';}
 else if(rows.some(x=>x.negative)){
  for(const x of rows.filter(x=>x.negative))delete s.order[x.item];
  reply='Please confirm your order with the fruit and quantity.';ipa='/pliz kənˈfɝm jʊr ˈɔrdər wɪð ðə frut ænd ˈkwɑntəti/';s.stage='order';
 }else if(positive.length&&!orderIntent(t)){reply='Are you ordering fruit? Please tell me your order.';ipa='/ɑr ju ˈɔrdərɪŋ frut pliz tɛl mi jʊr ˈɔrdər/';
 }else if(positive.some(x=>!x.qty)){
  s.pending=positive.find(x=>!x.qty).item;s.stage='quantity';reply=`How many ${PRODUCTS[s.pending].plural} would you like?`;ipa=`/haʊ ˈmɛni ${s.pending==='apple'?'ˈæpəlz':s.pending==='banana'?'bəˈnænəz':'ˈɔrɪndʒɪz'} wʊd ju laɪk/`;
 }else if(positive.length){
  for(const x of positive)s.order[x.item]=x.qty;
  s.pending=null;s.stage='more';reply='Anything else, or is that all?';ipa='/ˈɛniθɪŋ ɛls ɔr ɪz ðæt ɔl/';
 }else if(s.stage==='quantity'&&/^(one|two|three|four|five|six|seven|eight|nine|ten|[1-9]|10)( please)?$/.test(t)){
  s.order[s.pending]=NUMBER[t.split(' ')[0]]||+t.split(' ')[0];s.pending=null;s.stage='more';reply='Anything else, or is that all?';ipa='/ˈɛniθɪŋ ɛls ɔr ɪz ðæt ɔl/';
 }else if(s.stage==='more'&&/^(no( thank you| thanks)?|that'?s all( thank you| thanks)?|that is all|nothing else|how much.*|what.*cost.*)$/.test(t)){
  const total=Object.entries(s.order).reduce((a,[k,n])=>a+PRODUCTS[k].price*n,0);s.total=total;s.stage='pay';reply=`That's ${total} dollars. How would you like to pay?`;ipa=`/ðæts ${numberIPA(total)} ˈdɑlərz haʊ wʊd ju laɪk tə peɪ/`;
 }else if(s.stage==='pay'&&/\b(?:cash|card|here you go|here it is|here you are)\b/.test(t)&&!negation.test(t)){
  s.stage='done';s.complete=true;s.ended=true;reply='Thank you! Have a nice day!';ipa='/θæŋk ju hæv ə naɪs deɪ/';
 }else {reply=s.stage==='pay'?'Would you like to pay by cash or card?':'Please say the fruit and quantity, such as two apples.';ipa=s.stage==='pay'?'/wʊd ju laɪk tə peɪ baɪ kæʃ ɔr kɑrd/':'/pliz seɪ ðə frut ænd ˈkwɑntəti sʌtʃ æz tu ˈæpəlz/';}
 if(s.turns>=5&&!s.complete)s.ended=true;
 return {...s,reply,ipa};
}
export function updateAdaptive(profile,result,assisted){
 const p={level:0,streak:0,offer:false,...profile};
 if(result.verified&&result.status==='done'&&!assisted){p.streak++;if(p.streak>=2&&p.level<3)p.offer=true;}
 else {p.streak=0;p.offer=false;}return p;
}
