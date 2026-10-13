import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {questions as original} from '../questions.js';
import {practiceQuestions as practice,lectureSources} from '../practice-questions.js';
import {bankOf,makeAttempt,grade,isCorrect,makeRetake,fullQuizConfig} from '../engine.js';

const all=[...original,...practice],weeks=Array.from({length:12},(_,i)=>i+1);

test('new bank has 120 unique source-backed questions, 10 per week, across all 27 lectures',()=>{
  assert.equal(practice.length,120);
  assert.equal(new Set(all.map(q=>q.id)).size,240);
  const sourceWeeks={1:[1],2:[2],3:[3,4,5],4:[6,7,8],5:[9,10,11],6:[12,13],7:[14,15],8:[16,17,18],9:[19,20,21],10:[22,23,24,25],11:[26],12:[27]};
  for(const week of weeks){
    const bank=practice.filter(q=>q.week===week);
    assert.deepEqual(bank.map(q=>q.number),[1,2,3,4,5,6,7,8,9,10]);
    assert.ok(bank.every(q=>sourceWeeks[week].includes(q.source.lecture)));
  }
  assert.deepEqual([...new Set(practice.map(q=>q.source.lecture))].sort((a,b)=>a-b),Array.from({length:27},(_,i)=>i+1));
  for(const q of practice){
    assert.equal(q.bank,'additional');assert.equal(q.options.length,4);
    assert.equal(new Set(q.options).size,4);assert.ok(q.options.every(s=>s.trim().length>0));
    assert.ok(q.correct.length>0&&q.correct.length<4);
    assert.equal(new Set(q.correct).size,q.correct.length);
    assert.ok(q.correct.every(i=>Number.isInteger(i)&&i>=0&&i<4));
    assert.ok(q.explanation.length>40);assert.ok(q.source.section);assert.deepEqual([q.source.title,q.source.file],lectureSources[q.source.lecture]);
    assert.ok(!original.some(o=>o.text.toLowerCase()===q.text.toLowerCase()));
  }
  assert.equal(new Set(practice.map(q=>q.text.toLowerCase())).size,120);
  assert.equal(practice.filter(q=>q.correct.length>1).length,6);
});

test('assignment source remains byte-for-byte unchanged',()=>{
  const content=readFileSync(new URL('../questions.js',import.meta.url));
  assert.equal(createHash('sha256').update(content).digest('hex'),'6541dc1b472abfd2ab1c0d8414469bd95a90471b3117e548a8bf1dd2a3494151');
});

test('bank selection prevents accidental inclusion of the other question bank',()=>{
  for(const bank of ['assignments','additional']){
    const a=makeAttempt(all,weeks,'original',false,null,bank);
    assert.equal(a.items.length,120);assert.equal(a.bank,bank);
    assert.ok(a.items.every(i=>i.id.startsWith(bank==='additional'?'p':'w')));
    for(const i of a.items)a.answers[i.id]=all.find(q=>q.id===i.id).correct.slice();
    assert.equal(grade(a,all).percent,100);
  }
  assert.equal(makeAttempt(all,[1],'original',false).items.length,10);
  assert.equal(makeAttempt(practice,[1],'original',false).bank,'additional');
});

test('all shuffled additional questions retain answer identity and exact-set grading',()=>{
  const a=makeAttempt(all,weeks,'random',true,null,'additional');
  assert.equal(new Set(a.items.map(i=>i.id)).size,120);
  for(const item of a.items){
    assert.deepEqual([...item.optionOrder].sort(),[0,1,2,3]);
    const q=practice.find(q=>q.id===item.id);a.answers[q.id]=item.optionOrder.filter(i=>q.correct.includes(i));
    assert.equal(isCorrect(q,q.correct),true);
    assert.equal(isCorrect(q,[...q.correct,q.options.findIndex((_,i)=>!q.correct.includes(i))]),false);
    if(q.correct.length>1)assert.equal(isCorrect(q,q.correct.slice(1)),false);
  }
  assert.equal(grade(a,all).correct,120);
});

test('additional full retake survives nested focus retakes and JSON reload',()=>{
  const initial=makeAttempt(all,[3,8,12],'original',false,null,'additional');
  initial.fullQuiz=fullQuizConfig(initial,all);
  for(const item of initial.items)initial.answers[item.id]=all.find(q=>q.id===item.id).correct.slice();
  delete initial.answers.p8q4;
  const focus=makeRetake(initial,all,'missed');assert.deepEqual(focus.items.map(i=>i.id),['p8q4']);
  focus.answers.p8q4=practice.find(q=>q.id==='p8q4').correct.slice();
  assert.equal(grade(focus,all).percent,100);
  const repeated=makeRetake(focus,all,'focus');
  const full=makeRetake(JSON.parse(JSON.stringify(repeated)),all,'full');
  assert.equal(full.bank,'additional');assert.equal(full.items.length,30);
  assert.ok(full.items.every(i=>i.id.startsWith('p')));
  assert.equal(full.order,'original');assert.equal(full.shuffleOptions,false);assert.equal(full.reviewOnly,false);
  assert.deepEqual(full.weeks,[3,8,12]);assert.deepEqual(full.answers,{});
});

test('legacy original focus attempts reconstruct only original assignments',()=>{
  const a={weeks:[1,3],items:[{id:'w3q1',optionOrder:[0,1,2,3]}],answers:{w3q1:[3]},order:'original',shuffleOptions:false};
  assert.equal(bankOf(a,all),'assignments');
  const next=makeRetake(a,all,'full');assert.equal(next.items.length,20);assert.ok(next.items.every(i=>i.id.startsWith('w')));
  const p={...a,items:[{id:'p3q1',optionOrder:[0,1,2,3]}]};
  assert.equal(bankOf(p,all),'additional');assert.equal(makeRetake(p,all,'full').items.length,20);
});

test('cross-bank IDs in a saved full-quiz snapshot do not contaminate a retake',()=>{
  const a=makeAttempt(all,[1],'original',false,null,'additional');
  a.fullQuiz={...fullQuizConfig(a,all),questionIds:['p1q1','w1q1','p2q1']};
  assert.deepEqual(makeRetake(a,all,'full').items.map(i=>i.id),['p1q1']);
});

let bootNumber=0;
async function boot(storage){
  const handlers={},elements=new Map();
  const element=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){},showModal(){this.open=true;},close(){this.open=false;}});
  for(const id of ['#app','#confirm-dialog','#dialog-content','#dialog-cancel','#dialog-confirm','#toast','#question-title'])elements.set(id,element());
  globalThis.document={querySelector(s){return elements.get(s)||null;},addEventListener(type,fn){handlers[type]=fn;}};
  globalThis.window={scrollX:0,scrollY:0,scrollTo(p){this.scrollX=p.left||0;this.scrollY=p.top||0;}};
  globalThis.localStorage={getItem(k){return storage.get(k)||null;},setItem(k,v){storage.set(k,v);}};
  const old=globalThis.setInterval;globalThis.setInterval=()=>0;
  try{await import(`../app.js?boot=${++bootNumber}`);}finally{globalThis.setInterval=old;}
  return {
    html:()=>elements.get('#app').innerHTML,
    state:()=>JSON.parse(storage.get('weekwise-nptel-v1')),
    click:(action,extra={})=>handlers.click({target:{closest(){return {dataset:{action,...extra},disabled:false};}},preventDefault(){}}),
    change:(value,checked=true)=>handlers.change({target:{name:'answer',value:String(value),checked}}),
    confirm:()=>elements.get('#dialog-confirm').onclick(),
    cancel:()=>elements.get('#dialog-cancel').onclick(),
    dialog:()=>elements.get('#dialog-content').innerHTML
  };
}

test('UI: bank tabs, legacy resume, source reveal, bank-specific settings and full retakes',async()=>{
  const storage=new Map();
  const legacy=makeAttempt(original,[1],'original',false);delete legacy.bank;
  legacy.answers.w1q1=[1];legacy.index=1;
  storage.set('weekwise-nptel-v1',JSON.stringify({attempt:legacy,history:[],selection:{weeks:[1],order:'original',shuffleOptions:false}}));
  let ui=await boot(storage);
  assert.match(ui.html(),/Original quizzes/);assert.match(ui.html(),/Additional practice/);
  ui.click('bank',{bank:'additional'});assert.match(ui.html(),/Go beyond the assignments/);
  assert.match(ui.html(),/120 <small>across 12 weeks/);
  assert.equal(ui.state().attempt.answers.w1q1[0],1);
  ui.click('resume');assert.equal(ui.state().activeBank,'assignments');assert.equal(ui.state().attempt.index,1);
  ui.click('bank',{bank:'additional'});ui.click('week',{week:'2'});ui.click('order',{order:'original'});ui.click('start');
  assert.match(ui.dialog(),/unfinished attempt/);ui.cancel();assert.equal(ui.state().attempt.items[0].id,'w1q1');
  ui.click('start');ui.confirm();
  assert.equal(ui.state().attempt.bank,'additional');assert.equal(ui.state().attempt.items.length,20);
  assert.doesNotMatch(ui.html(),/Why this answer\?|Source: Lecture|Multiple answers|Single answer|type="radio"/);
  window.scrollY=300;ui.change(0);ui.change(1);assert.equal(window.scrollY,300);
  assert.deepEqual(ui.state().attempt.answers.p1q1,[0,1]);ui.click('clear-answer');
  for(let index=0;index<20;index++){
    const q=practice.find(q=>q.id===ui.state().attempt.items[index].id);
    if(index!==1){const answer=index===0?[q.options.findIndex((_,i)=>!q.correct.includes(i))]:q.correct;for(const i of answer)ui.change(i);}
    if(index<19)ui.click('next');
  }
  assert.equal(window.scrollY,300);ui.click('submit');ui.confirm();
  assert.equal(window.scrollY,300);assert.match(ui.html(),/90% score/);
  assert.match(ui.html(),/Why this answer\?/);assert.match(ui.html(),/Source: Lecture/);assert.match(ui.html(),/practice Q/);
  ui.click('retake-missed');assert.equal(ui.state().attempt.items.length,2);
  for(let index=0;index<2;index++){for(const i of practice.find(q=>q.id===ui.state().attempt.items[index].id).correct)ui.change(i);if(index===0)ui.click('next');}
  ui.click('submit');ui.confirm();assert.match(ui.html(),/100% score/);assert.match(ui.html(),/Retake full quiz · 20 questions/);
  ui.click('retake-full');assert.equal(ui.state().attempt.items.length,20);assert.equal(ui.state().attempt.bank,'additional');assert.deepEqual(ui.state().attempt.answers,{});
  ui.change(1);ui.click('home');const pending=JSON.stringify(ui.state().attempt);
  ui=await boot(storage);assert.equal(ui.state().activeBank,'additional');assert.equal(JSON.stringify(ui.state().attempt),pending);
  ui.click('bank',{bank:'assignments'});assert.deepEqual(ui.state().selection.weeks,[1]);assert.equal(ui.state().selection.order,'original');
  ui.click('bank',{bank:'additional'});assert.deepEqual(ui.state().selection.weeks,[1,2]);assert.equal(ui.state().selection.shuffleOptions,false);
  ui.click('history');assert.match(ui.html(),/history-bank">Additional practice/);
  ui.click('view-history',{id:String(ui.state().history[0].submittedAt)});assert.match(ui.html(),/90% score/);assert.match(ui.html(),/Source: Lecture/);
  ui.click('bank',{bank:'assignments'});ui.click('start');ui.cancel();assert.equal(JSON.stringify(ui.state().attempt),pending);
  ui.click('resume');assert.equal(ui.state().activeBank,'additional');assert.equal(ui.state().attempt.items.length,20);
});
