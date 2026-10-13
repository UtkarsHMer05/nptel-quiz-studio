import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createQuizTimer,attemptDuration} from '../timer.js';
import {makeAttempt,makeRetake} from '../engine.js';
import {questions} from '../questions.js';

test('active time accumulates once across checkpoints, pause, and repeated resume',()=>{
  let now=0;
  const timer=createQuizTimer(()=>now),a=makeAttempt(questions,[1],'original',false);
  assert.equal(a.elapsedMs,0);timer.resume(a);now=1250;
  assert.equal(timer.elapsed(a),1250);timer.checkpoint();timer.checkpoint();
  assert.equal(a.elapsedMs,1250);
  now=2000;timer.resume(a);timer.pause();timer.pause();
  assert.equal(a.elapsedMs,2000);assert.equal(timer.running,false);
  now=3_600_000;assert.equal(timer.elapsed(a),2000);
  timer.resume(a);now+=3500;timer.pause();assert.equal(a.elapsedMs,5500);
});

test('reload retains accumulated time without serializing a running clock or adding time away',()=>{
  let now=0;
  const timer=createQuizTimer(()=>now),a=makeAttempt(questions,[1]);
  timer.resume(a);now=15_432;timer.checkpoint();
  const saved=JSON.parse(JSON.stringify(a));
  assert.equal(saved.elapsedMs,15_432);assert.equal(saved.runningSince,undefined);
  now=86_400_000;const restored=createQuizTimer(()=>now);
  assert.equal(restored.elapsed(saved),15_432);assert.equal(restored.running,false);
  restored.resume(saved);now+=1000;restored.pause();assert.equal(saved.elapsedMs,16_432);
  saved.submittedAt=1;restored.resume(saved);now+=100_000;
  assert.equal(restored.running,false);assert.equal(restored.elapsed(saved),16_432);
});

test('new attempts and every retake start at zero and cannot inherit another attempt clock',()=>{
  let now=0;
  const timer=createQuizTimer(()=>now),a=makeAttempt(questions,[1]);
  timer.resume(a);now=8000;
  const b=makeAttempt(questions,[2]);timer.resume(b);
  assert.equal(a.elapsedMs,8000);assert.equal(timer.elapsed(b),0);
  now+=2000;timer.pause();assert.equal(b.elapsedMs,2000);
  for(const kind of ['full','missed','focus']){
    const retake=makeRetake(a,questions,kind);
    assert.equal(retake.elapsedMs,0);timer.resume(retake);assert.equal(timer.elapsed(retake),0);timer.pause();
  }
});

test('legacy unfinished clocks reset once while old completed durations are preserved',()=>{
  const legacy={startedAt:1000,submittedAt:null,answers:{w1q1:[1]}};
  assert.equal(attemptDuration(legacy),0);
  const timer=createQuizTimer(()=>50_000);timer.resume(legacy);timer.pause();
  assert.equal(legacy.elapsedMs,0);assert.deepEqual(legacy.answers,{w1q1:[1]});
  assert.equal(attemptDuration({startedAt:1000,submittedAt:91_000}),90_000);
  assert.equal(attemptDuration({startedAt:1000,submittedAt:91_000,elapsedMs:0}),0);
  assert.equal(attemptDuration({startedAt:91_000,submittedAt:1000}),0);
});

let bootNumber=0;
async function boot(storage,clock){
  const handlers={},events={},elements=new Map();let tick;
  const element=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){},showModal(){this.open=true;},close(){this.open=false;}});
  for(const id of ['#app','#elapsed','#confirm-dialog','#dialog-content','#dialog-cancel','#dialog-confirm','#toast','#question-title'])elements.set(id,element());
  const document={visibilityState:'visible',focused:true,hasFocus(){return this.focused;},querySelector(s){
    if(s==='#elapsed'&&!elements.get('#app').innerHTML.includes('id="elapsed"'))return null;
    return elements.get(s)||null;
  },addEventListener(type,fn){handlers[type]=fn;}};
  globalThis.document=document;
  globalThis.window={scrollX:0,scrollY:0,scrollTo(p){this.scrollX=p.left||0;this.scrollY=p.top||0;},addEventListener(type,fn){events[type]=fn;}};
  globalThis.localStorage={getItem(k){return storage.get(k)||null;},setItem(k,v){storage.set(k,v);}};
  globalThis.performance={now:()=>clock.active};
  Date.now=()=>clock.wall;
  const old=globalThis.setInterval;globalThis.setInterval=fn=>{tick=fn;return 0;};
  try{await import(`../app.js?timer-test=${++bootNumber}`);}finally{globalThis.setInterval=old;}
  return {
    html:()=>elements.get('#app').innerHTML,
    state:()=>JSON.parse(storage.get('weekwise-nptel-v1')),
    display:()=>elements.get('#elapsed').textContent,
    advance(ms,heartbeat=true){clock.active+=ms;clock.wall+=ms;if(heartbeat)tick();},
    click:(action,extra={})=>handlers.click({target:{closest(){return {dataset:{action,...extra},disabled:false};}},preventDefault(){}}),
    answer:value=>handlers.change({target:{name:'answer',value:String(value),checked:true}}),
    confirm:()=>elements.get('#dialog-confirm').onclick(),
    hidden(value){document.visibilityState=value?'hidden':'visible';handlers.visibilitychange();},
    focused(value){document.focused=value;events[value?'focus':'blur']();},
    pagehide:()=>events.pagehide(),pageshow:()=>events.pageshow(),
    freeze:()=>handlers.freeze(),thaw:()=>handlers.resume()
  };
}

async function withClock(run){
  const originalNow=Date.now,originalPerformance=globalThis.performance;
  try{await run({active:0,wall:1_790_000_000_000});}
  finally{Date.now=originalNow;globalThis.performance=originalPerformance;}
}

test('UI timer pauses outside the quiz, in hidden tabs, unfocused windows, and page lifecycle events',()=>withClock(async clock=>{
  const ui=await boot(new Map(),clock);
  ui.click('order',{order:'original'});ui.click('start');
  assert.match(ui.html(),/id="elapsed">00:00/);
  ui.advance(45_000);assert.equal(ui.display(),'00:45');
  ui.answer(1);ui.click('next');assert.equal(ui.state().attempt.elapsedMs,45_000);
  ui.advance(5000,false);ui.click('home');assert.equal(ui.state().attempt.elapsedMs,50_000);
  ui.advance(3_600_000);ui.click('bank',{bank:'additional'});
  assert.equal(ui.state().attempt.elapsedMs,50_000);
  ui.click('resume');assert.equal(ui.state().activeBank,'assignments');assert.match(ui.html(),/id="elapsed">00:50/);
  ui.advance(10_000);ui.click('history');ui.advance(900_000);
  assert.equal(ui.state().attempt.elapsedMs,60_000);
  ui.click('home');ui.click('resume');
  ui.advance(5000,false);ui.hidden(true);ui.advance(900_000);
  assert.equal(ui.state().attempt.elapsedMs,65_000);
  ui.hidden(false);ui.advance(5000);assert.equal(ui.display(),'01:10');
  ui.advance(3000,false);ui.focused(false);ui.advance(900_000);
  assert.equal(ui.state().attempt.elapsedMs,73_000);
  ui.focused(true);ui.advance(2000);
  ui.advance(2000,false);ui.pagehide();ui.advance(120_000);
  assert.equal(ui.state().attempt.elapsedMs,77_000);
  ui.pageshow();ui.advance(3000);
  ui.advance(2000,false);ui.freeze();ui.advance(300_000);
  assert.equal(ui.state().attempt.elapsedMs,82_000);
  ui.thaw();ui.advance(8000);assert.equal(ui.display(),'01:30');
  ui.click('submit');ui.advance(4000,false);ui.confirm();
  assert.equal(ui.state().history[0].elapsedMs,94_000);
  assert.match(ui.html(),/Elapsed time<\/div><div class="stat-value">01:34/);
  ui.advance(3_600_000);assert.equal(ui.state().history[0].elapsedMs,94_000);
  ui.click('view-history',{id:String(ui.state().history[0].submittedAt)});
  assert.match(ui.html(),/Elapsed time<\/div><div class="stat-value">01:34/);
}));

test('UI reload resumes saved time and answers; new quizzes and all retake paths reset the timer',()=>withClock(async clock=>{
  const storage=new Map();let ui=await boot(storage,clock);
  ui.click('bank',{bank:'additional'});ui.click('order',{order:'original'});ui.click('start');
  ui.advance(11_250);ui.answer(1);ui.click('next');ui.advance(750,false);ui.pagehide();
  assert.equal(ui.state().attempt.elapsedMs,12_000);
  ui.advance(86_400_000);ui=await boot(storage,clock);ui.advance(3_600_000);
  assert.equal(ui.state().attempt.elapsedMs,12_000);assert.match(ui.html(),/Resume quiz/);
  ui.click('resume');assert.match(ui.html(),/id="elapsed">00:12/);
  assert.equal(ui.state().attempt.index,1);assert.deepEqual(ui.state().attempt.answers.p1q1,[1]);
  ui.advance(8000);ui.click('submit');ui.confirm();
  assert.equal(ui.state().history[0].elapsedMs,20_000);
  for(const action of ['retake-full','retake-missed','retake-focus','retake-full']){
    ui.click(action);assert.equal(ui.state().attempt.elapsedMs,0);assert.match(ui.html(),/id="elapsed">00:00/);
    ui.advance(2500);ui.click('submit');ui.confirm();assert.equal(ui.state().history.at(-1).elapsedMs,2500);
  }
  ui.click('home');ui.click('bank',{bank:'assignments'});ui.click('start');
  assert.equal(ui.state().attempt.elapsedMs,0);ui.advance(9000);ui.click('home');
  ui.advance(60_000);ui.click('start');ui.confirm();
  assert.equal(ui.state().attempt.elapsedMs,0);assert.deepEqual(ui.state().attempt.answers,{});
  ui.advance(3000);assert.equal(ui.state().attempt.elapsedMs,3000);
  // Changing the wall clock does not alter active elapsed time.
  clock.wall+=86_400_000;ui.advance(1000);assert.equal(ui.state().attempt.elapsedMs,4000);
  ui.click('home');ui.click('discard');ui.confirm();ui.advance(60_000);
  assert.equal(ui.state().attempt,null);assert.equal(ui.state().history[0].elapsedMs,20_000);
}));

test('UI migrates a legacy unfinished attempt without counting prior time away or losing progress',()=>withClock(async clock=>{
  const storage=new Map(),legacy=makeAttempt(questions,[1],'original',false);
  delete legacy.elapsedMs;legacy.startedAt=clock.wall-86_400_000;
  legacy.answers.w1q1=[1];legacy.flagged=['w1q2'];legacy.index=2;
  storage.set('weekwise-nptel-v1',JSON.stringify({attempt:legacy,history:[]}));
  const ui=await boot(storage,clock);ui.advance(60_000);ui.click('resume');
  assert.match(ui.html(),/id="elapsed">00:00/);assert.equal(ui.state().attempt.index,2);
  assert.deepEqual(ui.state().attempt.answers,{w1q1:[1]});assert.deepEqual(ui.state().attempt.flagged,['w1q2']);
  ui.advance(4000);ui.click('home');ui.advance(900_000);ui.click('resume');
  assert.match(ui.html(),/id="elapsed">00:04/);
}));
