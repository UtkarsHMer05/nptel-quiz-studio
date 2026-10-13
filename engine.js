export function shuffle(list,random=Math.random){
  const a=[...list];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
export function bankOf(attempt,bank=[]){
  return attempt?.bank||attempt?.fullQuiz?.bank||bank.find(q=>q.id===attempt?.items?.[0]?.id)?.bank||'assignments';
}
export function makeAttempt(bank,weeks,order='random',shuffleOptions=true,ids=null,bankId=null){
  bankId=bankId||bank[0]?.bank||'assignments';
  let selected=bank.filter(q=>(q.bank||'assignments')===bankId&&weeks.includes(q.week)&&(!ids||ids.includes(q.id)));
  selected.sort((a,b)=>a.week-b.week||a.number-b.number);
  if(order==='random'&&selected.length>1){
    const original=selected.map(q=>q.id).join();
    selected=shuffle(selected);
    if(selected.map(q=>q.id).join()===original)selected.push(selected.shift());
  }
  return {bank:bankId,weeks:[...weeks],order,shuffleOptions,items:selected.map(q=>({id:q.id,optionOrder:shuffleOptions?shuffle(q.options.map((_,i)=>i)):q.options.map((_,i)=>i)})),answers:{},flagged:[],index:0,startedAt:Date.now(),elapsedMs:0,submittedAt:null,reviewOnly:!!ids};
}
export function isCorrect(q,answer=[]){return answer.length===q.correct.length&&q.correct.every(i=>answer.includes(i));}
export function grade(attempt,bank){
  const rows=attempt.items.map(item=>{const q=bank.find(q=>q.id===item.id);const answer=attempt.answers[q.id]||[];return {q,answer,status:answer.length===0?'unanswered':isCorrect(q,answer)?'correct':'incorrect'};});
  const correct=rows.filter(r=>r.status==='correct').length;
  return {rows,correct,total:rows.length,incorrect:rows.filter(r=>r.status==='incorrect').length,unanswered:rows.filter(r=>r.status==='unanswered').length,percent:rows.length?Math.round(100*correct/rows.length):0};
}
export function fullQuizConfig(attempt,bank){
  const original=attempt.fullQuiz||attempt;
  const bankId=bankOf(attempt,bank);
  const weeks=[...(original.weeks||attempt.weeks)].sort((a,b)=>a-b);
  const eligible=bank.filter(q=>(q.bank||'assignments')===bankId&&weeks.includes(q.week));
  const questionIds=original.questionIds?.length?original.questionIds.filter(id=>eligible.some(q=>q.id===id)):eligible.map(q=>q.id);
  return {bank:bankId,weeks,questionIds,order:original.order||'random',shuffleOptions:original.shuffleOptions??true};
}
export function makeRetake(result,bank,kind='full'){
  const full=fullQuizConfig(result,bank);
  const ids=kind==='full'?full.questionIds:kind==='focus'?result.items.map(i=>i.id):grade(result,bank).rows.filter(r=>r.status!=='correct').map(r=>r.q.id);
  const order=kind==='full'?full.order:kind==='focus'?result.order:'random';
  const shuffled=kind==='full'?full.shuffleOptions:result.shuffleOptions;
  const next=makeAttempt(bank,full.weeks,order,shuffled,ids,full.bank);
  next.reviewOnly=kind!=='full';
  next.fullQuiz=full;
  return next;
}
