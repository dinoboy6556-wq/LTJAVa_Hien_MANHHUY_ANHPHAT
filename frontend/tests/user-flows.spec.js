import {test,expect} from '@playwright/test';
const book={id:1,title:'Java kiểm thử',author:{name:'Tác giả A'},category:{name:'Lập trình'},publisher:{name:'NXB'},isbn:'123',rentalPrice:15000,salePrice:90000,availableQuantity:4,totalQuantity:4};
const profile={email:'reader@test.com',fullName:'Bạn đọc',phone:'0123456789',address:'Hà Nội',roles:['ROLE_USER']};
async function setup(page,{guest=false}={}){let loans=[{id:1,status:'BORROWED',borrowDate:'2026-11-01',dueDate:'2099-11-20',rentalFee:30000,renewalCount:0,items:[{id:11,book,copy:{code:'BC-001'},quantity:1},{id:12,book,copy:{code:'BC-002'},quantity:1}]},{id:2,status:'RETURNED',borrowDate:'2026-10-01',dueDate:'2026-10-15',returnDate:'2026-10-10',items:[{id:21,book,copy:{code:'OLD-001'},quantity:1,returnedAt:'2026-10-10'}]}],favorites=[{id:5,book}],reservations=[],payments=[],calls=[];
 await page.addInitScript(({guest,profile})=>{if(!guest){localStorage.setItem('library_token','test-token');localStorage.setItem('library_user',JSON.stringify(profile));}},{guest,profile});
 await page.route('**/api/v1/**',async route=>{const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1',''),method=req.method();let body;try{body=req.postDataJSON();}catch{}calls.push({path,method,body});let data={},status=200;
 if(path==='/auth/login')data={token:'test-token',...profile};
 else if(path==='/auth/register')data={message:'OK'};
 else if(path==='/profile')data=method==='PUT'?{...profile,...body}:profile;
 else if(path==='/books')data=[book,{...book,id:3,title:'Sách hết',availableQuantity:0}];
 else if(path==='/books/1'||path==='/books/3')data={...book,id:path.endsWith('3')?3:1,availableQuantity:path.endsWith('3')?0:4};
 else if(path.endsWith('/related'))data=[];
 else if(path.endsWith('/reviews'))data=method==='PUT'?{id:10,reviewer:'Bạn đọc',...body}:{reviews:[],average:0,count:0};
 else if(path==='/favorites')data=favorites;
 else if(path.startsWith('/favorites/')){favorites=method==='DELETE'?[]:[{book}];data={book};}
 else if(path==='/loans/my-loans')data=loans;
 else if(path.endsWith('/my-return')){loans=loans.map(l=>l.id===1?{...l,items:l.items.map(i=>!body.itemIds||body.itemIds.includes(i.id)?{...i,returnedAt:'2026-11-03'}:i)}:l);loans=loans.map(l=>({...l,status:l.items.every(i=>i.returnedAt)?'RETURNED':l.status}));data=loans[0];}
 else if(path.endsWith('/renew')){loans[0]={...loans[0],renewalCount:1};data=loans[0];}
 else if(path==='/fines/my-fines')data=[{id:1,loan:{id:1},reason:'Quá hạn',amount:10000,paid:false}];
 else if(path==='/notifications')data=[{message:'Sách sắp đến hạn',href:'/user/borrowed'}];
 else if(path==='/reservations')data=reservations;
 else if(path.startsWith('/reservations/')){reservations=method==='DELETE'?[]:[{id:1,book:{...book,id:3,title:'Sách hết'}}];data=reservations[0]||{};}
 else if(path==='/payments/my')data=payments;
 else if(path==='/payments/cash'){data={id:'cash1',loanId:9,amount:15000};payments=[{...data,requestKey:req.headers()['idempotency-key'],method:'CASH',status:'UNPAID',message:'Chờ thu tiền'}];}
 else if(path==='/payments/checkout'){status=409;data={message:'Chưa cấu hình VNPay sandbox'};}
 else if(path==='/content/public')data=[];
 else if(path==='/content/catalog')data=[{id:1,title:'Sách điện tử',slug:'java',kind:'EBOOK'}];
 else if(path==='/content/read/java')data={title:'Sách điện tử',body:'Nội dung <script>alert(1)</script>'};
 else {status=404;data={message:path};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });page.on('dialog',d=>d.accept());return calls;
}
test('card adds to cart, badge updates and cash checkout creates one request',async({page})=>{const calls=await setup(page);await page.goto('/books');await page.getByRole('button',{name:'Thêm vào giỏ',exact:true}).first().click();await expect(page.getByRole('link',{name:'Giỏ mượn, 1 quyển'})).toBeVisible();await page.getByRole('link',{name:'Giỏ mượn, 1 quyển'}).click();await expect(page.getByText('Tổng phí: 15.000 đ')).toBeVisible();await page.getByRole('button',{name:'Xác nhận mượn',exact:true}).click();await expect(page.getByText(/Đã tạo phiếu #9/)).toBeVisible();expect(calls.filter(c=>c.path==='/payments/cash')).toHaveLength(1);await expect(page.getByText('Giỏ đang trống.',{exact:false})).toBeVisible();});
test('VNPay configuration failure preserves cart and does not create fake loan',async({page})=>{const calls=await setup(page);await page.goto('/books/1');await page.getByRole('button',{name:'Mượn ngay',exact:true}).click();await page.getByLabel('Thanh toán',{exact:true}).selectOption('VNPAY');await page.getByRole('button',{name:'Xác nhận mượn',exact:true}).click();await expect(page.getByText('Chưa cấu hình VNPay sandbox')).toBeVisible();await expect(page.getByRole('cell',{name:'Java kiểm thử',exact:false})).toBeVisible();expect(calls.some(c=>c.path==='/loans'&&c.method==='POST')).toBe(false);});
test('partial return stays in active tab, full return moves to history',async({page})=>{await setup(page);await page.goto('/account/loans');await page.getByRole('button',{name:'Trả quyển này'}).first().click();await expect(page.getByRole('button',{name:'Trả quyển này'})).toHaveCount(1);await page.getByRole('button',{name:/Trả tất cả còn lại/}).click();await expect(page.getByText('Chưa có phiếu đang mượn.')).toBeVisible();await page.getByRole('link',{name:'Lịch sử đã trả'}).click();await expect(page.getByRole('heading',{name:'Phiếu #1',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/Trả quyển|Gia hạn/})).toHaveCount(0);});
test('renewal sends selected days and removes used renewal control',async({page})=>{const calls=await setup(page);await page.goto('/account/loans');await page.getByLabel('Gia hạn',{exact:true}).selectOption('3');await page.getByRole('button',{name:'Xác nhận gia hạn'}).click();await expect(page.getByText('Đã dùng lượt gia hạn')).toBeVisible();expect(calls.find(c=>c.path==='/loans/1/renew').body).toEqual({days:3});});
test('profile updates phone and address without losing roles',async({page})=>{const calls=await setup(page);await page.goto('/account/profile');await page.getByLabel('Điện thoại').fill('0987654321');await page.getByLabel('Địa chỉ').fill('TP HCM');await page.getByRole('button',{name:'Lưu hồ sơ'}).click();await expect(page.getByText('Đã cập nhật hồ sơ.')).toBeVisible();expect(calls.find(c=>c.path==='/profile'&&c.method==='PUT').body.address).toBe('TP HCM');});
test('favorites can be removed and empty state is displayed',async({page})=>{await setup(page);await page.goto('/account/favorites');await page.getByRole('button',{name:'Bỏ yêu thích',exact:true}).click();await expect(page.getByText('Chưa có sách yêu thích.')).toBeVisible();});
test('out of stock book supports waitlist then cancellation',async({page})=>{await setup(page);await page.goto('/books/3');await page.getByRole('button',{name:'Đăng ký chờ sách'}).click();await page.getByRole('button',{name:'Hủy đăng ký chờ'}).click();await expect(page.getByText('Đã hủy đăng ký.')).toBeVisible();});
test('guest reader uses content API and escapes HTML',async({page})=>{await setup(page,{guest:true});await page.goto('/library');await page.getByRole('link',{name:'Đọc nội dung'}).click();await expect(page.getByText('Nội dung <script>alert(1)</script>')).toBeVisible();await expect(page.locator('article script')).toHaveCount(0);});
test('guest borrow opens login without sending a loan request',async({page})=>{const calls=await setup(page,{guest:true});await page.goto('/books/1');await page.getByRole('button',{name:'Mượn ngay',exact:true}).click();await expect(page).toHaveURL(/\/login$/);expect(calls.some(c=>c.path==='/loans')).toBe(false);});

test('return query alone never marks payment paid or clears cart',async({page})=>{await setup(page);await page.goto('/books/1');await page.getByRole('button',{name:'Mượn ngay',exact:true}).click();await page.goto('/cart?vnp_ResponseCode=00&vnp_TransactionStatus=00');await expect(page.getByRole('cell',{name:'Java kiểm thử',exact:false})).toBeVisible();await expect(page.getByText('Đã thanh toán',{exact:true})).toHaveCount(0);});
test('review submission renders the saved review',async({page})=>{const calls=await setup(page);await page.goto('/books/1');await page.getByPlaceholder('Bạn nghĩ gì về cuốn sách này?').fill('Sách rất hữu ích');await page.getByRole('button',{name:'Gửi đánh giá',exact:false}).click();await expect(page.getByText('Sách rất hữu ích',{exact:true})).toBeVisible();expect(calls.find(c=>c.path==='/books/1/reviews'&&c.method==='PUT').body.rating).toBe(5);});
