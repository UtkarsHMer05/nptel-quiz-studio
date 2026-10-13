import {test} from 'node:test';
import assert from 'node:assert/strict';
import {questions} from '../questions.js';
import {makeAttempt,grade,isCorrect,shuffle,makeRetake,fullQuizConfig} from '../engine.js';
test('source bank preserves supplied numbering and five multi-select answer keys',()=>{
  assert.equal(questions.length,120);assert.equal(new Set(questions.map(q=>q.id)).size,120);
  for(const week of [1,2,3,4,5,6,7,8,9,10,11,12])assert.deepEqual(questions.filter(q=>q.week===week).map(q=>q.number),[1,2,3,4,5,6,7,8,9,10]);
  assert.deepEqual(questions.filter(q=>q.type==='multiple').map(q=>[q.id,q.correct]),[['w1q9',[0,1,2,3]],['w1q10',[1,2]],['w2q9',[0,1]],['w4q5',[0,2,3]],['w9q3',[0,1]]]);
  for(const q of questions){assert.equal(q.options.length,4);assert.ok(q.correct.every(i=>i>=0&&i<q.options.length));}
});
test('original combined attempt preserves question and option sequence',()=>{
  const a=makeAttempt(questions,[12,11,10,9,8,7,6,4,2,5,3,1],'original',false);
  assert.deepEqual(a.items.map(i=>i.id),questions.map(q=>q.id));
  for(const item of a.items)assert.deepEqual(item.optionOrder,[0,1,2,3]);
});
test('shuffled attempts retain every question and every option without changing text or answer identity',()=>{
  const before=JSON.stringify(questions);
  for(let n=0;n<50;n++){
    const a=makeAttempt(questions,[1,2,3,4,5,6,7,8,9,10,11,12],'random',true);
    assert.equal(new Set(a.items.map(i=>i.id)).size,120);
    assert.notDeepEqual(a.items.map(i=>i.id),questions.map(q=>q.id));
    for(const item of a.items){assert.deepEqual([...item.optionOrder].sort(),[0,1,2,3]);const q=questions.find(q=>q.id===item.id);a.answers[q.id]=item.optionOrder.filter(i=>q.correct.includes(i));}
    assert.equal(grade(a,questions).correct,120);
  }
  assert.equal(JSON.stringify(questions),before);
});
test('single and multi-select scoring rejects extra and missing options and distinguishes blanks',()=>{
  const a=makeAttempt(questions,[1],'original',false);
  for(const q of questions.filter(q=>q.week===1))a.answers[q.id]=[...q.correct];
  assert.equal(grade(a,questions).percent,100);
  a.answers.w1q9=[0,1,2];a.answers.w1q10=[0,1,2];a.answers.w1q1=[0];delete a.answers.w1q2;
  const g=grade(a,questions);assert.equal(g.correct,6);assert.equal(g.incorrect,3);assert.equal(g.unanswered,1);assert.equal(g.percent,60);
  assert.equal(isCorrect(questions.find(q=>q.id==='w2q9'),[1,0]),true);
});
test('focus retake includes only missed IDs from selected weeks and does not mutate prior attempt',()=>{
  const a=makeAttempt(questions,[1,2],'original',false);for(const q of questions)a.answers[q.id]=q.correct.slice();delete a.answers.w1q9;a.answers.w2q10=[2];
  const copy=JSON.stringify(a),ids=grade(a,questions).rows.filter(r=>r.status!=='correct').map(r=>r.q.id);
  const b=makeAttempt(questions,a.weeks,'random',true,ids);
  assert.deepEqual(b.items.map(i=>i.id).sort(),['w1q9','w2q10']);assert.deepEqual(b.answers,{});assert.equal(b.reviewOnly,true);assert.equal(JSON.stringify(a),copy);
});
test('shuffle copies rather than mutating input',()=>{const a=[1,2,3,4];assert.deepEqual(shuffle(a,()=>0),[2,3,4,1]);assert.deepEqual(a,[1,2,3,4]);});
test('full retake restores the saved combined quiz after a perfect nested focus attempt and browser reload',()=>{
  const original=makeAttempt(questions,[1,2,3,4],'original',false);
  original.fullQuiz={weeks:[1,2,3,4],questionIds:original.items.map(i=>i.id),order:'original',shuffleOptions:false};
  for(const q of questions)original.answers[q.id]=[...q.correct];original.answers.w4q10=[0];
  const focus=makeRetake(original,questions,'missed');
  assert.equal(focus.items.length,1);assert.equal(focus.items[0].id,'w4q10');
  focus.answers.w4q10=[1];assert.equal(grade(focus,questions).percent,100);
  const repeated=makeRetake(focus,questions,'focus');assert.equal(repeated.items.length,1);assert.deepEqual(repeated.answers,{});
  repeated.answers.w4q10=[1];
  const restored=JSON.parse(JSON.stringify(repeated)),full=makeRetake(restored,questions);
  assert.equal(full.items.length,40);assert.deepEqual(full.weeks,[1,2,3,4]);assert.equal(full.reviewOnly,false);
  assert.equal(full.order,'original');assert.equal(full.shuffleOptions,false);assert.deepEqual(full.answers,{});
  assert.deepEqual(full.items.map(i=>i.id),original.items.map(i=>i.id));
  assert.equal(repeated.items.length,1);
});
test('legacy saved focus quizzes restore all original weeks even with a missing focus flag or snapshot',()=>{
  const legacy=makeAttempt(questions,[1,3],'random',true,['w3q1']);
  delete legacy.reviewOnly;delete legacy.fullQuiz;
  const config=fullQuizConfig(legacy,questions),full=makeRetake(legacy,questions,'full');
  assert.equal(config.questionIds.length,20);assert.equal(full.items.length,20);assert.deepEqual(full.weeks,[1,3]);assert.equal(full.reviewOnly,false);
  const single=makeAttempt(questions,[3],'random',true,['w3q1']);
  single.answers.w3q1=[3];assert.equal(grade(single,questions).percent,100);
  assert.equal(makeRetake(single,questions,'focus').items.length,1);assert.equal(makeRetake(single,questions,'full').items.length,10);
});
test('Week 5 Q6 uses the accepted answer instead of the incorrect screenshot selection',()=>{
  const q=questions.find(q=>q.id==='w5q6');
  assert.equal(q.options[q.correct[0]],'Before commercializing the product');
  assert.equal(isCorrect(q,[1]),false);assert.equal(isCorrect(q,[2]),true);
  assert.deepEqual(questions.filter(q=>q.week===5).map(q=>q.correct),[[1],[1],[0],[1],[1],[2],[3],[0],[0],[0]]);
  assert.deepEqual(questions.filter(q=>q.week===6).map(q=>q.correct),[[1],[0],[0],[1],[2],[3],[3],[1],[2],[2]]);
});
test('Weeks 7–11 use the displayed accepted answers, including the incorrect Week 9 selection',()=>{
  const keys={7:[[1],[1],[0],[0],[2],[3],[0],[1],[0],[2]],8:[[1],[3],[1],[1],[3],[0],[1],[1],[0],[0]],9:[[3],[1],[0,1],[3],[0],[1],[1],[0],[1],[0]],10:[[1],[3],[0],[2],[1],[0],[1],[0],[1],[0]],11:[[0],[1],[1],[1],[1],[1],[1],[0],[0],[1]]};
  for(const [week,correct] of Object.entries(keys))assert.deepEqual(questions.filter(q=>q.week===Number(week)).map(q=>q.correct),correct);
  const q=questions.find(q=>q.id==='w9q5');assert.equal(q.options[0],'Developing a business plan and securing resources');
  assert.equal(isCorrect(q,[1]),false);assert.equal(isCorrect(q,[0]),true);
  const multi=questions.find(q=>q.id==='w9q3');assert.equal(isCorrect(multi,[0]),false);assert.equal(isCorrect(multi,[0,1,3]),false);assert.equal(isCorrect(multi,[1,0]),true);
  const ipr=questions.find(q=>q.id==='w8q8');assert.equal(ipr.options[ipr.correct[0]],'Patents, copyrights, trademarks, and trade secrets');
  const acquisition=questions.find(q=>q.id==='w8q9');assert.equal(acquisition.options[acquisition.correct[0]],'Acquiring new customers efficiently and cost-effectively');
});
test('Week 12 contains only fully supplied questions and scores the researched answer choices',()=>{
  const week=questions.filter(q=>q.week===12);
  assert.deepEqual(week.map(q=>q.correct),[[1],[0],[1],[1],[1],[0],[2],[1],[2],[2]]);
  const a=makeAttempt(questions,[12],'original',false);
  for(const q of week)a.answers[q.id]=q.correct.slice();
  assert.equal(grade(a,questions).correct,10);assert.equal(grade(a,questions).percent,100);
  a.answers.w12q5=[3];assert.equal(grade(a,questions).correct,9);
  const focus=makeRetake(a,questions,'missed');assert.deepEqual(focus.items.map(i=>i.id),['w12q5']);
  focus.answers.w12q5=[1];assert.equal(grade(focus,questions).percent,100);
  assert.deepEqual(makeRetake(JSON.parse(JSON.stringify(focus)),questions,'full').items.map(i=>i.id),week.map(q=>q.id));
});
