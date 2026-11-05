document.addEventListener('DOMContentLoaded',async()=>{
 try{const response=await fetch('/api/v1/content/public');if(!response.ok)return;const entries=await response.json(),footer=document.querySelector('.footer');if(!footer)return;
 const nav=document.createElement('nav');nav.className='site-info-links';
 const add=(title,href)=>{const a=document.createElement('a');a.textContent=title;a.href=href;nav.append(a);};add('Đọc online & tin thư viện','/user/library');
 for(const item of entries){if(item.kind==='PAGE')add(item.title,'/user/read/'+item.slug);if(item.kind==='MENU'&&/^\/user(?:\/[a-zA-Z0-9/_-]*)?$/.test(item.link||''))add(item.title,item.link);if(item.kind==='CONFIG'){const p=document.createElement('p');p.textContent=item.title+': '+(item.body||'');footer.append(p);}}
 footer.append(nav);
 }catch{}
});
