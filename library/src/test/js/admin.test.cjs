const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../main/resources/static/js/admin.js'),'utf8');
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.events={};this.dataset={};this.style={};this.value='';this.textContent='';this.attributes={};this.className='';this.classList={add:(...names)=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),...names])].join(' ');}};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=nodes;this.textContent='';}
 addEventListener(k,f){this.events[k]=f;}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 querySelectorAll(selector){const tags=selector.split(',');const found=[];for(const child of this.children){if(!(child instanceof Element))continue;if(tags.includes(child.tagName))found.push(child);found.push(...child.querySelectorAll(selector));}return found;}
 showModal(){this.open=true;}
 close(){this.open=false;}
}

function setup(roles=['ROLE_ADMIN'], loans=[],copyStatus='BORROWED'){const nodes=new Map(),calls=[];const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};const books=Array.from({length:12},(_,i)=>({id:i+1,title:`Book ${i+1}`,availableQuantity:i%2,totalQuantity:1}));
 vm.runInNewContext(source,{Node:Element,FormData,document:{getElementById:get,createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag),addEventListener:(_,f)=>f(),querySelectorAll:selector=>selector==='[data-section]'?get('adminNav').children:[]},localStorage:{getItem:()=> 'token',removeItem(){}},location:{},confirm:()=>true,setTimeout,URL,fetch:async(url,options)=>{calls.push({url,options});return {status:200,ok:true,json:async()=>url.endsWith('/profile')?{roles,fullName:'Admin',email:'admin@test'}:url.endsWith('/summary')?{totalBooks:12}:url.endsWith('/books')?books:url.endsWith('/copies')?[{id:91,code:'COPY-91',status:copyStatus}]:url.endsWith('/loans')?loans:[]};}});return {get,calls};}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('admin navigation loads, filters and paginates inventory',async()=>{const app=setup();await flush();assert.equal(app.get('adminNav').children.length,17);app.get('adminNav').children.find(b=>b.dataset.section==='books').events.click();await flush();assert.equal(app.get('adminRows').children.length,10);assert.equal(app.get('adminRows').children[0].children[2].textContent,'Book 12');app.get('adminNext').events.click();assert.equal(app.get('adminRows').children.length,2);assert.equal(app.get('adminRows').children[0].children[0].textContent,'11');app.get('adminSearch').value='Book 12';app.get('adminSearch').events.input();assert.equal(app.get('adminRows').children.length,1);assert.match(app.get('adminPage').textContent,/1 kết quả/);});
test('reader cannot initialize management sections',async()=>{const app=setup(['ROLE_USER']);await flush();assert.equal(app.get('adminNav').children.length,0);assert.match(app.get('adminMessage').textContent,/không có quyền/);assert.equal(app.calls.length,1);});
test('librarian has operations but no user management',async()=>{const app=setup(['ROLE_LIBRARIAN']);await flush();assert.equal(app.get('adminNav').children.some(b=>b.dataset.section==='users'),false);assert.equal(app.get('adminNav').children.some(b=>b.dataset.section==='loans'),true);});

async function openBorrowedCopy(app){await flush();app.get('adminNav').children.find(b=>b.dataset.section==='books').events.click();await flush();await app.get('adminRows').children[0].querySelectorAll('button').find(b=>b.attributes['aria-label']==='Từng quyển / nhập sách').events.click();return app.get('dialogBody').children[1].children[2];}
test('borrowed copy opens matching active loan without mutating inventory',async()=>{
 const app=setup(['ROLE_ADMIN'],[{id:42,status:'BORROWED',items:[{copy:{id:91,code:'COPY-91'},book:{title:'Book'}}]}]);
 const button=await openBorrowedCopy(app);await button.events.click();
 assert.equal(app.get('dialogTitle').textContent,'Nhận trả phiếu #42');
 assert.ok(app.get('dialogBody').children.some(n=>n.children.some(c=>c.textContent.includes('COPY-91'))));
 assert.equal(app.calls.some(c=>c.options.method==='PATCH'||c.options.method==='POST'),false);
});
test('inconsistent borrowed copy cannot be changed without a loan',async()=>{
 const app=setup();const button=await openBorrowedCopy(app);await button.events.click();
 assert.match(app.get('dialogMessage').textContent,/Cần kiểm tra dữ liệu/);
 assert.equal(app.calls.some(c=>c.options.method==='PATCH'||c.options.method==='POST'),false);
});

test('loan table groups copies by book id and separates borrowing and due dates',async()=>{
 const app=setup(['ROLE_ADMIN'],[{id:42,status:'BORROWED',borrowDate:'2026-10-01',dueDate:'2026-11-01',items:[{book:{id:1,title:'Java'},copy:{code:'A1'},quantity:1},{book:{id:1,title:'Java'},copy:{code:'A2'},quantity:1},{book:{id:2,title:'Java'},copy:{code:'B1'},quantity:1}]}]);
 await flush();app.get('adminNav').children.find(b=>b.dataset.section==='loans').events.click();await flush();
 const header=app.get('adminHead').children[0].children;assert.equal(header[6].textContent,'Ngày mượn');assert.equal(header[7].textContent,'Hạn trả');
 const cells=app.get('adminRows').children[0].children;assert.equal(cells.length,10);
 assert.equal(cells[3].children.length,2);assert.equal(cells[3].children[0].textContent,'1. Java');
 assert.equal(cells[5].children.length,3);assert.equal(cells[5].children[0].textContent,'1. A1');assert.equal(cells[5].children[1].textContent,'1. A2');assert.equal(cells[5].children[2].textContent,'2. B1');assert.equal(cells[6].textContent,'2026-10-01');assert.equal(cells[7].textContent,'2026-11-01');
});

test('saving inventory status keeps dialog and selected state open',async()=>{
 const app=setup(['ROLE_ADMIN'],[],'AVAILABLE');await flush();
 app.get('adminNav').children.find(b=>b.dataset.section==='books').events.click();await flush();
 await app.get('adminRows').children[0].querySelectorAll('button').find(b=>b.attributes['aria-label']==='Từng quyển / nhập sách').events.click();
 const row=app.get('dialogBody').children[1];const select=row.children[1].children[0];select.value='DAMAGED';
 await row.children[2].events.click();assert.equal(app.get('adminDialog').open,true);assert.equal(select.value,'DAMAGED');
 assert.match(app.get('dialogMessage').textContent,/Đã lưu COPY-91/);
 assert.equal(JSON.parse(app.calls.find(c=>c.options.method==='PATCH').options.body).status,'DAMAGED');
});

test('librarian can update available copy status through inventory',async()=>{
 const app=setup(['ROLE_LIBRARIAN'],[],'AVAILABLE');await flush();
 assert.equal(app.get('adminNav').children.some(b=>['users','payments'].includes(b.dataset.section)),false);
 app.get('adminNav').children.find(b=>b.dataset.section==='books').events.click();await flush();
 await app.get('adminRows').children[0].querySelectorAll('button').find(b=>b.attributes['aria-label']==='Từng quyển / nhập sách').events.click();
 const row=app.get('dialogBody').children[1];row.children[1].children[0].value='DAMAGED';await row.children[2].events.click();
 assert.ok(app.calls.some(call=>call.options?.method==='PATCH'));assert.equal(app.get('adminDialog').open,true);
});

test('admin keeps reports last and librarian sees only book-management tabs',async()=>{
 const admin=setup(['ROLE_ADMIN']);await flush();assert.equal(admin.get('adminNav').children.at(-1).dataset.section,'reports');
 const librarian=setup(['ROLE_LIBRARIAN']);await flush();assert.deepEqual(librarian.get('adminNav').children.map(b=>b.dataset.section),['categories','books','publishers','authors','loans','ebooks']);assert.equal(librarian.get('sectionTitle').textContent,'Sách & tồn kho');
});

test('inventory row shows cover column and icon actions retain accessible labels',async()=>{
 const app=setup();await flush();app.get('adminNav').children.find(b=>b.dataset.section==='books').events.click();await flush();
 assert.equal(app.get('adminHead').children[0].children[0].textContent,'STT');
 assert.equal(app.get('adminHead').children[0].children[1].textContent,'Ảnh bìa');
 const buttons=app.get('adminRows').children[0].querySelectorAll('button');assert.equal(buttons.length,3);
 for(const label of ['Từng quyển / nhập sách','Sửa đầu sách','Xóa đầu sách']){const button=buttons.find(b=>b.attributes['aria-label']===label);assert.ok(button);assert.equal(button.title,label);assert.equal(button.children[0].tagName,'svg');assert.ok(button.events.click);}
});

test('loan list sorts by ticket number from lowest to highest',async()=>{
 const make=(id,date)=>({id,status:'BORROWED',borrowDate:date,dueDate:'2099-12-31',items:[]});const app=setup(['ROLE_ADMIN'],[make(2,'2026-11-05'),make(1,'2026-11-06'),make(3,'2026-11-06')]);await flush();app.get('adminNav').children.find(b=>b.dataset.section==='loans').events.click();await flush();assert.deepEqual(app.get('adminRows').children.map(row=>row.children[0].textContent),['#1','#2','#3']);
});
test('inspection shows recorded condition and requires choosing a condition before accepting returns',async()=>{
 const loan={id:42,status:'BORROWED',items:[{id:11,book:{id:1,title:'Java'},copy:{id:91,code:'COPY-91'},quantity:1},{id:12,book:{id:1,title:'Java'},copy:{id:92,code:'COPY-92'},quantity:1,returnedAt:'2026-11-05',returnCondition:'DAMAGED'}]};
 const app=setup(['ROLE_ADMIN'],[loan]);await flush();app.get('adminNav').children.find(b=>b.dataset.section==='loans').events.click();await flush();const controls=app.get('adminRows').children[0].querySelectorAll('button');await controls.find(b=>b.attributes['aria-label']==='Kiểm tra sách').events.click();assert.equal(app.get('dialogTitle').textContent,'Kiểm tra sách — phiếu #42');const inspection=app.get('dialogBody').children[2].children[0].children[1];assert.equal(inspection.children[1].children[3].textContent,'Hỏng');
 await app.get('dialogBody').querySelectorAll('button').find(b=>b.textContent==='Kiểm tra và nhận trả').events.click();const form=app.get('dialogBody').children.find(n=>n.tagName==='form');const select=form.querySelectorAll('select')[0];assert.equal(select.value,'');assert.equal(select.required,true);await form.events.submit({preventDefault(){}});assert.match(app.get('dialogMessage').textContent,/chọn tình trạng/);assert.equal(app.calls.some(c=>c.options.method==='POST'),false);
 select.value='DAMAGED';await form.events.submit({preventDefault(){}});const post=app.calls.find(c=>c.options.method==='POST');assert.equal(JSON.parse(post.options.body).condition,'DAMAGED');assert.deepEqual(JSON.parse(post.options.body).itemIds,[11]);
});
