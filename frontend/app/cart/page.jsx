'use client';
import BorrowingPolicy,{BORROWING_POLICY_VERSION} from '../../components/borrowing-policy';
import BorrowSteps from '../../components/borrow-steps';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Banknote, BookOpen, CheckCircle2, Clock3, CreditCard, Minus, Plus, RefreshCw, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { readCart, saveCart, cartKey, checkoutAttempt, clearMatchedCart } from '../../lib/cart';
import { useAccount, AccountState, money } from '../../components/account-data';

const statuses = { CANCELLED: 'Đã hủy yêu cầu', PENDING: 'Chờ xác nhận chuyển khoản', UNPAID: 'Chờ thanh toán tại quầy', PAID: 'Đã thanh toán', FAILED: 'Đã hủy / hết hạn — chưa thanh toán', REVIEW_REQUIRED: 'Đã nhận tiền — cần thư viện xử lý' };
async function loadCart() {
  const [profile, books, payments] = await Promise.all([api.profile(), api.books(), api.payments()]);
  return { profile, books, payments };
}
export default function Cart() {
  const state = useAccount(loadCart);
  return <main className="container utility-page cart-page">
    <nav className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><b>Giỏ mượn</b></nav>
    <header className="cart-heading"><div><span className="eyebrow">BƯỚC 2 · XÁC NHẬN MƯỢN</span><h1>Giỏ mượn sách</h1><p>Kiểm tra sách, chọn thời hạn mượn và phương thức thanh toán trước khi gửi yêu cầu.</p></div><Link href="/books" className="cart-back-link"><ArrowLeft size={16}/> Tiếp tục chọn sách</Link></header>
    <BorrowSteps current={2}/>
    <AccountState data={state.data} error={state.error}/>
    {state.data && <CartBody key={state.data.profile.email} initial={state.data}/>}
  </main>;
}

function CartBody({ initial }) {
  const email = initial.profile.email;
  const [items, setItems] = useState(() => readCart(email));
  const [days, setDays] = useState(14);
  const [policyAccepted,setPolicyAccepted]=useState(false);
  const [method, setMethod] = useState('CASH');
  const [payments, setPayments] = useState(initial.payments);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const books = new Map(initial.books.map(book => [book.id, book]));
  const update = next => { saveCart(email, next); setItems(next); };
  const valid = items.length > 0 && items.every(item => books.has(item.bookId) && books.get(item.bookId).availableQuantity >= item.quantity);
  const validDays = Number.isInteger(days) && days >= 1 && days <= 365;
  const pricePerCopy = book => validDays ? Math.ceil(Math.round(Number(book?.rentalPrice || 0) * 100) * days / 1400) : 0;
  const dailyRate = book => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })
    .format(Number(book?.rentalPrice || 0) / 14);
  const total = items.reduce((sum, item) => sum + pricePerCopy(books.get(item.bookId)) * item.quantity, 0);
  const copies = items.reduce((sum, item) => sum + item.quantity, 0);
  const canContinue = p => p.method === 'PAYOS' && ['PENDING','FAILED'].includes(p.status) && !payments.some(next=>next.requestKey==='retry-'+p.id);
  const pendingPayment = payments.some(payment => payment.status === 'PENDING');

  const refresh = useCallback(async (options = {}) => {
    try {
      const current = await api.payments();
      await Promise.all(current.filter(p => p.method === 'PAYOS' && p.status === 'PENDING').map(p => api.syncPayment(p.id)));
      const list = await api.payments();
      setPayments(list);
      let attempt;
      try { attempt = JSON.parse(localStorage.getItem(cartKey(email) + ':checkout') || 'null'); } catch {}
      const payment = list.find(item => item.requestKey === attempt?.id);
      if (payment && ['PAID', 'UNPAID'].includes(payment.status)) {
        if (clearMatchedCart(email, JSON.parse(attempt.payload).items)) setItems([]);
        localStorage.removeItem(cartKey(email) + ':checkout');
      }
      if (!options.silent && !options.preserveMessage) setMessage('Đã cập nhật trạng thái thanh toán.');
    } catch (error) { if(!options.silent)setMessage(error.message); }
  }, [email]);

  useEffect(()=>{let running=false,active=true;const sync=async()=>{if(!active||running||lock.current||document.visibilityState==='hidden')return;running=true;try{await refresh({silent:true});}finally{running=false;}};sync();const timer=pendingPayment?setInterval(sync,8000):null;window.addEventListener('focus',sync);document.addEventListener('visibilitychange',sync);return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',sync);document.removeEventListener('visibilitychange',sync);};},[pendingPayment,refresh]);

  async function resumePayment(id) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage('');
    try { const result = await api.resumePayment(id);
      if(result.requestKey&&result.order)localStorage.setItem(cartKey(email)+':checkout',JSON.stringify({id:result.requestKey,payload:JSON.stringify(result.order),method:'PAYOS'}));
      const url = new URL(result.url); if (url.protocol !== 'https:' || url.hostname !== 'pay.payos.vn') throw Error('Liên kết chuyển khoản không hợp lệ.'); window.location.assign(url.href); }
    catch (error) { setMessage(error.message); try { setPayments(await api.payments()); } catch {} }
    finally { lock.current = false; setBusy(false); }
  }

  async function cancelPayment(id) {
    if(lock.current||!confirm('Hủy yêu cầu mượn này? Sách vẫn giữ trong giỏ để bạn đặt mới hoặc đổi phương thức thanh toán.'))return;
    lock.current=true;setBusy(true);setMessage('');
    try{await api.cancelPayment(id);localStorage.removeItem(cartKey(email)+':checkout');await refresh({silent:true});setMessage('Đã hủy yêu cầu. Bạn có thể sửa giỏ, đặt đơn mới hoặc chọn thanh toán trực tiếp.');}
    catch(error){setMessage(error.message);try{setPayments(await api.payments());}catch{}}
    finally{lock.current=false;setBusy(false);}
  }

  async function restoreOrder(payment) {
    if(lock.current)return;lock.current=true;setBusy(true);
    try {const order=await api.paymentOrder(payment.id);if(items.length&&!confirm('Thay sách trong giỏ bằng yêu cầu đã lưu?'))return;update(order.items);setDays(order.days);setMethod('PAYOS');setMessage('Đã khôi phục sách từ giao dịch. Kiểm tra số lượng và dùng Tiếp tục thanh toán.');}
    catch(error){setMessage(error.message);}finally{lock.current=false;setBusy(false);}
  }

  async function checkout() {
    if (lock.current) return;
    if (!policyAccepted) {setMessage('Vui lòng đọc và đồng ý quy định mượn/trả sách.');return;}
    if (!Number.isInteger(days) || days < 1 || days > 365) { setMessage('Thời hạn mượn phải từ 1 đến 365 ngày.'); return; }
    const payload = JSON.stringify({ days, items,policyAccepted:true,policyVersion:BORROWING_POLICY_VERSION });
    if(method==='PAYOS'){let old;try{old=JSON.parse(localStorage.getItem(cartKey(email)+':checkout')||'null');}catch{}const payment=payments.find(p=>p.requestKey===old?.id);if(old?.method==='PAYOS'&&old.payload===payload&&payment&&['FAILED','PENDING'].includes(payment.status)){await resumePayment(payment.id);return;}}
    lock.current = true; setBusy(true); setMessage('');
    try {
      const attempt = checkoutAttempt(email, payload, method);
      const result = await api.checkout(method, JSON.parse(payload), attempt.id);
      if (method === 'PAYOS') {
        const url = new URL(result.url);
        if (url.protocol !== 'https:') throw Error('Địa chỉ thanh toán không hợp lệ.');
        window.location.assign(url.href);
        return;
      }
      if (clearMatchedCart(email, items)) setItems([]);
      setMessage(`Đã tạo phiếu #${result.loanId}. Thanh toán ${money(result.amount)} tại thư viện.`);
      await refresh({ preserveMessage: true });
    } catch (error) { setMessage(error.message); }
    finally { lock.current = false; setBusy(false); }
  }

  return <>
    <div className="cart-policy-note"><ShieldCheck size={17}/><span>Phí mượn tính theo số ngày bạn chọn và làm tròn lên đến đồng cho mỗi quyển. Sách được giữ khi yêu cầu được xác nhận.</span></div>
    {message && <div className={message.startsWith('Đã tạo') ? 'cart-feedback cart-feedback-success' : 'cart-feedback'} role="status">{message}{message.startsWith('Đã tạo') && <Link href="/account/loans">Theo dõi phiếu mượn <ArrowRight size={15}/></Link>}</div>}
    {payments.some(canContinue)&&<section className="unpaid-orders" aria-label="Yêu cầu mượn chưa thanh toán"><header><h2>Yêu cầu mượn chưa thanh toán</h2><p>Đơn vẫn được lưu khi bạn đóng hoặc hủy trang QR. Tiếp tục sẽ mở link còn hiệu lực hoặc tạo link mới cho đúng sách đã chọn. Hủy yêu cầu để đặt mới hoặc đổi phương thức.</p></header>{payments.filter(canContinue).slice(0,5).map(p=><article key={p.id}><div><b>{money(p.amount)}</b><small>Mã {p.id} · {p.status==='PENDING'?'Đang tự kiểm tra chuyển khoản…':'Link đã hủy hoặc hết hạn'}</small></div><div><button className="secondary-button" disabled={busy} onClick={()=>restoreOrder(p)}>Xem lại sách</button><button className="primary-button" disabled={busy} onClick={()=>resumePayment(p.id)}>Tiếp tục thanh toán</button><button className="cancel-payment-button" disabled={busy} onClick={()=>cancelPayment(p.id)}><Trash2 size={14}/> Hủy yêu cầu</button></div></article>)}</section>}
    <div className="cart-layout">
      <section className="cart-items-panel" aria-labelledby="cart-items-title">
        <header className="cart-panel-heading"><div><span className="eyebrow">DANH SÁCH CỦA BẠN</span><h2 id="cart-items-title">Sách muốn mượn</h2></div><span className="cart-count">{copies} quyển</span></header>
        {items.length ? <>
          <div className="cart-items-list">{items.map(item => {
            const book = books.get(item.bookId);
            const maxQuantity = Math.min(100, Number(book?.availableQuantity || 0));
            const insufficient = !book || item.quantity > maxQuantity;
            return <article className="cart-item" key={item.bookId}>
              <div className={'cart-book-art ' + (item.bookId % 2 ? 'cover-moss' : 'cover-ochre')}><BookOpen size={25}/><span>MỘC</span></div>
              <div className="cart-book-info"><Link href={'/books/' + item.bookId} className="cart-book-title">{book?.title || 'Sách không còn trong thư viện'}</Link><span>{book?.author?.name || 'Tác giả đang cập nhật'}</span><small className={insufficient ? 'cart-stock-low' : 'cart-stock-ok'}>{book ? insufficient ? `Chỉ còn ${maxQuantity} cuốn — vui lòng điều chỉnh` : `Còn ${maxQuantity} cuốn` : 'Sách không khả dụng'}</small><span className="cart-mobile-price">Phí cho {days} ngày: {money(pricePerCopy(book))}/quyển</span></div>
              <div className="cart-item-price"><small>PHÍ / QUYỂN / NGÀY</small><strong>≈ {dailyRate(book)} đ</strong></div>
              <div className="cart-item-quantity"><small>SỐ LƯỢNG</small><div className="cart-quantity-stepper"><button type="button" aria-label={'Giảm số lượng ' + (book?.title || '')} disabled={busy || item.quantity <= 1} onClick={() => update(items.map(current => current.bookId === item.bookId ? { ...current, quantity: Math.max(1, current.quantity - 1) } : current))}><Minus size={14}/></button><span>{item.quantity}</span><button type="button" aria-label={'Tăng số lượng ' + (book?.title || '')} disabled={busy || item.quantity >= (maxQuantity || 1)} onClick={() => update(items.map(current => current.bookId === item.bookId ? { ...current, quantity: current.quantity + 1 } : current))}><Plus size={14}/></button></div></div>
              <div className="cart-item-total"><small>THÀNH TIỀN</small><strong>{money(pricePerCopy(book) * item.quantity)}</strong></div>
              <button className="cart-remove" type="button" aria-label={'Xóa ' + (book?.title || 'sách')} disabled={busy} onClick={() => update(items.filter(current => current.bookId !== item.bookId))}><Trash2 size={15}/><span>Xóa sách</span></button>
            </article>;
          })}</div>
          <button type="button" className="cart-clear-button" disabled={busy} onClick={() => update([])}><Trash2 size={14}/> Xóa toàn bộ giỏ</button>
        </> : <div className="cart-empty"><span><ShoppingBag size={28}/></span><h3>Giỏ mượn đang trống</h3><p>Thêm sách bạn muốn đọc vào đây. Bạn có thể xem số lượng còn trước khi gửi yêu cầu mượn.</p><Link href="/books" className="primary-button">Khám phá sách <ArrowRight size={16}/></Link></div>}
      </section>

      <aside className="cart-checkout-panel">{pendingPayment&&<p className="cart-pending-hint">Có yêu cầu chuyển khoản đang chờ. Hãy tiếp tục hoặc hủy yêu cầu phía trên trước khi đặt đơn khác.</p>}
        <div className="cart-panel-heading"><div><span className="eyebrow">TÓM TẮT</span><h2>Thông tin mượn</h2></div></div>
        <div className="cart-form-field">
          <label htmlFor="cart-duration"><Clock3 size={15}/> Thời hạn mượn</label>
          <div className="cart-duration-input">
            <button type="button" aria-label="Giảm số ngày mượn" disabled={busy || !validDays || days <= 1} onClick={() => setDays(days - 1)}><Minus size={16}/></button>
            <input id="cart-duration" aria-label="Số ngày mượn" type="number" min="1" max="365" step="1" inputMode="numeric" value={days} disabled={busy} onChange={event => setDays(event.target.value === '' ? '' : Number(event.target.value))}/>
            <span>ngày</span>
            <button type="button" aria-label="Tăng số ngày mượn" disabled={busy || !validDays || days >= 365} onClick={() => setDays(days + 1)}><Plus size={16}/></button>
          </div>
          {!validDays && <small className="cart-days-error" role="alert">Vui lòng nhập số nguyên từ 1 đến 365.</small>}
        </div>
        <fieldset className="cart-payment-options"><legend>Phương thức thanh toán</legend><label className={method === 'CASH' ? 'payment-option selected' : 'payment-option'}><input type="radio" name="payment" value="CASH" checked={method === 'CASH'} disabled={busy} onChange={() => setMethod('CASH')}/><span className="payment-method-icon"><Banknote size={18}/></span><span><b>Thanh toán tại thư viện</b><small>Thanh toán trực tiếp tại quầy</small></span><i/></label><label className={method === 'PAYOS' ? 'payment-option selected' : 'payment-option'}><input type="radio" name="payment" value="PAYOS" checked={method === 'PAYOS'} disabled={busy} onChange={() => setMethod('PAYOS')}/><span className="payment-method-icon"><CreditCard size={18}/></span><span><b>Chuyển khoản ngân hàng</b><small>Chuyển đến cổng thanh toán an toàn</small></span><i/></label></fieldset>
        <div className="cart-total-lines"><div><span>{copies} quyển sách</span><strong>{money(total)}</strong></div><div><span>Thời hạn</span><strong>{validDays ? days+' ngày' : 'Chưa chọn'}</strong></div></div>
        <div className="cart-total"><span>Tổng phí mượn</span><strong>{money(total)}</strong></div>
        {!valid && items.length > 0 && <p className="cart-validation" role="alert">Có sách không đủ số lượng hoặc không còn khả dụng. Vui lòng chỉnh lại giỏ.</p>}
        {pendingPayment && <p className="cart-pending-note"><Clock3 size={15}/> Bạn có giao dịch đang chờ. Hãy kiểm tra trạng thái trước khi tạo giao dịch mới.</p>}
        <BorrowingPolicy expanded/><label className="borrowing-policy-agreement"><input type="checkbox" checked={policyAccepted} disabled={busy} onChange={e=>setPolicyAccepted(e.target.checked)}/><span>Tôi đã đọc và đồng ý quy định mượn/trả sách</span></label>
        <button className="primary-button cart-checkout-button" disabled={!valid || !validDays || !policyAccepted || busy || pendingPayment} onClick={checkout}>{busy ? 'Đang xử lý…' : pendingPayment ? 'Đang chờ thanh toán' : 'Xác nhận mượn'} <ArrowRight size={17}/></button>
        <p className="cart-secure-note"><ShieldCheck size={15}/> Chưa phát sinh thanh toán cho đến khi xác nhận.</p>
      </aside>
    </div>

    <section className="payment-history">
      <header><div><span className="eyebrow">LỊCH SỬ GIAO DỊCH</span><h2>Theo dõi thanh toán</h2><p>Trạng thái thanh toán được cập nhật tự động.</p></div><button className="secondary-button" disabled={busy} onClick={refresh}><RefreshCw size={15}/> Kiểm tra trạng thái</button></header>
      {payments.length ? <div className="payment-list">{payments.map(payment => <article className="payment-row" key={payment.id}><span className="payment-method-icon">{payment.method === 'CASH' ? <Banknote size={19}/> : <CreditCard size={19}/>}</span><div className="payment-row-info"><b>{payment.method === 'CASH' ? 'Thanh toán tại thư viện' : 'Chuyển khoản ngân hàng'}</b><small>Mã giao dịch {payment.transactionNo || payment.id} · {payment.createdAt ? new Date(payment.createdAt).toLocaleString('vi-VN') : 'Thời gian chưa cập nhật'}</small></div><strong>{money(payment.amount)}</strong><span className={'payment-status ' + (payment.status === 'PAID' ? 'payment-status-done' : ['FAILED','CANCELLED'].includes(payment.status) ? 'payment-status-failed' : 'payment-status-wait')}>{statuses[payment.status] || payment.status}</span>{canContinue(payment) && <button className="secondary-button" disabled={busy} onClick={() => resumePayment(payment.id)}>Tiếp tục thanh toán</button>}{payment.loanId && <Link href="/account/loans">Phiếu #{payment.loanId}</Link>}</article>)}</div> : <div className="payment-empty"><CheckCircle2 size={18}/><span>Chưa có giao dịch thanh toán nào.</span></div>}
    </section>
  </>;
}
