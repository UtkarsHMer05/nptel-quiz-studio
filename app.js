import {questions} from './questions.js?v=week-8-complete';
import {makeAttempt,grade,fullQuizConfig,makeRetake} from './engine.js?v=full-retake-v2';
const $=s=>document.querySelector(s);
const key='weekwise-nptel-v1';
function readSaved(){try{return JSON.parse(localStorage.getItem(key))||{};}catch{return {};}}
const saved=readSaved();
let history=Array.isArray(saved.history)?saved.history:[],attempt=saved.attempt||null;
const lastSelection=saved.selection||attempt?.fullQuiz||history.at(-1)?.fullQuiz||history.at(-1)||{weeks:[1],order:'random',shuffleOptions:true};
let selectedWeeks=new Set(lastSelection.weeks),order=lastSelection.order||'random',shuffleOptions=lastSelection.shuffleOptions??true,screen='home',result=null,filter='all';
let storageFailed=false;
const icons={grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',book:'<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1zM12 5v15"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',check:'<path d="m5 12 4 4L19 6"/>',flag:'<path d="M5 21V3m0 1h13l-3 5 3 5H5"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',chart:'<path d="M5 20V11m7 9V4m7 16v-6"/>',back:'<path d="M20 12H4m6-6-6 6 6 6"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]||icons.book}</svg>`;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const weekNames={1:'Ideas & entrepreneurship',2:'Startups & customer discovery',3:'Product design & teamwork',4:'Customer needs & sustainability',5:'Innovation & product development',6:'Human-centered design & research',7:'Business models & Lean Canvas',8:'Early adopters & value propositions',9:'Funding & commercialization',10:'Creative thinking & prototyping',11:'Inclusive design & product success',12:'Product strategy & market focus'};
const availableWeeks=[...new Set(questions.map(q=>q.week))].sort((a,b)=>a-b);
const allWeeksSelected=()=>availableWeeks.every(w=>selectedWeeks.has(w));
const weekLabel=weeks=>weeks.length===1?`Week ${weeks[0]}`:`Weeks ${[...weeks].sort((a,b)=>a-b).join(' + ')}`;
function persist(){try{localStorage.setItem(key,JSON.stringify({attempt,history,selection:{weeks:[...selectedWeeks].sort((a,b)=>a-b),order,shuffleOptions}}));}catch{if(!storageFailed){storageFailed=true;toast('Progress cannot be saved in this browser. You can still complete the quiz.');}}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function time(ms){const s=Math.max(0,Math.floor(ms/1000));return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;}
function date(t){return new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});}
function answered(a){return a.items.filter(i=>(a.answers[i.id]||[]).length>0).length;}
function mobileDock(){
  if(screen==='home'){
    const count=questions.filter(q=>selectedWeeks.has(q.week)).length;
    return `<div class="mobile-dock home-dock" aria-label="Start selected quiz"><div><strong>${selectedWeeks.size} week${selectedWeeks.size===1?'':'s'} selected</strong><span>${count} questions · ${count} points</span></div><button class="btn primary" data-action="start" ${count?'':'disabled'}>Start quiz ${icon('arrow')}</button></div>`;
  }
  if(screen==='quiz'&&attempt){
    return `<div class="mobile-dock quiz-dock" aria-label="Quiz controls"><button class="btn" data-action="previous" ${attempt.index===0?'disabled':''}>${icon('back')}Previous</button><button class="btn" data-action="open-questions">${icon('grid')}Questions</button><button class="btn primary" data-action="${attempt.index===attempt.items.length-1?'submit':'next'}">${attempt.index===attempt.items.length-1?'Submit':'Next'}${icon('arrow')}</button></div>`;
  }
  return '';
}
function openQuestions(){
  const dialog=$('#confirm-dialog');
  $('#dialog-content').innerHTML=`<h2>Jump to a question</h2><div class="mobile-question-panel">${$('.navigator').innerHTML}</div><button class="btn full" data-action="close-panel">Close</button>`;
  dialog.showModal();
}
function shell(content){
  $('#app').innerHTML=`<div class="layout"><aside class="sidebar"><a class="brand" href="#" data-action="home" aria-label="Weekwise home"><span class="logo">w</span>weekwise<span style="color:#83a367">.</span></a><div class="side-label">Your study space</div><nav class="nav" aria-label="Main navigation"><button data-action="home" class="${screen!=='history'?'active':''}" aria-label="Practice quizzes">${icon('grid')}Practice quizzes</button><button data-action="history" class="${screen==='history'?'active':''}" aria-label="Attempt history">${icon('clock')}Attempt history</button></nav><div class="side-bottom"><div class="side-note"><strong>A little practice, every week.</strong>Build confidence one question at a time. Your next attempt is a fresh start.</div><div class="profile"><span class="avatar">S</span><div>Your study space<small>Progress saved on this browser</small></div></div></div></aside><main class="main"><header class="topbar"><span>NPTEL <span style="margin:0 8px;color:#b2bbb0">/</span> <strong>Entrepreneurship practice</strong></span><span class="badge"><i class="dot"></i> ${availableWeeks.length} of 12 weeks ready</span></header>${content}<footer class="footer"><span>weekwise · Learn through practice</span><span>Question text from your screenshots</span></footer></main></div>${mobileDock()}`;
}
function render(){if(screen==='quiz')renderQuiz();else if(screen==='result')renderResult();else if(screen==='history')renderHistory();else renderHome();}
function renderHome(){
  const best=history.length?Math.max(...history.map(h=>grade(h,questions).percent)):null;
  const weeks=[...selectedWeeks].sort((a,b)=>a-b),count=questions.filter(q=>weeks.includes(q.week)).length;
  const resume=attempt&&!attempt.submittedAt?`<div class="resume-banner"><div><strong>Your quiz is waiting for you.</strong><p>${weekLabel(attempt.weeks)} · ${answered(attempt)} of ${attempt.items.length} answered</p></div><div class="resume-actions"><button class="btn" data-action="discard">Discard</button><button class="btn primary" data-action="resume">Resume quiz ${icon('arrow')}</button></div></div>`:'';
  shell(`<section class="hero"><div><div class="eyebrow">Practice makes progress</div><h1>Your next great attempt<br>starts here.</h1><p>Pick a week. Mix it up. Find out what you know.</p></div><div class="hero-art" aria-hidden="true"><div class="art-page"></div><div class="art-page front"><span style="font-size:17px;color:#739251">✓</span><div class="art-line"></div><div class="art-line" style="width:75%"></div><div class="art-line"></div></div><div class="art-check">✓</div></div></section><div class="stats"><div class="stat"><div><div class="stat-label">Questions available</div><div class="stat-value">${questions.length} <small>across ${availableWeeks.length} weeks</small></div></div><span class="stat-icon">${icon('book')}</span></div><div class="stat"><div><div class="stat-label">Completed attempts</div><div class="stat-value">${history.length} <small>keep going</small></div></div><span class="stat-icon">${icon('check')}</span></div><div class="stat"><div><div class="stat-label">Your best score</div><div class="stat-value">${best===null?'—':best+'%'} <small>${best===null?'make your first attempt':'personal best'}</small></div></div><span class="stat-icon">${icon('chart')}</span></div></div>${resume}<div class="study-grid"><section><div class="section-title"><div><h2>Choose your weeks</h2><p>Select one week or combine several in a single quiz.</p></div><button class="text-btn" data-action="all-weeks">${allWeeksSelected()?'Clear selection':'Select available'}</button></div><div class="week-grid">${Array.from({length:12},(_,i)=>{const w=i+1,available=availableWeeks.includes(w),isSelected=selectedWeeks.has(w);return available?`<button class="week-card ${isSelected?'selected':''}" data-action="week" data-week="${w}" aria-pressed="${isSelected}"><div class="week-top"><span class="week-num">WEEK ${String(w).padStart(2,'0')}</span><span class="select-dot">${isSelected?'✓':''}</span></div><h3>${weekNames[w]}</h3><div class="week-foot"><span>${questions.filter(q=>q.week===w).length} questions · ${questions.filter(q=>q.week===w).length} points</span><span style="color:#5c7e49">Ready to practice ↗</span></div></button>`:`<div class="week-card locked" aria-label="Week ${w}, questions not added yet"><div class="week-top"><span class="week-num">WEEK ${String(w).padStart(2,'0')}</span><span class="select-dot">${icon('book')}</span></div><h3>Your next chapter</h3><span class="subtle">Questions coming later</span></div>`;}).join('')}</div></section><aside class="setup"><div class="setup-header"><h3>Make it your quiz</h3>${icon('settings')}</div><div class="selected-summary"><strong>${weeks.length?weekLabel(weeks):'Choose at least one week'}</strong><span>${count} questions · ${count} possible points</span></div><span class="field-label">Question order</span><div class="segmented" aria-label="Question order"><button data-action="order" data-order="random" aria-pressed="${order==='random'}" class="${order==='random'?'active':''}">Shuffled</button><button data-action="order" data-order="original" aria-pressed="${order==='original'}" class="${order==='original'?'active':''}">Original order</button></div><p class="field-help">${order==='random'?'A fresh sequence for every attempt. Practice understanding, not positions.':'Follow the question sequence in your screenshots, week by week.'}</p><label class="switch-row" for="shuffle-options">Shuffle answer options<input id="shuffle-options" type="checkbox" ${shuffleOptions?'checked':''}></label><p class="field-help">Option text stays exactly the same.</p><button class="btn primary full" data-action="start" ${count?'':'disabled'}>Start practice ${icon('arrow')}</button><div class="rules"><div>✓ &nbsp;1 point per question · no negative marking</div><div>✓ &nbsp;Choose every option you believe is correct</div><div>✓ &nbsp;Answers revealed after submission</div></div><p class="tiny-note">No time limit. Take your time.</p></aside></div>`);
}
function questionMarkup(item,index){
  const q=questions.find(q=>q.id===item.id),answer=attempt.answers[q.id]||[],flagged=attempt.flagged.includes(q.id);
  return `<div class="question-meta"><span class="eyebrow">QUESTION ${String(index+1).padStart(2,'0')} / ${String(attempt.items.length).padStart(2,'0')}</span><span class="badge type-badge">1 point</span></div><h2 id="question-title" tabindex="-1">${escape(q.text)}</h2><p class="question-instruction">Select your answer.</p><div class="options">${item.optionOrder.map((oi,i)=>`<label class="option ${answer.includes(oi)?'chosen':''}"><input type="checkbox" name="answer" value="${oi}" ${answer.includes(oi)?'checked':''}><span class="option-letter">${String.fromCharCode(65+i)}</span><span class="option-text">${escape(q.options[oi])}</span></label>`).join('')}</div><div class="question-tools"><button class="flag-btn ${flagged?'flagged':''}" data-action="flag" aria-pressed="${flagged}">${icon('flag')}${flagged?'Flagged for review':'Flag for review'}</button><button class="text-btn" data-action="clear-answer" ${answer.length?'':'disabled'}>Clear answer</button></div>`;
}
let quizSizing=null;
function fitQuestionLayout(){
  const card=$('.question-card');if(!card)return;
  const width=card.getBoundingClientRect().width;
  const cacheKey=`${attempt.startedAt}:${width}`;
  if(!quizSizing||quizSizing.key!==cacheKey){
    const probe=document.createElement('section');probe.className='question-card quiz-measure';
    Object.assign(probe.style,{position:'absolute',left:'-100000px',top:'0',width:`${width}px`,visibility:'hidden',pointerEvents:'none'});
    probe.setAttribute('aria-hidden','true');probe.inert=true;document.body.appendChild(probe);
    let title=0,option=0;
    attempt.items.forEach((item,index)=>{
      probe.innerHTML=questionMarkup(item,index);
      title=Math.max(title,probe.querySelector('h2').getBoundingClientRect().height);
      for(const el of probe.querySelectorAll('.option'))option=Math.max(option,el.getBoundingClientRect().height);
    });
    probe.remove();quizSizing={key:cacheKey,title:Math.ceil(title),option:Math.ceil(option)};
  }
  card.querySelector('h2').style.minHeight=`${quizSizing.title}px`;
  for(const el of card.querySelectorAll('.option'))el.style.minHeight=`${quizSizing.option}px`;
}
function renderQuiz(){
  const item=attempt.items[attempt.index],n=answered(attempt);
  const content=`<section class="quiz-header"><div><div class="eyebrow" style="margin-bottom:9px">Your practice session</div><h1>${weekLabel(attempt.weeks)}${attempt.reviewOnly?' · Focus retake':''}</h1><p>${attempt.order==='random'?'Shuffled':'Original'} question order · ${attempt.items.length} questions · no time limit</p></div><span class="time">${icon('clock')}<span id="elapsed">${time(Date.now()-attempt.startedAt)}</span></span></section><div class="quiz-grid"><div class="quiz-main"><section class="question-card" aria-labelledby="question-title">${questionMarkup(item,attempt.index)}</section><div class="quiz-controls"><button class="btn" data-action="previous" ${attempt.index===0?'disabled':''}>${icon('back')}Previous</button>${attempt.index===attempt.items.length-1?`<button class="btn primary" data-action="submit">Finish & submit ${icon('check')}</button>`:`<button class="btn primary" data-action="next">Next question ${icon('arrow')}</button>`}</div><p class="notice">Your answers are saved as you go. You can return to any question before submitting.</p></div><aside class="navigator"><h3>Your progress</h3><div class="progress-text"><span>${n} answered</span><span>${attempt.items.length-n} remaining</span></div><div class="progress" role="progressbar" aria-label="Questions answered" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="${attempt.items.length}"><span style="width:${100*n/attempt.items.length}%"></span></div><div class="question-dots" aria-label="Question navigation">${attempt.items.map((it,i)=>`<button class="q-dot ${i===attempt.index?'current':''} ${(attempt.answers[it.id]||[]).length?'answered':''} ${attempt.flagged.includes(it.id)?'flagged':''}" data-action="jump" data-index="${i}" aria-label="Question ${i+1}${(attempt.answers[it.id]||[]).length?', answered':', unanswered'}${attempt.flagged.includes(it.id)?', flagged':''}" ${i===attempt.index?'aria-current="step"':''}>${i+1}</button>`).join('')}</div><div class="legend"><span><i></i>Answered</span><span><i class="legend-unanswered"></i>Unanswered</span><span><i class="flag"></i>Flagged</span></div><button class="btn primary full" data-action="submit">Submit quiz ${icon('arrow')}</button><button class="btn full" data-action="home">Save & leave</button><p>Scoring and correct answers appear after you submit.</p></aside></div>`;
  const position={left:window.scrollX||0,top:window.scrollY||0};
  if($('.quiz-grid')){
    const template=document.createElement('template');template.innerHTML=content+mobileDock();
    for(const selector of ['.question-card','.quiz-controls','.navigator','.mobile-dock']){
      $(selector).innerHTML=template.content.querySelector(selector).innerHTML;
    }
  }else shell(content);
  fitQuestionLayout();
  window.scrollTo({...position,behavior:'instant'});
}
function renderResult(){
  const full=fullQuizConfig(result,questions),isFocus=result.reviewOnly||result.items.length<full.questionIds.length;
  const g=grade(result,questions),duration=time(result.submittedAt-result.startedAt),rows=g.rows.filter(r=>filter==='all'||(filter==='missed'?r.status!=='correct':r.status===filter));
  shell(`<section class="quiz-header"><div><div class="eyebrow" style="margin-bottom:9px">Every attempt is progress</div><h1>Your results</h1><p>${weekLabel(result.weeks)} · ${result.reviewOnly?'Focus retake · ':''}${date(result.submittedAt)}</p></div><button class="btn" data-action="home">Back to weeks</button></section><section class="result-hero"><div><div class="eyebrow">Practice complete</div><h2>${g.percent===100?'A perfect run. Well done.':g.percent>=70?'A strong step forward.':'Keep learning. Keep going.'}</h2><p>${g.percent===100?'You answered every question correctly. Try a shuffled retake to reinforce it.':'Review your answers below, then give yourself another go.'}</p><p class="original-quiz">Original quiz: ${weekLabel(full.weeks)} · ${full.questionIds.length} questions</p><div class="result-actions"><button class="btn lime" data-action="retake-full">Retake full quiz · ${full.questionIds.length} questions ${icon('arrow')}</button>${isFocus?`<button class="btn" data-action="retake-focus">Repeat missed-question quiz · ${result.items.length} question${result.items.length===1?'':'s'}</button>`:g.correct<g.total?`<button class="btn" data-action="retake-missed">Practice missed questions · ${g.total-g.correct}</button>`:''}</div></div><div class="result-score"><strong>${g.correct}<span style="font-size:25px;color:#abc2b1;letter-spacing:0"> / ${g.total}</span></strong><small>${g.percent}% score · ${g.total} possible points</small></div></section><div class="result-stats"><div class="stat"><div><div class="stat-label">Correct answers</div><div class="stat-value" style="color:#52733e">${g.correct}</div></div></div><div class="stat"><div><div class="stat-label">Incorrect answers</div><div class="stat-value" style="color:var(--red)">${g.incorrect}</div></div></div><div class="stat"><div><div class="stat-label">Unanswered</div><div class="stat-value">${g.unanswered}</div></div></div><div class="stat"><div><div class="stat-label">Elapsed time</div><div class="stat-value">${duration}</div></div></div></div>${result.weeks.length>1?`<div class="section-title"><p>${result.weeks.map(w=>{const wr=g.rows.filter(r=>r.q.week===w);return `Week ${w}: ${wr.filter(r=>r.status==='correct').length}/${wr.length}`;}).join(' &nbsp; · &nbsp; ')}</p></div>`:''}<div class="review-toolbar"><h2>Answer review</h2><div class="filters" aria-label="Review filters">${[['all','All questions'],['missed','Missed'],['correct','Correct'],['unanswered','Unanswered']].map(([v,l])=>`<button data-action="filter" data-filter="${v}" class="${filter===v?'active':''}" aria-pressed="${filter===v}">${l}</button>`).join('')}</div></div>${rows.length?rows.map(r=>reviewCard(r,result,g)).join(''):'<div class="empty">No questions in this view. Choose another filter to continue reviewing.</div>'}`);
}
function reviewCard({q,answer,status},a,g){
  const item=a.items.find(i=>i.id===q.id),position=a.items.indexOf(item)+1;
  return `<article class="review-card"><div class="review-top"><span>QUESTION ${position} · Week ${q.week}, original Q${q.number}</span><span class="badge status-${status}">${status==='correct'?'✓ Correct · 1/1':status==='incorrect'?'Incorrect · 0/1':'Unanswered · 0/1'}</span></div><h3>${escape(q.text)}</h3>${item.optionOrder.map(i=>{const correct=q.correct.includes(i),chosen=answer.includes(i);return `<div class="review-option ${correct?'correct-option':chosen?'wrong-option':''}"><span>${escape(q.options[i])}</span><span class="option-tag">${correct?(chosen?'✓ Correct · selected':'✓ Correct answer'):chosen?'Your selection':''}</span></div>`;}).join('')}<p class="review-foot">${status==='unanswered'?'You did not select an answer. ':''}Select all correct options and no incorrect options to earn the point. No negative marking.</p></article>`;
}
function renderHistory(){
  shell(`<section class="hero"><div><div class="eyebrow">Your learning journey</div><h1>Every attempt counts.</h1><p>Revisit your scores and pick up where you want to improve.</p></div><button class="btn primary" data-action="home">New practice ${icon('arrow')}</button></section><div class="history-list">${history.length?history.slice().reverse().map(h=>{const g=grade(h,questions);return `<article class="history-item"><div><h3>${weekLabel(h.weeks)}${h.reviewOnly?' · Focus retake':''}</h3><p>${date(h.submittedAt)} · ${h.order==='random'?'Shuffled':'Original'} · ${g.percent}%</p></div><div class="history-actions"><span class="history-score">${g.correct}<span style="font-size:13px;color:var(--muted)"> / ${g.total}</span></span><button class="btn" data-action="view-history" data-id="${h.submittedAt}">Review</button></div></article>`;}).join(''):'<div class="empty">A fresh start.<br>Your completed quizzes will appear here.<br><button class="btn primary" style="margin-top:18px" data-action="home">Take your first quiz</button></div>'}</div><p class="notice">Attempts and in-progress answers are stored in this browser. Clearing browser data removes them. Elapsed time includes time spent away from a quiz.</p>`);
}
function changeScreen(s,preserveScroll=false){const position={left:window.scrollX||0,top:window.scrollY||0};screen=s;render();window.scrollTo({...(preserveScroll?position:{left:0,top:0}),behavior:'instant'});}
function launchAttempt(factory){
  const begin=()=>{
    quizSizing=null;attempt=factory();
    const full=fullQuizConfig(attempt,questions);
    selectedWeeks=new Set(full.weeks);order=full.order;shuffleOptions=full.shuffleOptions;
    persist();changeScreen('quiz');
  };
  if(attempt&&!attempt.submittedAt){confirmDialog('Start a new attempt?','Your existing unfinished attempt will be replaced. Completed attempts stay in your history.','Start new attempt',begin);}else begin();
}
function start(weeks,mode,shuffled){
  launchAttempt(()=>{
    const next=makeAttempt(questions,weeks,mode,shuffled);
    next.fullQuiz={weeks:[...weeks],order:mode,shuffleOptions:shuffled,questionIds:next.items.map(i=>i.id)};
    return next;
  });
}
function startRetake(kind){const original=result;launchAttempt(()=>makeRetake(original,questions,kind));}
function confirmDialog(title,body,label,callback){
  const dialog=$('#confirm-dialog');if(dialog.open)dialog.close();$('#dialog-content').innerHTML=`<h2>${title}</h2><p>${body}</p><div class="dialog-actions"><button class="btn" id="dialog-cancel">Keep practicing</button><button class="btn primary" id="dialog-confirm">${label}</button></div>`;
  $('#dialog-cancel').onclick=()=>dialog.close();$('#dialog-confirm').onclick=()=>{dialog.close();callback();};dialog.showModal();
}
function submit(){
  const remaining=attempt.items.length-answered(attempt),flags=attempt.flagged.length;
  confirmDialog('Ready to see your score?',`${remaining?`You have ${remaining} unanswered question${remaining===1?'':'s'}, which will score zero. `:'You have answered every question. '}${flags?`${flags} question${flags===1?' is':'s are'} flagged for review. `:''}Submitting locks this attempt and reveals the answer key.`,'Submit & see results',()=>{attempt.submittedAt=Date.now();result=JSON.parse(JSON.stringify(attempt));history.push(result);attempt=null;filter='all';persist();changeScreen('result',true);});
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;event.preventDefault();const action=button.dataset.action;
  if(action==='home'){if($('#confirm-dialog').open)$('#confirm-dialog').close();changeScreen('home');return;}
  if(action==='history'){if($('#confirm-dialog').open)$('#confirm-dialog').close();changeScreen('history');return;}
  if(action==='week'){const w=Number(button.dataset.week);selectedWeeks.has(w)?selectedWeeks.delete(w):selectedWeeks.add(w);persist();renderHome();}
  else if(action==='all-weeks'){selectedWeeks=new Set(allWeeksSelected()?[]:availableWeeks);persist();renderHome();}
  else if(action==='order'){order=button.dataset.order;shuffleOptions=order==='random';persist();renderHome();}
  else if(action==='start')start([...selectedWeeks].sort((a,b)=>a-b),order,shuffleOptions);
  else if(action==='resume')changeScreen('quiz');
  else if(action==='discard')confirmDialog('Discard this attempt?','Your unfinished answers will be removed. Completed attempts stay in your history.','Discard attempt',()=>{attempt=null;persist();renderHome();});
  else if(['next','previous','jump'].includes(action)){if($('#confirm-dialog').open)$('#confirm-dialog').close();attempt.index=action==='jump'?Number(button.dataset.index):attempt.index+(action==='next'?1:-1);persist();renderQuiz();$('#question-title').focus({preventScroll:true});}
  else if(action==='flag'){const id=attempt.items[attempt.index].id;attempt.flagged=attempt.flagged.includes(id)?attempt.flagged.filter(x=>x!==id):[...attempt.flagged,id];persist();renderQuiz();}
  else if(action==='clear-answer'){delete attempt.answers[attempt.items[attempt.index].id];persist();renderQuiz();}
  else if(action==='open-questions')openQuestions();
  else if(action==='close-panel')$('#confirm-dialog').close();
  else if(action==='submit')submit();
  else if(action==='retake'||action==='retake-full')startRetake('full');
  else if(action==='retake-focus')startRetake('focus');
  else if(action==='retake-missed')startRetake('missed');
  else if(action==='filter'){filter=button.dataset.filter;renderResult();}
  else if(action==='view-history'){result=history.find(h=>String(h.submittedAt)===button.dataset.id);filter='all';changeScreen('result');}
});
document.addEventListener('change',event=>{
  if(event.target.id==='shuffle-options'){shuffleOptions=event.target.checked;persist();return;}
  if(event.target.name==='answer'&&screen==='quiz'){
    const q=questions.find(q=>q.id===attempt.items[attempt.index].id),value=Number(event.target.value),old=attempt.answers[q.id]||[];
    attempt.answers[q.id]=event.target.checked?[...new Set([...old,value])]:old.filter(i=>i!==value);persist();
    const activeValue=value;renderQuiz();$(`input[name="answer"][value="${activeValue}"]`)?.focus({preventScroll:true});
  }
});
window.addEventListener?.('resize',()=>{if(screen==='quiz'){const position={left:window.scrollX,top:window.scrollY};fitQuestionLayout();window.scrollTo({...position,behavior:'instant'});}});
document.fonts?.ready.then(()=>{quizSizing=null;if(screen==='quiz'){const position={left:window.scrollX,top:window.scrollY};fitQuestionLayout();window.scrollTo({...position,behavior:'instant'});}});
setInterval(()=>{const el=$('#elapsed');if(el&&attempt)el.textContent=time(Date.now()-attempt.startedAt);},1000);
render();
