document.addEventListener('DOMContentLoaded',()=>{
 const actions=document.querySelector('.user-actions');if(!actions)return;
 const icon=document.createElement('a');icon.href='/user/cart';icon.className='cart-icon';icon.title='Giỏ mượn';
 icon.innerHTML='<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 3h2l3 12h11l3-9H6"/><circle cx="9" cy="20" r="1"/><circle cx="19" cy="20" r="1"/></svg><span class="cart-count" hidden></span>';
 const badge=icon.querySelector('.cart-count');
 function profile(){try{return JSON.parse(localStorage.getItem('libraryProfile')||'{}');}catch{return {};}}
 function key(){return 'borrowCart:'+profile().email;}
 function cart(){try{const value=JSON.parse(localStorage.getItem(key())||'[]');return Array.isArray(value)?value.filter(i=>Number.isSafeInteger(i.bookId)&&Number.isSafeInteger(i.quantity)&&i.quantity>0):[];}catch{return [];}}
 function update(){if(actions.firstChild!==icon)actions.prepend(icon);const count=localStorage.getItem('libraryToken')?cart().reduce((n,i)=>n+i.quantity,0):0;badge.textContent=count>99?'99+':String(count);badge.hidden=!count;icon.setAttribute('aria-label',`Giỏ mượn, ${count} quyển sách`);}
 new MutationObserver(update).observe(actions,{childList:true});window.addEventListener('storage',update);window.addEventListener('borrow-cart-changed',update);update();
 document.querySelectorAll('[data-cart-action]').forEach(button=>button.addEventListener('click',async()=>{
  if(button.disabled)return;if(!localStorage.getItem('libraryToken')){location.href='/user/login';return;}
  const message=button.closest('.book-card')?.querySelector('.card-feedback')||document.getElementById('bookBorrowMessage');button.disabled=true;
  try{
   if(!profile().email){const response=await fetch('/api/v1/profile',{headers:{Authorization:`Bearer ${localStorage.getItem('libraryToken')}`}});if(!response.ok)throw Error('Vui lòng đăng nhập lại.');localStorage.setItem('libraryProfile',JSON.stringify(await response.json()));}
   const id=Number(button.dataset.bookId),form=document.getElementById('bookBorrowForm'),quantity=form?Number(new FormData(form).get('quantity')):1;
   if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100)throw Error('Số lượng phải từ 1 đến 100.');
   const response=await fetch(`/api/v1/books/${id}`);if(!response.ok)throw Error('Không thể kiểm tra sách.');const book=await response.json();const items=cart(),item=items.find(i=>i.bookId===id),total=(item?.quantity||0)+quantity;
   if(total>book.availableQuantity||total>100)throw Error(`Giỏ vượt số lượng còn lại (${book.availableQuantity} cuốn).`);
   if(item)item.quantity=total;else items.push({bookId:id,quantity});localStorage.setItem(key(),JSON.stringify(items));localStorage.removeItem(key()+':attempt');window.dispatchEvent(new Event('borrow-cart-changed'));
   if(button.dataset.cartAction==='now'){location.href='/user/cart';return;}message.textContent='Đã thêm vào giỏ mượn.';
  }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
 }));
});
