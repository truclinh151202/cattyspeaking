import assert from 'node:assert/strict';import feedback from '../netlify/functions/feedback.mjs';import conversation from '../netlify/functions/conversation.mjs';
import expressions from '../netlify/functions/expressions.mjs';
let input,mode='good',calls=0;
process.env.GEMINI_API_KEY='test-only-placeholder';
const variants=['standard','short','polite'].map(kind=>({kind,en:'Two apples, please.',ipa:'/tu ˈæpəlz pliz/',meaning:'Hai táo',context:'At a shop'}));
globalThis.fetch=async(url,opts)=>{calls++;input=JSON.parse(opts.body);if(mode==='network')throw new Error('timeout');if(mode==='quota')return {ok:false,status:429};const o={label:'done',good:'Meaning is clear',improve:'',suggestion:'Two apples please',retry:'Try again',grammar:'',register:'',criteria:[{meaning:'two apples',met:true}],variants,reply:'Anything else?',ipa:'/ˈɛniθɪŋ ɛls/',translation:'Còn gì nữa không?',complete:false};if(mode==='contradiction'){o.criteria[0].met=false;o.complete=true;}if(mode==='badipa')o.variants=variants.map(x=>({...x,ipa:'not IPA notation'}));return {ok:true,json:async()=>({candidates:[{content:{parts:[{thought:true,text:'private reasoning must be ignored'},{text:JSON.stringify(o)}]}}]})}};
const request=(path,body,method='POST')=>new Request('http://test/api/'+path,{method,...(method!=='GET'?{headers:{'content-type':'application/json'},body:JSON.stringify(body)}:{})});
for(const language of ['vi','en','zh-TW']){
 const r=await feedback(request('feedback',{text:'Could I have two apples?',question:'What would you like?',goal:'Buy two apples',requirements:['two apples'],language}));assert.equal(r.status,200);assert.equal((await r.json()).variants.length,0);const data=JSON.parse(input.contents[0].parts[0].text);assert.equal(data.learnerLanguage,language);assert.deepEqual(data.requirements,['two apples']);
}
{const r=await expressions(request('expressions',{text:'No, I do not have a fever.',question:'Do you have a fever?',language:'vi'}));assert.equal(r.status,200);assert.equal((await r.json()).variants.length,3);}
mode='contradiction';assert.equal((await feedback(request('feedback',{text:'hello'}))).status,502);
mode='badipa';{const r=await feedback(request('feedback',{text:'hello'}));assert.equal(r.status,200);assert.deepEqual((await r.json()).variants,[]);}
mode='quota';assert.equal((await (await feedback(request('feedback',{text:'hello'}))).json()).error,'ai_rate_limit');
mode='network';assert.equal((await feedback(request('feedback',{text:'hello'}))).status,502);
mode='good';assert.equal((await feedback(request('feedback',{}))).status,400);
const hist=[{role:'partner',text:'What would you like?'},{role:'learner',text:'Three bananas'}];let r=await conversation(request('conversation',{scenario:'Fruit shop',history:hist,language:'en',facts:['bananas cost one dollar'],goals:['buy fruit']}));assert.equal(r.status,200);assert.deepEqual(JSON.parse(input.contents[0].parts[0].text).history,hist);
mode='contradiction';assert.equal((await conversation(request('conversation',{history:hist}))).status,502);mode='good';
assert.equal((await conversation(request('conversation',{history:[]}))).status,400);assert.equal((await conversation(request('conversation',{history:Array.from({length:6},()=>({role:'learner',text:'Hello'}))}))).status,400);
assert.equal((await conversation(request('conversation',null,'GET'))).status,405);
delete process.env.GEMINI_API_KEY;assert.equal((await feedback(request('feedback',null,'GET')).then(r=>r.json())).ai,false);assert.equal((await feedback(request('feedback',{text:'hello'}))).status,503);
console.log('PASS API contracts: 3 languages, explicit criteria, validated IPA variants, contradictions rejected, provider failure, preserved conversation context, limits, methods and no-key behavior. Gemini mocked, not a real service test.');
