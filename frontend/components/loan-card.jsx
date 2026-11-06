"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CalendarDays, CheckCircle2, Clock3, RefreshCw, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import { money } from './account-data';

const date = value => value ? String(value).split('-').reverse().join('/') : '—';
const today = () => new Date().toLocaleDateString('sv-SE');

export default function LoanCard({ loan, history, reload }) {
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const remaining = (loan.items || []).filter(item => !item.returnedAt);
  const requestable = remaining.filter(item => !item.returnRequestedAt);
  const awaiting = remaining.some(item => item.returnRequestedAt);
  const overdue = loan.status === 'OVERDUE' || loan.dueDate < today();

  async function run(action, successMessage = 'Đã cập nhật phiếu.') {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await action();
      await reload();
      setMessage(successMessage);
    } catch (error) {
      setMessage(error.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function requestReturn(ids) {
    if (!confirm('Gửi yêu cầu trả các quyển đã chọn để thư viện kiểm tra?')) return;
    run(() => api.returnLoan(loan.id, ids || requestable.map(item => item.id)),
      'Đã gửi yêu cầu trả sách. Vui lòng mang sách đến thư viện để kiểm tra và chờ duyệt.');
  }

  return <article className={history ? 'loan-card loan-history-card' : 'loan-card'}>
    <header className="loan-card-heading">
      <div><span className="loan-card-kicker">PHIẾU MƯỢN #{loan.id}</span><h3>{loan.items?.length || 0} quyển sách</h3></div>
      <span className={'loan-status-pill ' + (history ? 'loan-status-done' : overdue ? 'loan-status-late' : 'loan-status-active')}>
        {history ? <CheckCircle2 size={15}/> : overdue ? <Clock3 size={15}/> : <BookOpen size={15}/>}
        {history ? 'Đã trả' : awaiting ? 'Chờ duyệt trả' : overdue ? 'Quá hạn' : 'Đang mượn'}
      </span>
    </header>
    <div className="loan-dates loan-card-dates">
      <div><small>NGÀY MƯỢN</small><b>{date(loan.borrowDate)}</b></div>
      <div><small>HẠN TRẢ</small><b>{date(loan.dueDate)}</b></div>
      {history && <div><small>NGÀY HOÀN TẤT</small><b>{date(loan.returnDate)}</b></div>}
      <div><small>PHÍ MƯỢN</small><b><Wallet size={14}/>{money(loan.rentalFee)}</b></div>
    </div>
    <div className="loan-books-table utility-table-wrap">
      <table className="utility-table">
        <thead><tr><th>Sách</th><th>Mã quyển</th><th>Trạng thái</th>{!history && <th>Thao tác</th>}</tr></thead>
        <tbody>{(loan.items || []).map(item => <tr key={item.id}>
          <td><Link href={'/books/' + item.book?.id}>{item.book?.title || 'Sách trong thư viện'}</Link></td>
          <td>{item.copy?.code || '—'}</td>
          <td><span className={item.returnedAt ? 'copy-returned' : 'copy-borrowed'}>
            {item.returnedAt ? 'Đã trả ' + date(item.returnedAt) : item.returnRequestedAt ? 'Chờ kiểm tra và duyệt trả' : 'Đang mượn'}
          </span></td>
          {!history && <td>{!item.returnedAt && !item.returnRequestedAt &&
            <button className="return-one-button" disabled={busy} onClick={() => requestReturn([item.id])}>
              <RefreshCw size={14} aria-hidden="true"/>Yêu cầu trả
            </button>}
          </td>}
        </tr>)}</tbody>
      </table>
    </div>
    {!history && <footer className="loan-card-actions">
      <div className="loan-return-group">
        <button className="primary-button" disabled={busy || !requestable.length} onClick={() => requestReturn()}>
          <RefreshCw size={15} aria-hidden="true"/>Yêu cầu trả còn lại ({requestable.length})
        </button>
        <small>Đã trả {(loan.items?.length || 0) - remaining.length}/{loan.items?.length || 0} quyển</small>
      </div>
      {!awaiting && !overdue && Number(loan.renewalCount || 0) < 1 && <div className="renew-controls">
        <label>Gia hạn<select aria-label="Gia hạn" value={days} disabled={busy} onChange={event => setDays(Number(event.target.value))}>
          {[1, 2, 3, 4, 5, 6, 7].map(value => <option key={value} value={value}>{value} ngày</option>)}
        </select></label>
        <button disabled={busy} onClick={() => {
          if (confirm('Gia hạn ' + days + ' ngày?')) run(() => api.renew(loan.id, days));
        }}><CalendarDays size={15} aria-hidden="true"/>Xác nhận gia hạn</button>
      </div>}
      {Number(loan.renewalCount || 0) >= 1 && <span className="renew-used">Đã sử dụng lượt gia hạn</span>}
    </footer>}
    {message && <p className="loan-action-message" role="status">{message}</p>}
  </article>;
}
