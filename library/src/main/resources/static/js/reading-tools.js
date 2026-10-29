document.addEventListener('DOMContentLoaded', async () => {
  const main=document.querySelector('main');if(!main)return;
  const token=localStorage.getItem('libraryToken');
  const create=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  async function request(url,method='GET'){
    const response=await fetch(url,{method,headers:{Authorization:`Bearer ${token}`}});
    if(response.status===401){localStorage.removeItem('libraryToken');localStorage.removeItem('libraryProfile');location.href='/user/login';throw Error('Vui lòng đăng nhập lại.');}
    const data=await response.json().catch(()=>null);if(!response.ok)throw Error(data?.message||'Không thể thực hiện. Vui lòng thử lại.');return data;
  }
  if(token){
    const board=create('details',null,'notice-board'),summary=create('summary','Thông báo của bạn — đang tải');board.append(summary);main.prepend(board);
    try{const notices=await request('/api/v1/notifications');summary.textContent=`Thông báo của bạn (${notices.length})`;
      for(const notice of notices){const link=create('a',notice.message);link.href=notice.href;board.append(link);}
      if(!notices.length)board.append(create('p','Không có sách sắp đến hạn hoặc thông báo mới.'));
      board.open=notices.length>0;
    }catch(error){summary.textContent='Chưa tải được thông báo';board.append(create('p',error.message));}
  }
  const reserve=document.getElementById('reserveBook');
  if(reserve){let saved=false;let loaded=false;const message=document.getElementById('reservationMessage');
    const update=()=>{reserve.textContent=saved?'Hủy đăng ký chờ':'Đăng ký chờ sách';};
    reserve.disabled=!!token;
    if(token)try{const entries=await request('/api/v1/reservations');saved=entries.some(r=>String(r.book.id)===reserve.dataset.bookId);loaded=true;update();}catch(error){message.textContent=error.message;}finally{reserve.disabled=false;}
    reserve.addEventListener('click',async()=>{
      if(!token){location.href='/user/login';return;}if(reserve.disabled)return;reserve.disabled=true;
      try{if(!loaded){const entries=await request('/api/v1/reservations');saved=entries.some(r=>String(r.book.id)===reserve.dataset.bookId);loaded=true;}
        await request(`/api/v1/reservations/${reserve.dataset.bookId}`,saved?'DELETE':'PUT');saved=!saved;update();message.textContent=saved?'Đã đăng ký chờ. Website sẽ thông báo khi sách có lại; chưa giữ riêng quyển sách.':'Đã hủy đăng ký chờ.';
      }catch(error){message.textContent=error.message;}finally{reserve.disabled=false;}
    });
  }
  if(token&&location.pathname==='/user/borrowed'){
    const panel=create('section',null,'reservation-panel');panel.append(create('h2','Sách đã đăng ký chờ'));main.append(panel);
    const feedback=create('p','Đang tải...');feedback.setAttribute('role','status');panel.append(feedback);
    try{const entries=await request('/api/v1/reservations');feedback.textContent=entries.length?'Đăng ký chờ không giữ riêng sách. Khi có sách, bạn có thể vào mượn.':'Bạn chưa đăng ký chờ sách nào.';
      for(const entry of entries){const row=create('div',null,'reservation-row'),link=create('a',`${entry.book.title} — ${entry.book.availableQuantity>0?'Đã có sách':'Đang chờ'}`);link.href=`/user/books/${entry.book.id}`;
        const cancel=create('button','Hủy đăng ký','btn btn-secondary');cancel.type='button';cancel.addEventListener('click',async()=>{if(cancel.disabled)return;cancel.disabled=true;try{await request(`/api/v1/reservations/${entry.book.id}`,'DELETE');row.remove();feedback.textContent='Đã hủy đăng ký.';}catch(error){feedback.textContent=error.message;cancel.disabled=false;}});
        row.append(link,cancel);panel.append(row);
      }
    }catch(error){feedback.textContent=error.message;}
  }
});
