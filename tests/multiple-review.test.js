import {test} from 'node:test';
import assert from 'node:assert/strict';
import {questions as original} from '../questions.js';
import {practiceQuestions} from '../practice-questions.js';
import {makeAttempt} from '../engine.js';

const questions=[...original,...practiceQuestions],key='weekwise-nptel-v1';
let bootNumber=0;
async function boot(storage){
  const handlers={},elements=new Map();
  const element=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){},showModal(){this.open=true;},close(){this.open=false;}});
  for(const id of ['#app','#confirm-dialog','#dialog-content','#dialog-cancel','#dialog-confirm','#toast','#question-title'])elements.set(id,element());
  globalThis.document={querySelector:s=>elements.get(s)||null,addEventListener(type,fn){handlers[type]=fn;}};
  globalThis.window={scrollX:0,scrollY:0,scrollTo(p){this.scrollX=p.left||0;this.scrollY=p.top||0;}};
  globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem(k,v){storage.set(k,v);}};
  const old=globalThis.setInterval;globalThis.setInterval=()=>0;
  try{await import(`../app.js?multiple-review=${++bootNumber}`);}finally{globalThis.setInterval=old;}
  return {
    html:()=>elements.get('#app').innerHTML,
    state:()=>JSON.parse(storage.get(key)),
    click:(action,extra={})=>handlers.click({target:{closest:()=>({dataset:{action,...extra},disabled:false})},preventDefault(){}}),
    answer:value=>handlers.change({target:{name:'answer',value:String(value),checked:true}}),
    confirm:()=>elements.get('#dialog-confirm').onclick()
  };
}
const cards=ui=>ui.html().match(/<article class="review-card\b[^]*?<\/article>/g)||[];
const idOf=card=>{const [,week,kind,num]=card.match(/Week (\d+), (original|practice) Q(\d+)/);return `${kind==='original'?'w':'p'}${week}q${num}`;};
const filter=(ui,value)=>ui.click('filter',{filter:value});

test('multiple-answer review uses the accepted key, preserves shuffled quiz outcomes and flags, and offers every original week',async()=>{
  const attempt=makeAttempt(questions,[1,2,4],'random',true,null,'assignments');
  for(const id of ['w1q9','w4q5'])attempt.answers[id]=questions.find(q=>q.id===id).correct.slice();
  attempt.answers.w1q10=[0];attempt.answers.w1q1=[0,1];attempt.flagged=['w1q10'];
  const storage=new Map([[key,JSON.stringify({attempt})]]),ui=await boot(storage);
  ui.click('resume');assert.doesNotMatch(ui.html(),/Multiple correct options|Multiple-answer scope/);
  ui.click('submit');ui.confirm();const saved=JSON.stringify(ui.state().history);
  assert.match(ui.html(),/Multiple correct options \(4\)/);
  filter(ui,'multiple');
  assert.deepEqual(cards(ui).map(idOf),attempt.items.filter(i=>questions.find(q=>q.id===i.id).correct.length>1).map(i=>i.id));
  const byId=Object.fromEntries(cards(ui).map(card=>[idOf(card),card]));
  for(const [id,status] of Object.entries({w1q9:'correct',w1q10:'incorrect',w2q9:'unanswered',w4q5:'correct'}))assert.match(byId[id],new RegExp(`badge status-${status}`));
  assert.match(byId.w1q10,/class="badge review-flag"/);
  assert.equal((byId.w1q9.match(/class="review-option correct-option"/g)||[]).length,4);
  filter(ui,'multiple-all');
  assert.deepEqual(cards(ui).map(idOf),['w1q9','w1q10','w2q9','w4q5','w9q3']);
  assert.match(cards(ui)[4],/badge status-not-in-quiz/);assert.doesNotMatch(cards(ui)[4],/QUESTION 0|Your selection/);
  assert.match(ui.html(),/data-filter="multiple" class="active" aria-pressed="true"/);
  filter(ui,'flagged');assert.deepEqual(cards(ui).map(idOf),['w1q10']);
  filter(ui,'all');assert.equal(cards(ui).length,30);assert.equal(JSON.stringify(ui.state().history),saved);
  filter(ui,'multiple-all');ui.click('retake-full');assert.equal(ui.state().attempt.items.length,30);
});

test('all-weeks study stays in the result bank and history review survives reload without changing answers or scores',async()=>{
  const assignment=makeAttempt(questions,[1],'original',false);assignment.submittedAt=1234;
  const additional=makeAttempt(questions,[3],'original',false,null,'additional');additional.submittedAt=5678;
  additional.answers.p3q4=[0,1,3];
  const storage=new Map([[key,JSON.stringify({history:[assignment,additional]})]]);
  let ui=await boot(storage);ui.click('view-history',{id:'5678'});
  const saved=JSON.stringify(ui.state().history);
  assert.match(ui.html(),/Multiple correct options \(1\)/);filter(ui,'multiple');
  assert.deepEqual(cards(ui).map(idOf),['p3q4']);assert.match(cards(ui)[0],/badge status-correct/);
  filter(ui,'multiple-all');assert.equal(cards(ui).length,6);
  for(const card of cards(ui)){
    const q=practiceQuestions.find(q=>q.id===idOf(card));assert.ok(q);
    assert.equal((card.match(/class="review-option correct-option"/g)||[]).length,q.correct.length);
  }
  assert.equal(cards(ui).filter(card=>card.includes('badge status-not-in-quiz')).length,5);
  ui.click('view-history',{id:'1234'});filter(ui,'multiple-all');
  assert.equal(cards(ui).length,5);assert.ok(cards(ui).every(card=>idOf(card).startsWith('w')));
  ui=await boot(storage);ui.click('view-history',{id:'5678'});filter(ui,'multiple-all');
  assert.equal(cards(ui).length,6);assert.equal(JSON.stringify(ui.state().history),saved);assert.match(ui.html(),/10% score/);
});

test('empty quizzes can open the all-weeks reference and focus retakes retain their original full quiz after study',async()=>{
  const noMultiple=makeAttempt(questions,[12],'original',false);noMultiple.submittedAt=1234;
  let ui=await boot(new Map([[key,JSON.stringify({history:[noMultiple]})]]));
  ui.click('view-history',{id:'1234'});filter(ui,'multiple');
  assert.equal(cards(ui).length,0);assert.match(ui.html(),/No questions with multiple correct options in this quiz/);
  filter(ui,'multiple-all');assert.equal(cards(ui).length,5);
  assert.ok(cards(ui).every(card=>card.includes('badge status-not-in-quiz')));assert.match(ui.html(),/0% score/);

  const attempt=makeAttempt(questions,[1],'original',false);attempt.submittedAt=4321;
  for(const item of attempt.items)attempt.answers[item.id]=questions.find(q=>q.id===item.id).correct.slice();
  attempt.answers.w1q10=[0];
  ui=await boot(new Map([[key,JSON.stringify({history:[attempt]})]]));
  ui.click('view-history',{id:'4321'});ui.click('retake-missed');assert.equal(ui.state().attempt.items.length,1);
  ui.answer(1);ui.answer(2);ui.click('submit');ui.confirm();filter(ui,'multiple');
  assert.deepEqual(cards(ui).map(idOf),['w1q10']);filter(ui,'multiple-all');assert.equal(cards(ui).length,5);
  assert.match(ui.html(),/100% score/);ui.click('retake-full');
  assert.equal(ui.state().attempt.items.length,10);assert.deepEqual(ui.state().attempt.weeks,[1]);
});
