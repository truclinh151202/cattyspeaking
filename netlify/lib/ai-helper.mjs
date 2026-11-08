export const text=(v,n=400)=>typeof v==='string'?v.trim().slice(0,n):'';
export const language=b=>['vi','en','zh-TW'].includes(b.language)?b.language:'vi';
export async function generate(system,input,options={}){
 const key=process.env.GEMINI_API_KEY;if(!key)throw new Error('ai_not_configured');
 const model=(process.env.GEMINI_MODEL||'gemini-3.1-flash-lite').trim();
 const cfg={responseMimeType:'application/json',temperature:0.25};if(model==='gemini-3.1-flash-lite')cfg.thinkingConfig={thinkingLevel:'minimal'};
 let response;try{response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
  method:'POST',signal:AbortSignal.timeout(14000),headers:{'content-type':'application/json','x-goog-api-key':key},
  body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:JSON.stringify(input)},...(options.audio?[{inlineData:{mimeType:options.audio.mimeType,data:options.audio.data}}]:[])]}],generationConfig:cfg})
 });}catch(e){throw new Error(e?.name==='TimeoutError'||e?.name==='AbortError'?'ai_timeout':'ai_network');}
 if(!response.ok)throw new Error(({400:'ai_request_rejected',401:'ai_auth',403:'ai_auth',404:'ai_model_unavailable',429:'ai_rate_limit',500:'ai_busy',503:'ai_busy'})[response.status]||'ai_upstream');const d=await response.json();
 const part=d.candidates?.[0]?.content?.parts?.filter(x=>typeof x.text==='string'&&!x.thought).map(x=>x.text).join('');
 if(!part)throw new Error('ai_empty_response');
 try{return JSON.parse(part.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));}catch{throw new Error('ai_invalid_json');}
}
export function getVariants(v){
 if(!Array.isArray(v)||v.length!==3)throw new Error('variants');
 return v.map((x,i)=>{if(!['standard','short','polite'][i]||x.kind!==['standard','short','polite'][i]||!text(x.en,220)||!/^\/[^\/]+\/$/.test(text(x.ipa,500))||!text(x.meaning,300)||!text(x.context,200))throw new Error('variant');
 return {kind:x.kind,en:text(x.en,220),ipa:text(x.ipa,500),meaning:text(x.meaning,300),context:text(x.context,200)};});
}
export const VARIANTS=`variants must contain exactly three versions of the SAME communicative intent: kinds standard, short, polite in that order. Use these exact JSON property names, including kind, on EACH object: {"kind":"standard","en":"English sentence","ipa":"/phonetic transcription/","meaning":"translation","context":"usage note"}. The next objects use kind "short" and "polite". Do not use type, style, text, pronunciation, or translation as alternative property names. en is simple English; ipa is broad General American between / /; meaning and context must use learnerLanguage. Do not change quantities, items, agreement into refusal, or invent facts. Short is natural and still polite for a shop, not slang; explain context. In a social setting it may be friendly. Do not require beginners to use the polite version.`;

export function optionalVariants(v){try{return getVariants(v)}catch{return []}}
export function publicError(e,fallback){const code=e?.message;return /^ai_(timeout|network|request_rejected|auth|model_unavailable|rate_limit|busy|upstream|empty_response|invalid_json|not_configured)$/.test(code||'')?code:fallback;}
