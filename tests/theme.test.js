import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const script=readFileSync(new URL('../theme.js',import.meta.url),'utf8');
const key='weekwise-theme-v1';

function themeEnvironment({storage=new Map(),dark=false,blocked=false,media=true}={}){
  const root={dataset:{},style:{}},meta={},selector={value:''},listeners={};
  const system={matches:dark,addEventListener(type,fn){listeners.system=fn;}};
  const window={addEventListener(type,fn){listeners[type]=fn;}};
  if(media)window.matchMedia=query=>{assert.equal(query,'(prefers-color-scheme: dark)');return system;};
  const document={documentElement:root,querySelector(s){return s==='#theme-select'?selector:meta;}};
  const localStorage={getItem(k){if(blocked)throw new Error('Storage blocked');return storage.get(k)||null;},setItem(k,v){if(blocked)throw new Error('Storage blocked');storage.set(k,v);}};
  runInNewContext(script,{window,document,localStorage});
  return {window,document,localStorage,root,meta,selector,storage,controller:window.weekwiseTheme,
    systemChange(value){system.matches=value;listeners.system();},
    storageChange(k=key){listeners.storage({key:k});}};
}

test('System defaults to the device theme and follows live system changes',()=>{
  const env=themeEnvironment({dark:true});
  assert.equal(env.controller.preference,'system');assert.equal(env.root.dataset.theme,'dark');
  assert.equal(env.root.style.colorScheme,'dark');assert.equal(env.meta.content,'#111b17');
  env.systemChange(false);assert.equal(env.root.dataset.theme,'light');assert.equal(env.meta.content,'#173e35');
  env.systemChange(true);assert.equal(env.root.dataset.theme,'dark');
});

test('Light and Dark override the system, persist on reload, and can return to System',()=>{
  let env=themeEnvironment({dark:true});
  env.controller.setPreference('light');assert.equal(env.root.dataset.theme,'light');
  assert.equal(env.storage.get(key),'light');env.systemChange(false);env.systemChange(true);
  assert.equal(env.root.dataset.theme,'light');
  env=themeEnvironment({storage:env.storage,dark:true});assert.equal(env.controller.preference,'light');
  assert.equal(env.selector.value,'light');assert.equal(env.root.dataset.theme,'light');
  env.controller.setPreference('dark');env.systemChange(false);assert.equal(env.root.dataset.theme,'dark');
  env.controller.setPreference('system');assert.equal(env.root.dataset.theme,'light');
  env.systemChange(true);assert.equal(env.root.dataset.theme,'dark');
  assert.equal(env.storage.get(key),'system');
});

test('Theme preferences synchronize across tabs and reset to System when removed',()=>{
  const env=themeEnvironment({dark:true});
  env.storage.set(key,'light');env.storageChange();
  assert.equal(env.root.dataset.theme,'light');assert.equal(env.selector.value,'light');
  env.storage.set(key,'dark');env.storageChange('unrelated');assert.equal(env.controller.preference,'light');
  env.storageChange();assert.equal(env.root.dataset.theme,'dark');assert.equal(env.selector.value,'dark');
  env.storage.delete(key);env.storageChange(null);assert.equal(env.controller.preference,'system');
  assert.equal(env.selector.value,'system');assert.equal(env.root.dataset.theme,'dark');
});

test('Unavailable storage, invalid saved values, and missing media queries keep the app usable',()=>{
  const env=themeEnvironment({blocked:true,media:false});
  assert.equal(env.root.dataset.theme,'light');
  env.controller.setPreference('dark');assert.equal(env.root.dataset.theme,'dark');
  env.controller.setPreference('invalid');assert.equal(env.controller.preference,'dark');
  const invalid=themeEnvironment({storage:new Map([[key,'unknown']]),dark:true});
  assert.equal(invalid.controller.preference,'system');assert.equal(invalid.root.dataset.theme,'dark');
});

test('Theme selection remains available across screens without changing quiz answers or scroll',async()=>{
  const env=themeEnvironment({dark:false}),handlers={},elements=new Map();
  const element=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){}},focus(){},showModal(){this.open=true;},close(){this.open=false;}});
  for(const id of ['#app','#confirm-dialog','#dialog-content','#dialog-cancel','#dialog-confirm','#toast','#question-title'])elements.set(id,element());
  globalThis.document={querySelector(s){return elements.get(s)||null;},addEventListener(type,fn){handlers[type]=fn;}};
  globalThis.window={...env.window,scrollX:0,scrollY:0,scrollTo(p){this.scrollX=p.left||0;this.scrollY=p.top||0;}};
  globalThis.localStorage=env.localStorage;
  const old=globalThis.setInterval;globalThis.setInterval=()=>0;
  try{await import('../app.js?theme-test');}finally{globalThis.setInterval=old;}
  const html=()=>elements.get('#app').innerHTML;
  const state=()=>env.storage.get('weekwise-nptel-v1');
  const click=(action,extra={})=>handlers.click({target:{closest(){return {dataset:{action,...extra},disabled:false};}},preventDefault(){}});
  const changeTheme=value=>handlers.change({target:{id:'theme-select',value}});
  assert.match(html(),/<select id="theme-select" aria-label="Color theme">/);
  assert.match(html(),/<option value="system" selected>System<\/option>/);
  click('bank',{bank:'additional'});click('order',{order:'original'});click('start');
  handlers.change({target:{name:'answer',value:'0',checked:true}});
  window.scrollX=12;window.scrollY=300;
  const pending=state();changeTheme('dark');
  assert.equal(env.root.dataset.theme,'dark');assert.equal(state(),pending);
  assert.equal(window.scrollY,300);assert.equal(window.scrollX,12);
  click('next');assert.match(html(),/id="theme-select"/);
  click('home');assert.match(html(),/<option value="dark" selected>Dark<\/option>/);
  click('resume');click('submit');elements.get('#dialog-confirm').onclick();
  assert.match(html(),/<option value="dark" selected>Dark<\/option>/);
  const submitted=state();changeTheme('light');assert.equal(state(),submitted);
  click('history');assert.match(html(),/<option value="light" selected>Light<\/option>/);
  changeTheme('system');env.systemChange(true);assert.equal(env.root.dataset.theme,'dark');
});
