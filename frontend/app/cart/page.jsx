'use client';
import BorrowSteps from '../../components/borrow-steps';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Banknote, BookOpen, CheckCircle2, Clock3, CreditCard, Minus, Plus, RefreshCw, ShieldCheck, ShoppingBag, Trash2, Wallet } from 'lucide-react';
import { api } from '../../lib/api';
import { readCart, saveCart, cartKey, checkoutAttempt, clearMatchedCart } from '../../lib/cart';
import { useAccount, AccountState, money } from '../../components/account-data';

const statuses = { PENDING: 'Đang chờ VNPay xác nhận', UNPAID: 'Chờ thanh toán tại quầy', PAID: 'Đã thanh toán', FAILED: 'Giao dịch không thành công', REVIEW_REQUIRED: 'Đã nhận tiền — cần thư viện xử lý' };
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
  const [method, setMethod] = useState('CASH');
  const [payments, setPayments] = useState(initial.payments);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const books = new Map(initial.books.map(book => [book.id, book]));
  const update = next => { saveCart(email, next); setItems(next); };
  const valid = items.length > 0 && items.every(item => books.has(item.bookId) && books.get(item.bookId).availableQuantity >= item.quantity);
  const billingPeriods = Math.ceil(days / 14);
  const pricePerCopy = book => Number(book?.rentalPrice || 0) * billingPeriods;
  const total = items.reduce((sum, item) => sum + pricePerCopy(books.get(item.bookId)) * item.quantity, 0);
  const copies = items.reduce((sum, item) => sum + item.quantity, 0);
  const pendingPayment = payments.some(payment => payment.status === 'PENDING');

  async function refresh() {
    try {
      const list = await api.payments();
      setPayments(list);
      let attempt;
      try { attempt = JSON.parse(localStorage.getItem(cartKey(email) + ':checkout') || 'null'); } catch {}
      const payment = list.find(item => item.requestKey === attempt?.id);
      if (payment && ['PAID', 'UNPAID'].includes(payment.status)) {
        if (clearMatchedCart(email, JSON.parse(attempt.payload).items)) setItems([]);
        localStorage.removeItem(cartKey(email) + ':checkout');
      }
      setMessage('Đã cập nhật trạng thái thanh toán.');
    } catch (error) { setMessage(error.message); }
  }

  async function checkout() {
    if (lock.current) return;
    if (!Number.isInteger(days) || days < 1 || days > 365) { setMessage('Thời hạn mượn phải từ 1 đến 365 ngày.'); return; }
    lock.current = true; setBusy(true); setMessage('');
    try {
      const payload = JSON.stringify({ days, items });
      const attempt = checkoutAttempt(email, payload, method);
      const result = await api.checkout(method, JSON.parse(payload), attempt.id);
      if (method === 'VNPAY') {
        const url = new URL(result.url);
        if (url.protocol !== 'https:') throw Error('Địa chỉ thanh toán không hợp lệ.');
        window.location.assign(url.href);
        return;
      }
      if (clearMatchedCart(email, items)) setItems([]);
      setMessage(`Đã tạo phiếu #${result.loanId}. Thanh toán ${money(result.amount)} tại thư viện.`);
      await refresh();
    } catch (error) { setMessage(error.message); }
    finally { lock.current = false; setBusy(false); }
  }

  return <>
    <div className="cart-policy-note"><ShieldCheck size={17}/><span>Phí cơ bản áp dụng cho mỗi quyển trong 14 ngày. Mượn thêm ngày sẽ tính thêm theo từng chu kỳ 14 ngày; sách chưa được giữ cho đến khi yêu cầu được xác nhận.</span></div>
    {message && <div className={message.startsWith('Đã tạo') ? 'cart-feedback cart-feedback-success' : 'cart-feedback'} role="status">{message}{message.startsWith('Đã tạo') && <Link href="/account/loans">Theo dõi phiếu mượn <ArrowRight size={15}/></Link>}</div>}
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
              <div className="cart-item-price"><small>PHÍ / QUYỂN / 14 NGÀY</small><strong>{money(book?.rentalPrice)}</strong></div>
              <div className="cart-item-quantity"><small>SỐ LƯỢNG</small><div className="cart-quantity-stepper"><button type="button" aria-label={'Giảm số lượng ' + (book?.title || '')} disabled={busy || item.quantity <= 1} onClick={() => update(items.map(current => current.bookId === item.bookId ? { ...current, quantity: Math.max(1, current.quantity - 1) } : current))}><Minus size={14}/></button><span>{item.quantity}</span><button type="button" aria-label={'Tăng số lượng ' + (book?.title || '')} disabled={busy || item.quantity >= (maxQuantity || 1)} onClick={() => update(items.map(current => current.bookId === item.bookId ? { ...current, quantity: current.quantity + 1 } : current))}><Plus size={14}/></button></div></div>
              <div className="cart-item-total"><small>THÀNH TIỀN</small><strong>{money(pricePerCopy(book) * item.quantity)}</strong></div>
              <button className="cart-remove" type="button" aria-label={'Xóa ' + (book?.title || 'sách')} disabled={busy} onClick={() => update(items.filter(current => current.bookId !== item.bookId))}><Trash2 size={15}/><span>Xóa sách</span></button>
            </article>;
          })}</div>
          <button type="button" className="cart-clear-button" disabled={busy} onClick={() => update([])}><Trash2 size={14}/> Xóa toàn bộ giỏ</button>
        </> : <div className="cart-empty"><span><ShoppingBag size={28}/></span><h3>Giỏ mượn đang trống</h3><p>Thêm sách bạn muốn đọc vào đây. Bạn có thể xem số lượng còn trước khi gửi yêu cầu mượn.</p><Link href="/books" className="primary-button">Khám phá sách <ArrowRight size={16}/></Link></div>}
      </section>

      <aside className="cart-checkout-panel">
        <div className="cart-panel-heading"><div><span className="eyebrow">TÓM TẮT</span><h2>Thông tin mượn</h2></div></div>
        <label className="cart-form-field"><span><Clock3 size={15}/> Thời hạn mượn</span><select value={days} disabled={busy} onChange={event => setDays(Number(event.target.value))}>{Array.from({ length: 26 }, (_, index) => (index + 1) * 14).map(value => <option key={value} value={value}>{value} ngày · {value / 14} chu kỳ</option>)}</select><small>{billingPeriods} chu kỳ tính phí × 14 ngày; mỗi chu kỳ tính trọn phí.</small></label>
        <fieldset className="cart-payment-options"><legend>Phương thức thanh toán</legend><label className={method === 'CASH' ? 'payment-option selected' : 'payment-option'}><input type="radio" name="payment" value="CASH" checked={method === 'CASH'} disabled={busy} onChange={() => setMethod('CASH')}/><span className="payment-method-icon"><Banknote size={18}/></span><span><b>Thanh toán tại thư viện</b><small>Thanh toán trực tiếp tại quầy</small></span><i/></label><label className={method === 'VNPAY' ? 'payment-option selected' : 'payment-option'}><input type="radio" name="payment" value="VNPAY" checked={method === 'VNPAY'} disabled={busy} onChange={() => setMethod('VNPAY')}/><span className="payment-method-icon"><CreditCard size={18}/></span><span><b>VNPay</b><small>Chuyển đến cổng thanh toán an toàn</small></span><i/></label></fieldset>
        <div className="cart-total-lines"><div><span>{copies} quyển sách</span><strong>{money(total)}</strong></div><div><span>Thời hạn</span><strong>{days} ngày</strong></div><div><span>Chu kỳ tính phí</span><strong>{billingPeriods} × 14 ngày</strong></div></div>
        <div className="cart-total"><span>Tổng phí mượn</span><strong>{money(total)}</strong></div>
        {!valid && items.length > 0 && <p className="cart-validation" role="alert">Có sách không đủ số lượng hoặc không còn khả dụng. Vui lòng chỉnh lại giỏ.</p>}
        {pendingPayment && <p className="cart-pending-note"><Clock3 size={15}/> Bạn có giao dịch đang chờ. Hãy kiểm tra trạng thái trước khi tạo giao dịch mới.</p>}
        <button className="primary-button cart-checkout-button" disabled={!valid || busy || pendingPayment} onClick={checkout}>{busy ? 'Đang xử lý…' : pendingPayment ? 'Đang chờ thanh toán' : 'Xác nhận mượn'} <ArrowRight size={17}/></button>
        <p className="cart-secure-note"><ShieldCheck size={15}/> Chưa phát sinh thanh toán cho đến khi xác nhận.</p>
      </aside>
    </div>

    <section className="payment-history">
      <header><div><span className="eyebrow">LỊCH SỬ GIAO DỊCH</span><h2>Theo dõi thanh toán</h2><p>Trạng thái giao dịch được đồng bộ trực tiếp từ máy chủ.</p></div><button className="secondary-button" disabled={busy} onClick={refresh}><RefreshCw size={15}/> Kiểm tra trạng thái</button></header>
      {payments.length ? <div className="payment-list">{payments.map(payment => <article className="payment-row" key={payment.id}><span className="payment-method-icon">{payment.method === 'CASH' ? <Banknote size={19}/> : <CreditCard size={19}/>}</span><div className="payment-row-info"><b>{payment.method === 'CASH' ? 'Thanh toán tại thư viện' : 'Thanh toán VNPay'}</b><small>Mã giao dịch {payment.transactionNo || payment.id} · {payment.createdAt ? new Date(payment.createdAt).toLocaleString('vi-VN') : 'Thời gian chưa cập nhật'}</small></div><strong>{money(payment.amount)}</strong><span className={'payment-status ' + (payment.status === 'PAID' ? 'payment-status-done' : payment.status === 'FAILED' ? 'payment-status-failed' : 'payment-status-wait')}>{statuses[payment.status] || payment.status}</span>{payment.loanId && <Link href="/account/loans">Phiếu #{payment.loanId}</Link>}</article>)}</div> : <div className="payment-empty"><CheckCircle2 size={18}/><span>Chưa có giao dịch thanh toán nào.</span></div>}
      {message && !message.startsWith('Đã tạo') && <p className="payment-refresh-message" role="status">{message}</p>}
    </section>
  </>;
}
