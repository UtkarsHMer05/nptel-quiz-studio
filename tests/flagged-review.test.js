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
  try{await import(`../app.js?flagged-review=${++bootNumber}`);}finally{globalThis.setInterval=old;}
  return {
    html:()=>elements.get('#app').innerHTML,
    state:()=>JSON.parse(storage.get(key)),
    click:(action,extra={})=>handlers.click({target:{closest:()=>({dataset:{action,...extra},disabled:false})},preventDefault(){}}),
    answer:value=>handlers.change({target:{name:'answer',value:String(value),checked:true}}),
    confirm:()=>elements.get('#dialog-confirm').onclick()
  };
}
const cards=ui=>ui.html().match(/<article class="review-card\b[^]*?<\/article>/g)||[];
const flagCount=ui=>cards(ui).filter(card=>card.includes('class="badge review-flag"')).length;

test('submitted flags remain visible with each outcome and the flagged filter works in both shuffled combined banks',async()=>{
  for(const bank of ['assignments','additional']){
    const attempt=makeAttempt(questions,[1,2],'random',true,null,bank);
    const storage=new Map([[key,JSON.stringify({attempt,activeBank:bank})]]),ui=await boot(storage);
    ui.click('resume');
    for(let index=0;index<4;index++){
      const q=questions.find(q=>q.id===attempt.items[index].id);
      ui.click('flag');
      if(index===3)ui.click('flag');
      if(index===0||index===3)for(const answer of q.correct)ui.answer(answer);
      if(index===1)ui.answer(q.options.findIndex((_,i)=>!q.correct.includes(i)));
      if(index<3)ui.click('next');
    }
    ui.click('submit');ui.confirm();
    assert.match(ui.html(),/Flagged \(3\)/);assert.equal(cards(ui).length,20);assert.equal(flagCount(ui),3);
    for(const [index,status] of ['correct','incorrect','unanswered','correct'].entries()){
      assert.match(cards(ui)[index],new RegExp(`badge status-${status}`));
      assert.equal(cards(ui)[index].includes('class="badge review-flag"'),index<3);
    }
    const saved=JSON.stringify(ui.state().history);
    ui.click('filter',{filter:'flagged'});
    assert.equal(cards(ui).length,3);assert.equal(flagCount(ui),3);
    for(const status of ['correct','incorrect','unanswered'])assert.ok(cards(ui).some(card=>card.includes(`badge status-${status}`)));
    assert.match(ui.html(),/data-filter="flagged" class="active" aria-pressed="true"/);
    ui.click('filter',{filter:'correct'});assert.equal(cards(ui).length,2);assert.equal(flagCount(ui),1);
    ui.click('filter',{filter:'unanswered'});assert.equal(flagCount(ui),1);
    ui.click('filter',{filter:'all'});assert.equal(cards(ui).length,20);assert.equal(flagCount(ui),3);
    assert.equal(JSON.stringify(ui.state().history),saved);
  }
});

test('existing saved flags survive history review and reload while retakes start with independent flags',async()=>{
  const attempt=makeAttempt(questions,[1],'original',false);
  attempt.answers.w1q1=[...original[0].correct];attempt.flagged=['w1q1','w1q2'];attempt.submittedAt=1234;
  const storage=new Map([[key,JSON.stringify({history:[attempt]})]]);
  let ui=await boot(storage);
  ui.click('history');ui.click('view-history',{id:'1234'});
  assert.equal(flagCount(ui),2);assert.match(cards(ui)[0],/badge status-correct/);assert.match(cards(ui)[1],/badge status-unanswered/);
  ui.click('retake-full');assert.deepEqual(ui.state().attempt.flagged,[]);
  ui.click('flag');ui.click('submit');ui.confirm();assert.equal(flagCount(ui),1);
  assert.deepEqual(ui.state().history[0].flagged,['w1q1','w1q2']);
  ui=await boot(storage);ui.click('history');ui.click('view-history',{id:'1234'});
  ui.click('filter',{filter:'flagged'});assert.equal(cards(ui).length,2);assert.equal(flagCount(ui),2);
  ui.click('retake-missed');assert.deepEqual(ui.state().attempt.flagged,[]);
  assert.deepEqual(ui.state().history[0].flagged,['w1q1','w1q2']);
});

test('attempts with no flags or a legacy missing flag field show no badges and an empty flagged view',async()=>{
  for(const legacy of [false,true]){
    const attempt=makeAttempt(questions,[1],'original',false);attempt.submittedAt=1234;
    if(legacy)delete attempt.flagged;
    const ui=await boot(new Map([[key,JSON.stringify({history:[attempt]})]]));
    ui.click('view-history',{id:'1234'});assert.equal(cards(ui).length,10);assert.equal(flagCount(ui),0);
    assert.match(ui.html(),/Flagged \(0\)/);
    ui.click('filter',{filter:'flagged'});assert.equal(cards(ui).length,0);
    assert.match(ui.html(),/No questions in this view/);
    ui.click('filter',{filter:'all'});assert.equal(cards(ui).length,10);
  }
});
