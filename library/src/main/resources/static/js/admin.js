document.addEventListener('DOMContentLoaded', async () => {
  const $ = id => document.getElementById(id);
  const el = (tag, text, cls) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (cls) node.className = cls; return node; };
  const money = value => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
  const today = () => new Date().toLocaleDateString('sv-SE');
  const loanStatus = loan => loan.status === 'BORROWED' && loan.dueDate < today() ? 'OVERDUE' : loan.status;
  const labels = {AVAILABLE:'Còn sách',OUT_OF_STOCK:'Hết sách',BORROWED:'Đang mượn',RETURNED:'Đã trả',OVERDUE:'Quá hạn',DAMAGED:'Hỏng',LOST:'Mất',SOLD:'Đã bán',UNAVAILABLE:'Chưa sẵn sàng',paid:'Đã thanh toán',unpaid:'Chưa thanh toán',enabled:'Hoạt động',disabled:'Đã khóa'};
  const titles = {overview:'Tổng quan',books:'Sách & tồn kho',loans:'Phiếu mượn',fines:'Khoản phạt',sales:'Bán sách & hóa đơn',users:'Tài khoản',payments:'Thanh toán mượn',reports:'Báo cáo',categories:'Thể loại sách',authors:'Tác giả',publishers:'Nhà xuất bản',ebooks:'Sách điện tử',posts:'Bài viết & tin thư viện',pages:'Trang thông tin',config:'Cấu hình thư viện',menus:'Menu điều hướng'};
  const endpoints = {books:'/api/v1/books',loans:'/api/v1/loans',fines:'/api/v1/fines',sales:'/api/v1/sales',users:'/api/v1/admin/users',payments:'/api/v1/payments'};
  const columns = {payments:['Mã giao dịch','Email','Mã VNPay','Số tiền','Phương thức','Trạng thái','Mã phiếu','Chi tiết','Thao tác'],books:['Sách','Tác giả','Thể loại','Còn trong kho','Tổng quyển','Phí mượn','Giá bán','Thao tác'],loans:['Mã phiếu','Độc giả','Email','Sách','Số quyển','Mã quyển','Ngày mượn','Hạn trả','Trạng thái','Thao tác'],fines:['Mã phạt','Email độc giả','Phiếu','Lý do','Số tiền','Trạng thái','Thao tác'],sales:['Hóa đơn','Người mua','Ngày tạo','Sách','Tổng tiền'],users:['Họ tên','Email','Điện thoại','Địa chỉ','Quyền','Trạng thái','Thao tác']};
  const taxonomy={categories:['description','Mô tả'],authors:['biography','Tiểu sử'],publishers:['address','Địa chỉ']};
  const contentKinds={ebooks:'EBOOK',posts:'POST',pages:'PAGE',config:'CONFIG',menus:'MENU'};
  for(const key of Object.keys(taxonomy)){endpoints[key]='/api/v1/'+key;columns[key]=['Tên',taxonomy[key][1],'Thao tác'];}
  for(const [key,kind] of Object.entries(contentKinds)){endpoints[key]='/api/v1/content/manage/'+kind;columns[key]=['Tiêu đề','Mã đường dẫn','Hiển thị','Thao tác'];}
  const managed=key=>!!(taxonomy[key]||contentKinds[key]);
  async function editEntry(row={}){
    const target=section,body=openDialog((row.id?'Sửa ':'Thêm ')+titles[target]),form=el('form',null,'admin-form');body.append(form);
    const title=field(form,'Tên / tiêu đề','text',row.name||row.title||'');title.required=true;title.maxLength=255;
    if(taxonomy[target]){
      const [property,label]=taxonomy[target],description=field(form,label,'text',row[property]||'');const phone=target==='publishers'?field(form,'Điện thoại','text',row.phone||''):null;
      submitForm(form,'Lưu',async()=>{if(!title.value.trim())throw Error('Vui lòng nhập tên.');await request(endpoints[target]+(row.id?'/'+row.id:''),{method:row.id?'PUT':'POST',body:JSON.stringify({name:title.value.trim(),[property]:description.value,...(phone?{phone:phone.value}:{})})});await saved('Đã lưu.');});return;
    }
    const slug=field(form,'Mã đường dẫn (ví dụ: gioi-thieu)','text',row.slug||'');slug.required=true;
    const label=el('label','Nội dung văn bản'),text=el('textarea');text.value=row.body||'';text.rows=12;label.append(text);form.append(label);
    const link=field(form,'Liên kết nội bộ /user/... (menu)','text',row.link||'');
    let book;if(target==='ebooks'){const books=await request('/api/v1/books');book=selectField(form,'Đầu sách',books.map(b=>[b.id,b.title]),row.bookId||books[0]?.id);form.append(el('p','Chỉ xuất bản nội dung có quyền cung cấp. Nội dung được đọc trực tiếp trên web, chưa hỗ trợ PDF/EPUB.'));}
    const visible=selectField(form,'Trạng thái',[['false','Bản nháp / ẩn'],['true','Xuất bản']],String(row.published||false));const order=field(form,'Thứ tự','number',row.sortOrder||0);
    submitForm(form,'Lưu nội dung',async()=>{await request(endpoints[target],{method:'POST',body:JSON.stringify({id:row.id,title:title.value,slug:slug.value,body:text.value,link:link.value,published:visible.value==='true',sortOrder:Number(order.value),bookId:book?Number(book.value):null})});await saved('Đã lưu nội dung.');});
  }
  let section = 'overview', rows = [], page = 0, isAdmin = false, generation = 0;
  const pageSize = 10;
  function logout() { localStorage.removeItem('libraryToken'); localStorage.removeItem('libraryProfile'); location.href='/user/login'; }
  $('adminLogout').addEventListener('click', logout);
  async function request(url, options = {}) {
    const response = await fetch(url, {...options,headers:{Authorization:`Bearer ${localStorage.getItem('libraryToken')}`, ...(options.body ? {'Content-Type':'application/json'} : {}), ...options.headers}});
    if(response.status===401){logout();throw new Error('Phiên đăng nhập đã hết hạn.');}
    const data=await response.json().catch(()=>null);
    if(!response.ok) throw new Error(typeof data?.message==='string'?data.message:`Không thể thực hiện (${response.status}).`);
    return data;
  }
  function action(text, handler) { const button=el('button',text,'btn btn-secondary');button.type='button';button.addEventListener('click',async()=>{if(button.disabled)return;button.disabled=true;try{await handler();}catch(error){$('dialogMessage').textContent=error.message;$('adminMessage').textContent=error.message;}finally{button.disabled=false;}});return button; }
  function openDialog(title) { $('dialogTitle').textContent=title;$('dialogMessage').textContent='';$('dialogBody').replaceChildren();if(!$('adminDialog').open)$('adminDialog').showModal();return $('dialogBody'); }
  $('dialogClose').addEventListener('click',()=>$('adminDialog').close());
  function field(form, title, type='text', value='') {const label=el('label',title);const input=el('input');input.type=type;input.value=value;label.append(input);form.append(label);return input;}
  function selectField(form,title,options,value){const label=el('label',title),select=el('select');for(const [key,text] of options){const option=el('option',text);option.value=key;select.append(option);}select.value=value;label.append(select);form.append(label);return select;}
  function submitForm(form,text,handler){const button=el('button',text,'btn');button.type='submit';form.append(button);form.addEventListener('submit',async event=>{event.preventDefault();if(button.disabled)return;button.disabled=true;$('dialogMessage').textContent='Đang xử lý...';try{await handler();}catch(error){$('dialogMessage').textContent=error.message;}finally{button.disabled=false;if($('dialogMessage').textContent==='Đang xử lý...')$('dialogMessage').textContent='';}});}
  async function saved(message){$('adminDialog').close();await load();$('adminMessage').textContent=message;}
  async function inventory(book){
    const body=openDialog(`Từng quyển — ${book.title}`);body.textContent='Đang tải...';
    const copies=await request(`/api/v1/books/${book.id}/copies`);body.replaceChildren();
    const form=el('form',null,'admin-form');const quantity=field(form,'Số quyển nhập thêm','number',1);quantity.min=1;quantity.max=1000;quantity.required=true;
    submitForm(form,'Nhập thêm quyển',async()=>{if(!confirm(`Nhập thêm ${quantity.value} quyển ${book.title}?`))return;await request(`/api/v1/books/${book.id}/copies`,{method:'POST',body:JSON.stringify({quantity:Number(quantity.value)})});await load();await inventory(book);$('dialogMessage').textContent='Đã nhập thêm quyển sách.';});body.append(form);
    if(!copies.length)body.append(el('p','Chưa có mã quyển. Kiểm tra dữ liệu tồn kho trước khi nhập thêm.'));
    for(const copy of copies){const row=el('div',null,'copy-row');row.append(el('strong',copy.code));
      if(['BORROWED','SOLD'].includes(copy.status)) {
        row.append(el('span',labels[copy.status],'admin-badge'));
        if(copy.status==='BORROWED') row.append(action('Mở phiếu để nhận trả / báo hỏng, mất',async()=>{
          const loans=await request('/api/v1/loans');
          const matches=loans.filter(loan=>loan.status!=='RETURNED'&&(loan.items||[]).some(item=>!item.returnedAt&&item.copy?.id===copy.id));
          if(matches.length!==1)throw new Error('Không xác định được một phiếu mượn đang hoạt động cho mã '+copy.code+'. Cần kiểm tra dữ liệu trước khi đổi trạng thái.');
          returnLoan(matches[0],copy.id,book);
        }));
      }
      else{const select=selectField(row,'Tình trạng',['AVAILABLE','DAMAGED','LOST','UNAVAILABLE'].map(s=>[s,labels[s]]),copy.status);
        row.append(action('Lưu kiểm kê',async()=>{if(!confirm(`Đổi ${copy.code} thành ${labels[select.value]}?`))return;await request(`/api/v1/books/${book.id}/copies/${copy.id}`,{method:'PATCH',body:JSON.stringify({status:select.value})});copy.status=select.value;await load();$('dialogMessage').textContent=`Đã lưu ${copy.code}: ${labels[copy.status]}.`;}));}
      row.append(action('Lịch sử quyển',async()=>{
        let history=row.querySelector('.copy-history');
        if(history){history.remove();return;}
        const events=await request(`/api/v1/books/${book.id}/copies/${copy.id}/history`);
        history=el('div',null,'copy-history');
        if(!events.length)history.append(el('p','Chưa có lịch sử ghi nhận. Nhật ký chỉ có từ khi bật chức năng này.'));
        for(const event of events)history.append(el('p',`${event.createdAt.replace('T',' ').slice(0,19)} · ${event.action} · ${labels[event.previousStatus]||'—'} → ${labels[event.newStatus]||event.newStatus} · ${event.actor}`));
        row.append(history);
      }));
      body.append(row);
    }
  }
  function returnLoan(loan,copyId=null,originBook=null){
    const body=openDialog(`Nhận trả phiếu #${loan.id}`),form=el('form',null,'admin-form');
    body.append(el('p','Chọn các quyển được trả lần này. Nếu tình trạng khác nhau, xử lý từng nhóm riêng. Phiếu chỉ hoàn tất khi tất cả quyển đã trả.'));
    body.append(el('p',`Độc giả: ${loan.user?.fullName||loan.user?.email||'—'}`));
    const picks=[];
    for(const item of loan.items||[]){
      if(item.returnedAt)continue;
      const label=el('label',`${item.book?.title||'Sách'} · ${item.copy?.code||'Chưa có mã'}`,'wide');
      const input=el('input');input.type='checkbox';input.checked=copyId==null||item.copy?.id===copyId;
      picks.push({input,id:item.id});label.append(input);form.append(label);
    }
    const condition=selectField(form,'Tình trạng khi trả',[['NORMAL','Bình thường'],['DAMAGED','Hỏng'],['LOST','Mất']],'NORMAL'),note=field(form,'Ghi chú');
    submitForm(form,'Xác nhận nhận trả',async()=>{
      const itemIds=picks.filter(p=>p.input.checked).map(p=>p.id);
      if(!itemIds.length)throw new Error('Chọn ít nhất một quyển để trả.');
      if(!confirm(`Nhận trả ${itemIds.length} quyển đã chọn của phiếu #${loan.id}?`))return;
      const result=await request(`/api/v1/loans/${loan.id}/return`,{method:'POST',body:JSON.stringify({condition:condition.value,note:note.value,itemIds})});
      const message=`Đã nhận trả ${itemIds.length} quyển. Tổng phạt của phiếu: ${money(result.fineAmount)}.`;
      if(originBook){await load();await inventory(originBook);$('dialogMessage').textContent=message;}
      else await saved(message);
    });body.append(form);
  }
  function editUser(user){const body=openDialog(`Tài khoản — ${user.email}`),form=el('form',null,'admin-form');
    const enabled=selectField(form,'Trạng thái',[['true','Hoạt động'],['false','Khóa']],String(user.enabled));
    const protectedAdmin=user.roles.includes('ROLE_ADMIN');enabled.disabled=protectedAdmin;
    if(protectedAdmin)body.append(el('p','Tài khoản quản trị được bảo vệ: không thể khóa hoặc gỡ quyền ADMIN.'));
    const checks=['ROLE_ADMIN','ROLE_LIBRARIAN','ROLE_USER'].map(role=>{const label=el('label',role.replace('ROLE_',''));const input=el('input');input.type='checkbox';input.checked=user.roles.includes(role);input.value=role;if(protectedAdmin&&role==='ROLE_ADMIN')input.disabled=true;label.append(input);form.append(label);return input;});
    submitForm(form,'Lưu tài khoản',async()=>{const roles=checks.filter(i=>i.checked).map(i=>i.value);if(!roles.length)throw new Error('Chọn ít nhất một vai trò.');if(!confirm(`Cập nhật quyền và trạng thái của ${user.email}?`))return;await request(`/api/v1/admin/users/${user.id}`,{method:'PUT',body:JSON.stringify({enabled:enabled.value==='true',roles})});await saved('Đã cập nhật tài khoản.');});body.append(form);
  }
  async function bookForm(existing=null){
    const body=openDialog(existing?'Sửa đầu sách':'Thêm đầu sách');body.textContent='Đang tải danh mục...';
    try{const [categories,authors,publishers]=await Promise.all(['/categories','/authors','/publishers'].map(path=>request('/api/v1'+path)));body.replaceChildren();
      const form=el('form',null,'admin-form');const title=field(form,'Tên sách');title.required=true;const isbn=field(form,'ISBN');
      const cover=field(form,'Đường dẫn ảnh bìa (https://...)','url');const description=field(form,'Mô tả');
      const category=selectField(form,'Thể loại',[['','Chưa phân loại'],...categories.map(x=>[String(x.id),x.name])],'');
      const author=selectField(form,'Tác giả',[['','Chưa chọn'],...authors.map(x=>[String(x.id),x.name])],'');
      const publisher=selectField(form,'Nhà xuất bản',[['','Chưa chọn'],...publishers.map(x=>[String(x.id),x.name])],'');
      const quantity=field(form,'Số lượng','number',1);quantity.min=1;quantity.required=true;
      const rental=field(form,'Phí mượn / quyển','number',0),price=field(form,'Giá bán','number',0);for(const input of [rental,price]){input.min=0;input.required=true;}
      if(existing){title.value=existing.title||'';isbn.value=existing.isbn||'';cover.value=existing.coverImageUrl||'';description.value=existing.description||'';
        category.value=String(existing.category?.id||'');author.value=String(existing.author?.id||'');publisher.value=String(existing.publisher?.id||'');
        quantity.value=existing.totalQuantity;quantity.disabled=true;rental.value=existing.rentalPrice;price.value=existing.salePrice;}
      submitForm(form,existing?'Lưu thay đổi':'Tạo đầu sách',async()=>{await request(existing?`/api/v1/books/${existing.id}`:'/api/v1/books',{method:existing?'PUT':'POST',body:JSON.stringify({title:title.value,isbn:isbn.value,coverImageUrl:cover.value,description:description.value,categoryId:category.value?Number(category.value):null,authorId:author.value?Number(author.value):null,publisherId:publisher.value?Number(publisher.value):null,totalQuantity:Number(quantity.value),rentalPrice:Number(rental.value),salePrice:Number(price.value)})});await saved(existing?'Đã cập nhật thông tin đầu sách.':'Đã tạo đầu sách và mã từng quyển.');});body.append(form);
    }catch(error){$('dialogMessage').textContent=error.message;body.replaceChildren();}
  }
  $('newBook').addEventListener('click',()=>managed(section)?editEntry():bookForm());
  function status(row){if(section==='books')return row.availableQuantity>0?'AVAILABLE':'OUT_OF_STOCK';if(section==='loans')return loanStatus(row);if(section==='fines')return row.paid?'paid':'unpaid';if(section==='users')return row.enabled?'enabled':'disabled';return '';}
  function render(){
    const query=$('adminSearch').value.trim().toLocaleLowerCase('vi'),filter=$('adminFilter').value;
    const filtered=rows.filter(row=>(!filter||status(row)===filter)&&JSON.stringify(row).toLocaleLowerCase('vi').includes(query));
    const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,pages-1);
    const head=el('tr');columns[section].forEach(text=>head.append(el('th',text)));$('adminHead').replaceChildren(head);$('adminRows').replaceChildren();
    for(const row of filtered.slice(page*pageSize,(page+1)*pageSize)){
      const tr=el('tr');const cells=[];let controls=el('div');
      if(taxonomy[section]){cells.push(row.name,row[taxonomy[section][0]]||'—');controls.append(action('Chỉnh sửa',()=>editEntry(row)));}
      if(contentKinds[section]){cells.push(row.title,row.slug,row.published?'Đang hiển thị':'Bản nháp / ẩn');controls.append(action('Chỉnh sửa',()=>editEntry(row)));if(row.published&&['ebooks','posts','pages'].includes(section)){const link=el('a','Xem');link.href='/user/read/'+row.slug;controls.append(link);}}
      if(section==='books'){cells.push(row.title,row.author?.name||'Chưa có tác giả',row.category?.name||'—',row.availableQuantity,row.totalQuantity,money(row.rentalPrice),money(row.salePrice));controls.append(action('Từng quyển / nhập sách',()=>inventory(row)),action('Sửa đầu sách',()=>bookForm(row)));}
      if(section==='loans'){
        const groups=new Map();
        for(const item of row.items||[]){
          const key=item.book?.id ?? item.book?.title ?? 'unknown';
          if(!groups.has(key))groups.set(key,{title:item.book?.title||'Sách',codes:[],quantity:0});
          const group=groups.get(key);group.codes.push((item.copy?.code||'Chưa có mã')+(item.returnedAt?' (đã trả)':''));group.quantity+=Number(item.quantity||1);
        }
        const grouped=[...groups.values()];
        const titles=grouped.map((g,i)=>`${grouped.length>1?`${i+1}. `:''}${g.title}`);
        const codes=grouped.flatMap((g,i)=>g.codes.map(code=>`${grouped.length>1?`${i+1}. `:''}${code}`));
        cells.push(`#${row.id}`, row.user?.fullName||'—', row.user?.email||'—', titles, grouped.map(g=>String(g.quantity)), codes, row.borrowDate||'—',row.dueDate||'—',labels[loanStatus(row)]||row.status);if(row.status!=='RETURNED')controls.append(action('Nhận trả',()=>returnLoan(row)));else controls.append(el('span',`Đã trả ${row.returnDate||''}`));}
      if(section==='fines'){cells.push(`#${row.id}`,row.loan?.user?.email||'—',`#${row.loan?.id||'—'}`,row.reason||'—',money(row.amount),labels[status(row)]);if(!row.paid)controls.append(action('Xác nhận đã thu',async()=>{if(!confirm(`Đã nhận ${money(row.amount)} cho khoản phạt #${row.id}?`))return;await request(`/api/v1/fines/${row.id}/mark-paid`,{method:'POST'});await load();$('adminMessage').textContent='Đã xác nhận thanh toán khoản phạt.';}));}
      if(section==='sales'){cells.push(`#${row.id}`,row.user?.email||'—',row.createdAt?.replace('T',' ').slice(0,19)||'—',(row.items||[]).map(i=>`${i.book?.title||''} × ${i.quantity}`).join('; '),money(row.totalAmount));controls=null;}
      if(section==='payments'){cells.push(row.id,row.payerEmail,row.transactionNo||'—',money(row.amount),row.method==='CASH'?'Trực tiếp':'Chuyển khoản VNPay',({UNPAID:'Chờ thu tiền',PAID:'Đã thanh toán',PENDING:'Chờ VNPay',FAILED:'Thất bại',REVIEW_REQUIRED:'Cần xử lý'})[row.status]||row.status,row.loanId||'—',row.message||'—');
       if(row.method==='CASH'&&row.status==='UNPAID'){const confirmButton=el('button','Xác nhận đã thu tiền');confirmButton.className='btn btn-secondary';confirmButton.addEventListener('click',async()=>{if(!confirm(`Đã nhận đủ ${money(row.amount)} cho phiếu #${row.loanId}?`))return;confirmButton.disabled=true;try{await request(`/api/v1/payments/${row.id}/confirm-cash`,{method:'POST'});await load();}catch(error){$('adminMessage').textContent=error.message;confirmButton.disabled=false;}});controls.append(confirmButton);}else controls.append(el('span',row.confirmedBy||'—'));}
      if(section==='users'){cells.push(row.fullName,row.email,row.phone||'—',row.address||'—',row.roles.map(r=>r.replace('ROLE_','')).join(', '),labels[status(row)]);controls.append(action('Chỉnh sửa',()=>editUser(row)));
        if(row.roles.includes('ROLE_ADMIN'))controls.append(el('span','Admin được bảo vệ','admin-badge'));
        else controls.append(action(row.enabled?'Khóa tài khoản':'Mở khóa',async()=>{
          if(!confirm(`${row.enabled?'Khóa':'Mở khóa'} tài khoản ${row.email}?${row.enabled?' Tài khoản sẽ bị chặn ở lần gọi API tiếp theo.':''}`))return;
          await request(`/api/v1/admin/users/${row.id}/status`,{method:'PATCH',body:JSON.stringify({enabled:!row.enabled})});
          await load();$('adminMessage').textContent=row.enabled?'Đã khóa tài khoản.':'Đã mở khóa tài khoản.';
        }));}
      cells.forEach((value,index)=>{const td=el('td');if(Array.isArray(value)){value.forEach(text=>td.append(el('div',text,'admin-cell-line')));}else td.textContent=value;if(section==='loans')td.className=`loan-column-${index}`;tr.append(td);});if(controls){const td=el('td');td.append(controls);tr.append(td);}$('adminRows').append(tr);
    }
    if(!filtered.length){const tr=el('tr'),td=el('td','Không có dữ liệu phù hợp.');td.colSpan=columns[section].length;tr.append(td);$('adminRows').append(tr);}
    $('adminPage').textContent=`Trang ${page+1}/${pages} · ${filtered.length} kết quả`;$('adminPrevious').disabled=page===0;$('adminNext').disabled=page>=pages-1;
  }
  async function load(){const ticket=++generation;$('adminMessage').textContent='Đang tải dữ liệu...';$('adminRefresh').disabled=true;
    try{if(section==='overview'){
      const [summary,loans]=await Promise.all([request('/api/v1/statistics/summary'),request('/api/v1/loans')]);if(ticket!==generation)return;
      $('statCards').replaceChildren();for(const [label,value] of [['Đầu sách',summary.totalBooks],['Hết sách',summary.outOfStockBooks],['Tài khoản',summary.totalUsers],['Đang mượn',summary.activeLoans],['Hóa đơn',summary.totalSales],['Doanh thu bán',money(summary.totalSalesRevenue)]]){const card=el('article',null,'admin-stat');card.append(el('span',label),el('strong',value??0));$('statCards').append(card);}
      $('loanChart').replaceChildren();for(const state of ['BORROWED','OVERDUE','RETURNED']){const count=loans.filter(l=>loanStatus(l)===state).length;const row=el('div',null,'chart-row'),track=el('div',null,'chart-track'),bar=el('div',null,'chart-bar');bar.style.width=`${loans.length?100*count/loans.length:0}%`;track.append(bar);row.append(el('span',labels[state]),track,el('strong',count));$('loanChart').append(row);}
    }else if(endpoints[section]){const data=await request(endpoints[section]);if(ticket!==generation)return;rows=data;render();}
    if(ticket===generation)$('adminMessage').textContent='';
    }catch(error){if(ticket===generation){$('adminMessage').textContent=error.message;if(endpoints[section]){rows=[];render();}}}finally{if(ticket===generation)$('adminRefresh').disabled=false;}
  }
  function navigate(key){section=key;page=0;rows=[];$('sectionTitle').textContent=titles[key];$('adminSearch').value='';$('adminFilter').replaceChildren();
    const states={books:['AVAILABLE','OUT_OF_STOCK'],loans:['BORROWED','OVERDUE','RETURNED'],fines:['unpaid','paid'],users:['enabled','disabled']};
    for(const state of ['',...(states[key]||[])]){const option=el('option',state?labels[state]:'Tất cả');option.value=state;$('adminFilter').append(option);}
    $('adminOverview').hidden=key!=='overview';$('adminData').hidden=!endpoints[key];$('adminReports').hidden=key!=='reports';$('newBook').hidden=key!=='books'&&!managed(key);$('newBook').textContent=managed(key)?'Thêm mới':'Thêm đầu sách';
    document.querySelectorAll('[data-section]').forEach(button=>{if(button.dataset.section===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
    if(endpoints[key])render();load();
  }
  $('adminRefresh').addEventListener('click',load);$('adminSearch').addEventListener('input',()=>{page=0;render();});$('adminFilter').addEventListener('change',()=>{page=0;render();});$('adminPrevious').addEventListener('click',()=>{page--;render();});$('adminNext').addEventListener('click',()=>{page++;render();});
  document.querySelectorAll('[data-report]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{const response=await fetch(`/api/v1/admin/reports/${button.dataset.report}.csv`,{headers:{Authorization:`Bearer ${localStorage.getItem('libraryToken')}`}});if(!response.ok)throw new Error('Không thể xuất báo cáo. Hãy kiểm tra quyền tài khoản.');const url=URL.createObjectURL(await response.blob()),link=el('a');link.href=url;link.download=`library-${button.dataset.report}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){$('adminMessage').textContent=error.message;}finally{button.disabled=false;}}));
  if(!localStorage.getItem('libraryToken')){location.href='/user/login';return;}
  try{const profile=await request('/api/v1/profile');isAdmin=profile.roles?.includes('ROLE_ADMIN');if(!isAdmin&&!profile.roles?.includes('ROLE_LIBRARIAN'))throw new Error('Tài khoản không có quyền quản trị thư viện.');$('adminIdentity').textContent=`${profile.fullName} · ${profile.email}`;
    for(const [key,title] of Object.entries(titles)){if(['users','payments','config','menus'].includes(key)&&!isAdmin)continue;const button=el('button',title);button.type='button';button.dataset.section=key;button.addEventListener('click',()=>navigate(key));$('adminNav').append(button);}navigate('overview');
  }catch(error){$('adminMessage').textContent=error.message;$('adminRefresh').disabled=true;}
});
