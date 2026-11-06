document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id),token=localStorage.getItem('libraryToken');
 const create=(tag,text)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;return n;};
 const money=n=>Number(n||0).toLocaleString('vi-VN')+' đ';
 let key,items=[],busy=false,attempt=null;
 async function api(url,options={}){const response=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',...options.headers}});const data=await response.json().catch(()=>({}));if(response.status===401){location.href='/user/login';throw Error('Vui lòng đăng nhập lại.');}if(!response.ok)throw Error(data.message||'Không thể kết nối dữ liệu.');return data;}
 function read(){try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data.filter(i=>Number.isSafeInteger(i.bookId)&&Number.isSafeInteger(i.quantity)&&i.quantity>0&&i.quantity<=100):[];}catch{return [];}}
 function save(){localStorage.setItem(key,JSON.stringify(items));window.dispatchEvent(new Event('borrow-cart-changed'));attempt=null;localStorage.removeItem(key+':attempt');}
 const add=$('addToBorrowCart'),message=$('cartMessage')||$('bookBorrowMessage');
 if(!add&&!$('cartRows'))return;
 if(!token){if(add)add.addEventListener('click',()=>location.href='/user/login');else location.href='/user/login';return;}
 try{const profile=await api('/api/v1/profile');key='borrowCart:'+profile.email;items=read();}catch(error){message.textContent=error.message;return;}
 if(add){add.addEventListener('click',()=>{try{items=read();const form=$('bookBorrowForm'),qty=Number(new FormData(form).get('quantity')),id=Number(form.dataset.bookId);if(!Number.isSafeInteger(qty)||qty<1||qty>100)throw Error('Chọn số lượng từ 1–100.');const old=items.find(i=>i.bookId===id);if(old&&old.quantity+qty>100)throw Error('Mỗi đầu sách tối đa 100 quyển trong giỏ.');if(old)old.quantity+=qty;else items.push({bookId:id,quantity:qty});save();message.textContent='Đã thêm vào giỏ mượn. Mở Giỏ mượn để xem phí và thanh toán.';}catch(error){message.textContent=error.message;}});return;}
 const books=new Map();
 async function render(){
  $('cartCheckout').disabled=true;$('cartRows').replaceChildren();let total=0,valid=items.length>0;
  for(const item of items){const row=create('tr');let book;try{book=await api(`/api/v1/books/${item.bookId}`);books.set(item.bookId,book);}catch{valid=false;}
   const title=create('td',book?.title||'Sách không còn khả dụng'),price=create('td',money(book?.rentalPrice)),quantity=create('td'),input=create('input');input.type='number';input.min=1;input.max=100;input.value=item.quantity;input.setAttribute('aria-label','Số lượng '+(book?.title||item.bookId));
   input.addEventListener('change',()=>{if(busy)return;const value=Number(input.value);if(!Number.isSafeInteger(value)||value<1||value>100){input.value=item.quantity;return;}item.quantity=value;save();render();});quantity.append(input);
   const subtotal=Number(book?.rentalPrice||0)*item.quantity;total+=subtotal;
   if(!book||book.availableQuantity<item.quantity){valid=false;title.append(create('p',`Không đủ sách (còn ${book?.availableQuantity||0})`));}
   const action=create('td'),remove=create('button','Xóa');remove.className='btn btn-secondary';remove.addEventListener('click',()=>{if(busy)return;items=items.filter(i=>i!==item);save();render();});action.append(remove);
   row.append(title,price,quantity,create('td',money(subtotal)),action);$('cartRows').append(row);
  }
  if(!items.length){const tr=create('tr'),td=create('td','Giỏ mượn đang trống.');td.colSpan=5;tr.append(td);$('cartRows').append(tr);}
  $('cartTotal').textContent='Tổng phí: '+money(total);$('cartCheckout').disabled=!valid||busy;
 }
 $('cartDays').addEventListener('change',()=>{attempt=null;localStorage.removeItem(key+':attempt');});
 $('cartMethod').addEventListener('change',()=>{$('cartCheckout').textContent=$('cartMethod').value==='CASH'?'Xác nhận mượn — thanh toán tại quầy':'Thanh toán chuyển khoản qua VNPay';});
 $('cartCheckout').addEventListener('click',async()=>{if(busy||!items.length)return;const days=Number($('cartDays').value);if(!Number.isSafeInteger(days)||days<1||days>365){message.textContent='Số ngày phải từ 1–365.';return;}const method=$('cartMethod').value;if(!confirm(method==='CASH'?'Tạo phiếu mượn và thanh toán trực tiếp tại thư viện?':'Xác nhận thanh toán phí mượn?'))return;busy=true;$('cartCheckout').disabled=true;
  try{const payload=JSON.stringify({days,items:items.map(i=>({bookId:i.bookId,quantity:i.quantity}))});let stored;try{stored=JSON.parse(localStorage.getItem(key+':attempt')||'null');}catch{}
   attempt=stored?.payload===payload&&stored.method===method?stored.id:crypto.randomUUID();localStorage.setItem(key+':attempt',JSON.stringify({id:attempt,payload,method}));
   const result=await api(method==='CASH'?'/api/v1/payments/cash':'/api/v1/payments/checkout',{method:'POST',headers:{'Idempotency-Key':attempt},body:payload});if(method==='VNPAY'){location.href=result.url;return;}if(JSON.stringify(read())===JSON.stringify(JSON.parse(payload).items)){items=[];save();}message.textContent=`Đã tạo phiếu #${result.loanId}. Vui lòng thanh toán ${money(result.amount)} tại thư viện.`;busy=false;await render();await payments();
  }catch(error){message.textContent=error.message;busy=false;await render();}
 });
 async function payments(){const panel=$('cartPayments');panel.textContent='Đang kiểm tra thanh toán...';try{const list=await api('/api/v1/payments/my');panel.replaceChildren();if(!list.length)panel.append(create('p','Chưa có giao dịch.'));
  const status={UNPAID:'Chờ thanh toán tại quầy',PENDING:'Chờ VNPay xác nhận',PAID:'Đã thanh toán',FAILED:'Không thành công',REVIEW_REQUIRED:'Đã thanh toán — cần thư viện xử lý'};
  for(const payment of list){const row=create('div');row.className='reservation-row';row.append(create('p',`${payment.id} · ${payment.method==='CASH'?'Trực tiếp':'Chuyển khoản VNPay'} · ${money(payment.amount)} · ${status[payment.status]||payment.status} · ${payment.message||''}`));if(payment.loanId){const link=create('a','Xem phiếu mượn');link.href='/user/borrowed';row.append(link);}panel.append(row);
   let stored;try{stored=JSON.parse(localStorage.getItem(key+':attempt')||'null');}catch{}
   if(stored?.id===payment.requestKey&&payment.status!=='PENDING'){localStorage.removeItem(key+':attempt');if((payment.status==='PAID'||payment.status==='UNPAID')&&JSON.stringify(read())===JSON.stringify(JSON.parse(stored.payload).items)){items=[];save();await render();}}
  }
 }catch(error){panel.textContent=error.message;}}
 $('refreshPayments').addEventListener('click',payments);
 await render();await payments();
});
