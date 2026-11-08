export const text=(v,n=400)=>typeof v==='string'?v.trim().slice(0,n):'';
export const language=b=>['vi','en','zh-TW'].includes(b.language)?b.language:'vi';
export async function generate(system,input){
 const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('unavailable');
 const model=(process.env.GEMINI_MODEL||'gemini-3.1-flash-lite').trim();
 const cfg={responseMimeType:'application/json',temperature:0.25};if(model==='gemini-3.1-flash-lite')cfg.thinkingConfig={thinkingLevel:'minimal'};
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
  method:'POST',signal:AbortSignal.timeout(14000),headers:{'content-type':'application/json','x-goog-api-key':key},
  body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:JSON.stringify(input)}]}],generationConfig:cfg})
 });
 if(!response.ok)throw new Error('upstream');const d=await response.json();
 const part=d.candidates?.[0]?.content?.parts?.filter(x=>typeof x.text==='string'&&!x.thought).map(x=>x.text).join('');
 return JSON.parse(part||'');
}
export function getVariants(v){
 if(!Array.isArray(v)||v.length!==3)throw new Error('variants');
 return v.map((x,i)=>{if(!['standard','short','polite'][i]||x.kind!==['standard','short','polite'][i]||!text(x.en,220)||!/^\/[^\/]+\/$/.test(text(x.ipa,500))||!text(x.meaning,300)||!text(x.context,200))throw new Error('variant');
 return {kind:x.kind,en:text(x.en,220),ipa:text(x.ipa,500),meaning:text(x.meaning,300),context:text(x.context,200)};});
}
export const VARIANTS=`variants must contain exactly three versions of the SAME communicative intent: kinds standard, short, polite in that order. Every version has en (simple English), ipa (broad General American between / /), meaning (learner-language translation), context (learner-language usage note). Do not change quantities, items, agreement into refusal, or invent facts. Short is natural and still polite for a shop, not slang; explain context. In a social setting it may be friendly. Do not require beginners to use the polite version.`;
