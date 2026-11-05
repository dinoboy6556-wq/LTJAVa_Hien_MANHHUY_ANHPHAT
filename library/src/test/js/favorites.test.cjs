const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../main/resources/static/js/favorites.js'),'utf8');
class Element {
 constructor(){this.children=[];this.events={};this.dataset={bookId:'1'};this.attributes={};}
 addEventListener(name,fn){this.events[name]=fn;}
 setAttribute(k,v){this.attributes[k]=v;}
 append(...items){for(const item of items){item.parent=this;this.children.push(item);}}
 replaceChildren(){this.children=[];}
 remove(){this.parent.children=this.parent.children.filter(item=>item!==this);}
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup({detail=false,token='token',saved=true,failDelete=false,status=200,coverImageUrl='/images/cover.jpg'}={}){
 const button=detail?new Element():null,list=detail?null:new Element(),message=new Element();
 const storage=new Map(token?[['libraryToken',token],['libraryProfile','{}']]:[]);
 const calls=[];const window={location:{}};
 vm.runInNewContext(source,{
  document:{addEventListener:(_,fn)=>fn(),getElementById:id=>({bookFavoriteButton:button,favoriteList:list,favoriteMessage:message})[id],createElement:()=>new Element()},
  localStorage:{getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},window,
  fetch:async(url,options)=>{calls.push({url,...options});if(failDelete&&options.method==='DELETE')throw Error('Network failed');
   return {status,ok:status<400,json:async()=>options.method==='GET'?(saved?[{book:{id:1,title:'Book',coverImageUrl}}]:[]):null};}
 });
 return {button,list,message,calls,storage,window};
}
test('detail loads saved state, removes and adds again',async()=>{
 const app=setup({detail:true});await flush();
 assert.equal(app.button.attributes['aria-pressed'],'true');
 await app.button.events.click();assert.equal(app.calls.at(-1).method,'DELETE');
 assert.equal(app.button.attributes['aria-pressed'],'false');
 await app.button.events.click();assert.equal(app.calls.at(-1).method,'PUT');
 assert.equal(app.button.attributes['aria-pressed'],'true');
});
test('removing last favorite shows empty state',async()=>{
 const app=setup();await flush();
 await app.list.children[0].children[3].events.click();
 assert.equal(app.list.children.length,0);assert.match(app.list.textContent,/chưa lưu/);
});
test('network failure keeps favorite and re-enables remove',async()=>{
 const app=setup({failDelete:true});await flush();const remove=app.list.children[0].children[3];
 await remove.events.click();assert.equal(remove.disabled,false);assert.equal(app.list.children.length,1);
 assert.match(app.message.textContent,/Network failed/);
});
test('guests do not fetch private favorites and detail click asks for login',async()=>{
 const app=setup({detail:true,token:null});await flush();assert.equal(app.calls.length,0);
 await app.button.events.click();assert.equal(app.window.location.href,'/user/login');
});
test('expired session clears credentials and redirects',async()=>{
 const app=setup({status:401});await flush();
 assert.equal(app.storage.has('libraryToken'),false);assert.equal(app.window.location.href,'/user/login');
});
test('double clicks send only one favorite mutation',async()=>{
 const app=setup({detail:true});await flush();
 await Promise.all([app.button.events.click(),app.button.events.click()]);
 assert.equal(app.calls.filter(c=>c.method==='DELETE').length,1);
});

test('favorite cover uses book image and falls back if loading fails',async()=>{
 const app=setup();await flush();const cover=app.list.children[0].children[0];
 const [fallback,image]=cover.children;assert.equal(image.src,'/images/cover.jpg');assert.match(image.alt,/Book/);
 image.events.load();assert.equal(fallback.hidden,true);
 image.events.error();assert.equal(image.hidden,true);assert.equal(fallback.hidden,false);
});
test('book without cover retains readable placeholder',async()=>{
 const app=setup({coverImageUrl:null});await flush();
 assert.equal(app.list.children[0].children[0].children[0].textContent,'Book');
});
