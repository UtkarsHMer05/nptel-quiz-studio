import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weekZeroQuestions as zero} from '../week-zero-questions.js';
import {questions as original} from '../questions.js';
import {practiceQuestions as practice} from '../practice-questions.js';
import {makeAttempt,makeRetake,grade,fullQuizConfig} from '../engine.js';

const all=[...zero,...original,...practice];

test('Week 0 includes all ten supplied questions with researched answer keys and references',()=>{
  assert.deepEqual(zero.map(q=>q.id),['w0q1','w0q2','w0q3','w0q4','w0q5','w0q6','w0q7','w0q8','w0q9','w0q10']);
  assert.deepEqual(zero.map(q=>q.correct),[[0],[1],[1],[1],[3],[1],[3],[1],[2],[1]]);
  assert.equal(zero[0].options[3],'Investment Potfolio Overview');
  assert.equal(zero[8].keyStatus,'inferred');assert.match(zero[8].explanation,/ambiguous/);
  assert.match(zero[8].explanation,/official assignment answer key has not been provided/);
  assert.equal(new Set(all.map(q=>q.id)).size,250);
  for(const q of zero){
    assert.equal(q.week,0);assert.equal(q.bank,'assignments');assert.equal(q.options.length,4);
    assert.equal(new Set(q.options).size,4);assert.ok(q.explanation.length>40);
    assert.match(q.source.url,/^https:\/\//);assert.ok(q.source.title);
  }
});

test('Week 0 combines with original weeks, remains separate from practice, and survives focus/full retakes',()=>{
  const a=makeAttempt(all,[0,1,12],'original',false,null,'assignments');
  assert.equal(a.items.length,30);assert.equal(a.items[0].id,'w0q1');assert.equal(a.items[10].id,'w1q1');
  a.fullQuiz=fullQuizConfig(a,all);
  for(const item of a.items)a.answers[item.id]=all.find(q=>q.id===item.id).correct.slice();
  assert.equal(grade(a,all).percent,100);a.answers.w0q6=[0];
  const focus=makeRetake(a,all,'missed');assert.deepEqual(focus.items.map(i=>i.id),['w0q6']);
  const full=makeRetake(JSON.parse(JSON.stringify(focus)),all,'full');
  assert.deepEqual(full.weeks,[0,1,12]);assert.equal(full.items.length,30);assert.equal(full.elapsedMs,0);
  assert.deepEqual(full.items.map(i=>i.id),a.items.map(i=>i.id));
  const additional=makeAttempt(all,[0,1,12],'original',false,null,'additional');
  assert.equal(additional.items.length,20);assert.ok(additional.items.every(i=>i.id.startsWith('p')));
});

test('previously saved six-question Week 0 quizzes retain their original answers, scores, and retake size',()=>{
  const a=makeAttempt(zero.slice(0,6),[0],'original',false,null,'assignments');
  a.fullQuiz=fullQuizConfig(a,zero.slice(0,6));
  for(const item of a.items)a.answers[item.id]=zero.find(q=>q.id===item.id).correct.slice();
  a.elapsedMs=15_000;a.submittedAt=Date.now();
  const restored=JSON.parse(JSON.stringify(a));assert.equal(grade(restored,all).total,6);
  assert.equal(grade(restored,all).percent,100);
  const retake=makeRetake(restored,all,'full');assert.equal(retake.items.length,6);
  assert.deepEqual(retake.items.map(i=>i.id),a.items.map(i=>i.id));assert.equal(retake.elapsedMs,0);
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
  try{await import(`../app.js?week-zero-test=${++bootNumber}`);}finally{globalThis.setInterval=old;}
  return {html:()=>elements.get('#app').innerHTML,state:()=>JSON.parse(storage.get('weekwise-nptel-v1')),
    click:(action,extra={})=>handlers.click({target:{closest(){return {dataset:{action,...extra},disabled:false};}},preventDefault(){}}),
    answer:value=>handlers.change({target:{name:'answer',value:String(value),checked:true}}),
    confirm:()=>elements.get('#dialog-confirm').onclick()};
}

test('UI offers Week 0 only in Original quizzes with bank-specific counts, saved selections, and source review',async()=>{
  const storage=new Map();let ui=await boot(storage);
  assert.match(ui.html(),/130 <small>across 13 weeks/);assert.match(ui.html(),/Week 0 \+ Weeks 1–12 ready/);
  assert.match(ui.html(),/data-week="0"/);assert.ok(ui.html().indexOf('data-week="0"')<ui.html().indexOf('data-week="1"'));
  ui.click('all-weeks');assert.deepEqual(ui.state().selection.weeks,[0,1,2,3,4,5,6,7,8,9,10,11,12]);
  ui.click('bank',{bank:'additional'});assert.match(ui.html(),/120 <small>across 12 weeks/);assert.doesNotMatch(ui.html(),/data-week="0"/);
  ui.click('all-weeks');assert.deepEqual(ui.state().selection.weeks,[1,2,3,4,5,6,7,8,9,10,11,12]);
  ui.click('bank',{bank:'assignments'});ui.click('all-weeks');ui.click('week',{week:'0'});ui.click('order',{order:'original'});ui.click('start');
  assert.equal(ui.state().attempt.items.length,10);assert.match(ui.html(),/<h1>Week 0<\/h1>/);
  assert.doesNotMatch(ui.html(),/Why this answer\?|Source:|investor\.gov|Answer key note|Inferred practice key/);
  ui.answer(0);ui.click('next');ui.click('home');
  ui=await boot(storage);ui.click('resume');assert.equal(ui.state().attempt.index,1);
  assert.deepEqual(ui.state().attempt.answers.w0q1,[0]);
  for(let i=1;i<10;i++){
    if(i!==2)for(const answer of zero[i].correct)ui.answer(answer);
    if(i<9)ui.click('next');
  }
  ui.click('submit');ui.confirm();assert.match(ui.html(),/90% score/);
  assert.match(ui.html(),/Source: <a href="https:\/\/www\.investor\.gov/);
  assert.match(ui.html(),/target="_blank" rel="noopener noreferrer"/);
  assert.match(ui.html(),/Answer key note/);assert.match(ui.html(),/Inferred practice key/);
  assert.match(ui.html(),/official assignment answer key has not been provided/);
  assert.match(ui.html(),/Retake full quiz · 10 questions/);
  ui.click('retake-missed');assert.deepEqual(ui.state().attempt.items.map(i=>i.id),['w0q3']);
  ui.answer(1);ui.click('submit');ui.confirm();assert.match(ui.html(),/100% score/);
  ui.click('retake-full');assert.equal(ui.state().attempt.items.length,10);assert.deepEqual(ui.state().attempt.weeks,[0]);
  ui.click('home');ui.click('bank',{bank:'additional'});assert.doesNotMatch(ui.html(),/data-week="0"/);
  assert.equal(ui.state().attempt.items[0].id,'w0q1');
});
