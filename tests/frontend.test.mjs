import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import * as Core from '../assets/practice-core.mjs';import {BASIC_TOPICS} from '../assets/basic-topics.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),base=html.match(/<script>([\s\S]*?)<\/script>/)[1],extension=fs.readFileSync(new URL('../assets/practice.js',import.meta.url),'utf8').replace(/^import .*?;\n/,'const {localCheck,updateAdaptive,newShop,shopTurn,parseOrder,PRODUCTS}=Core;\n');
const extensionCode=extension.replace("import {BASIC_TOPICS} from './basic-topics.mjs';\n",'');
const els={};let stored=null;const elem=()=>({innerHTML:'',textContent:'',style:{},querySelectorAll:()=>[],focus(){}}),document={hidden:false,activeElement:null,documentElement:{},body:{addEventListener(){}},addEventListener(){},querySelector:s=>els[s]||(els[s]=elem()),querySelectorAll:()=>[],createTreeWalker:()=>({nextNode:()=>null})};
const ctx={Core,BASIC_TOPICS,console,document,window:{addEventListener(){}},navigator:{},localStorage:{getItem:()=>JSON.stringify({coins:99,custom:[],pet:'Jennie',ann:{},subs:[]}),setItem:(k,v)=>stored=v,removeItem(){}},fetch:async()=>({json:async()=>({ai:false})}),NodeFilter:{SHOW_TEXT:4},setInterval:()=>1,setTimeout:()=>1,clearTimeout(){},scrollTo(){},URL,Blob,AbortController,AbortSignal,structuredClone,Date};vm.createContext(ctx);vm.runInContext(base,ctx);vm.runInContext(extensionCode,ctx);const run=s=>vm.runInContext(s,ctx);
run('A.meow()');assert.equal(run('catTip.word.en'),run('KW[0][0]'));assert.ok(run('catBubble().includes(catTip.word.ipa)'));run('A.meow()');assert.equal(run('catTip.word.en'),run('KW[1][0]'));run('A.catClose()');assert.equal(run('catTip'),null);
assert.equal(run('S.pet'),'Jennie');assert.equal(run('S.coins'),99);
for(const lang of ['vi','en','zh-TW'])run(`S.lang='${lang}';for(const v of ['home','lesson','review','progress','pet','theory']){view=v;render()};A.conversationOpen();render();A.fluencyOpen();render()`);
assert.ok(run('SAMPLE.T.every(t=>t[3])&&SAMPLE.KW.every(t=>t[2])&&SAMPLE.PH.every(t=>t[3])'));
run("S.lang='vi';AI=false;TX.e1='Two apples please';");await run("A.chk({k:'e1'})");assert.equal(run('fb.e1.status'),'done');const food=run('S.food');await run("A.chk({k:'e1'})");assert.equal(run('S.food'),food);assert.equal(run('adaptive().streak'),1);
run("A.newTry({k:'e1'});TX.e1='Can I have two apples please'");await run("A.chk({k:'e1'})");assert.equal(run('adaptive().offer'),true);assert.equal(run('S.food'),food);
run("A.support({n:1})");assert.equal(run('adaptive().level'),1);assert.equal(run('adaptive().streak'),0);assert.equal(run('TX.e1'),'');
run("A.newTry({k:'e1'});A.practiceHint({k:'e1'});TX.e1='Two apples please'");await run("A.chk({k:'e1'})");assert.equal(run('adaptive().streak'),0);
run("A.newTry({k:'e1'});TX.e1=\"I don't want two apples\"");await run("A.chk({k:'e1'})");assert.equal(run('fb.e1.status'),'clarify');assert.equal(run('fb.e1.verified'),false);
run("A.conversationOpen();TX.conv='Three bananas please'");await run('A.conversationSend()');run("TX.conv='No thanks'");await run('A.conversationSend()');assert.equal(run('conv.shop.total'),3);assert.equal(run('conv.last.variants.length'),3);run("TX.conv='By card please'");await run('A.conversationSend()');assert.equal(run('conv.shop.complete'),true);
run('A.fluencyOpen();A.fluencyStart()');assert.equal(run('fluency.running'),false);run('fluency.known=true;A.fluencyStart();A.fluencyStop()');assert.equal(run('fluency.rounds.length'),1);assert.ok(!run('fluency.rounds[0]').score);
// AI timeout does not masquerade as a semantic success for custom tasks.
run("AI=true;R.e1={q:'Hello?',goal:'Say a greeting',tk:{sample:'Hello',req:[{any:['hello'],vi:'greet'}]}};A.newTry({k:'e1'});TX.e1='Hello'");ctx.fetch=async()=>{throw new Error('timeout')};await run("A.chk({k:'e1'})");assert.equal(run('fb.e1.status'),'unverified');assert.equal(run('fb.e1.verified'),false);
// A response arriving after a lesson/input change must not overwrite current feedback.
let resolve;ctx.fetch=()=>new Promise(r=>resolve=r);run("A.newTry({k:'e1'});TX.e1='Hello'");const delayed=run("A.chk({k:'e1'})");run("TX.e1='Changed answer'");resolve({ok:true,json:async()=>({label:'done',criteria:[],variants:[]})});await delayed;assert.notEqual(run('fb.e1?.text'),'Hello');assert.equal(run('pending.e1'),undefined);
assert.ok(stored);console.log('PASS frontend: old storage preserved, 3 languages x 8 views, sample IPA, independent attempts, no duplicate rewards, adaptive suggestion, hints, offline conversation variants, fluency gate, API failure and stale response protection.');

for(const lang of ['vi','en','zh-TW']){run(`S.lang='${lang}'`);for(const section of ['current','create','saved','goals','plan','device']){run(`homeSection='${section}';view='home';render()`);assert.ok(run('vHome().length')>50);if(section==='current')assert.ok(!run('vHome().includes("id=topic")'));}}
run('A.menuToggle()');assert.equal(run('menuOpen'),true);run("A.menuSection({section:'create'})");assert.equal(run('homeSection'),'create');assert.equal(run('menuOpen'),false);

run("homeSection='current'");assert.ok(run('vHome().includes("Học tiếp")')||run('vHome().includes("繼續學習")'));for(const i of [0,4,5]){run(`step=${i}`);assert.ok(!run('vLesson().includes("class=steps")'));assert.ok(run('task("a").indexOf("c.q")')===-1);}

run("S.lang='vi';homeSection='basics';view='home';render()");assert.ok(run('vHome().includes("basic-pharmacy")'));
for(const id of BASIC_TOPICS.map(x=>x.id)){run(`A.basicPreview({id:'${id}'})`);assert.ok(run('draftLesson.T.length')>=6);assert.ok(run('draftLesson.T.every(t=>t[3])'));assert.equal(run('homeSection'),'draft');assert.ok(run('draftView().includes("Bắt đầu luyện")'));}
run("A.draftEdit();draftScript='changed'");const count=run('S.custom.length');run('A.draftAccept()');assert.equal(run('S.custom.length'),count);run('draftScript=draftOriginal;A.draftAccept()');assert.equal(run('step'),1);assert.ok(run('LID.startsWith("basic-")'));
run("menuOpen=true");assert.ok(run('menuHTML().indexOf("Đóng menu")>menuHTML().indexOf("Tiến trình")'));assert.ok(!run('homeItems().some(x=>x[0]==="device")'));assert.ok(run('homeItems().some(x=>x[0]==="about")'));
assert.ok(run('pronunciationUI("c0","Hello").includes("disabled")'));

run('A.roleplayOpen()');assert.equal(run('view'),'roleplay');assert.equal(run('roleplay.state'),'ready');assert.ok(run('roleplayView().includes("Giọng AI")'));assert.ok(run('roleplayView().includes("script")'));assert.ok(!run('roleplayView().includes("data-a=roleplayReplay")'));run('A.roleplayReset()');assert.equal(run('roleplay.index'),0);run("A.go({v:'home'})");assert.equal(run('roleplay.state'),'paused');

const beforeDraft=run('S.custom.length');ctx.fetch=async()=>({ok:true,json:async()=>({lesson:BASIC_TOPICS[0].lesson})});run("TOP='Mua tra sua theo yeu cau';homeSection='create'");await run('genLesson()');assert.equal(run('homeSection'),'draft');assert.equal(run('S.custom.length'),beforeDraft);assert.equal(run('BUSY'),false);run('A.draftEdit();draftScript+=" changed"');run('A.draftAccept()');assert.equal(run('S.custom.length'),beforeDraft);
for(const n of [0,1,2]){run(`A.practiceLevel({n:${n}});clearRoleplay();roleplay=newRoleplay();view='roleplay';render()`);assert.equal(run('roleplay.level'),n);assert.ok(run('roleplayView().length')>100);}
