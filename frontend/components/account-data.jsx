'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, BookOpen, CircleCheck, Clock3, RefreshCw, Wallet, X } from 'lucide-react';
import { api } from '../lib/api';

export function useAccount(loader) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const reload = useCallback(async () => {
    setBusy(true);
    try { setData(await loader()); setError(''); }
    catch (issue) { setError(issue.message); }
    finally { setBusy(false); }
  }, [loader]);
  useEffect(() => {
    let active = true;
    loader().then(value => { if (active) setData(value); }).catch(issue => { if (active) setError(issue.message); });
    return () => { active = false; };
  }, [loader]);
  return { data, error, setError, busy, reload, setData };
}

export function AccountState({ data, error }) {
  if (error) return <p role="alert" className="error-alert">{error}</p>;
  if (data === null) return <div className="account-loading" role="status"><span className="spinner"/><span>Đang tải thông tin tài khoản…</span><Link href="/login">Đăng nhập nếu chưa có tài khoản</Link></div>;
  return null;
}

export const money = value => Number(value || 0).toLocaleString('vi-VN') + ' đ';

export default function AccountData() {
  const { data, error, reload, busy } = useAccount(loadExtras);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const timer = setInterval(() => { if (!document.hidden) reload(); }, 10000);
    return () => clearInterval(timer);
  }, [reload]);
  return <section className="account-extra account-updates">
    <header className="account-updates-heading"><div><span className="eyebrow">CẬP NHẬT CỦA BẠN</span><h2>Thông tin thư viện</h2><p>Thông báo, sách chờ và các khoản cần theo dõi được tổng hợp tại đây.</p></div><button className="account-refresh account-refresh-small" onClick={reload} disabled={busy}><RefreshCw size={15} className={busy ? 'refresh-spinning' : ''}/>{busy ? 'Đang tải' : 'Cập nhật'}</button></header>
    <AccountState data={data} error={error}/>
    {message && <p role="status" className="account-update-message">{message}</p>}
    {data && <div className="account-update-grid">
      <section className="account-update-card"><header><span className="account-update-icon"><Bell size={18}/></span><div><h3>Thông báo</h3><small>{data.notices.length ? `${data.notices.length} cập nhật mới` : 'Tin mới từ thư viện'}</small></div></header>{data.notices.length ? <ul>{data.notices.map((notice, index) => <li key={index}><Link href={notice.href.replace('/user/borrowed','/account/loans').replace('/user/books','/books')}>{notice.message}</Link></li>)}</ul> : <p className="account-update-empty"><CircleCheck size={16}/> Bạn đã cập nhật mọi thứ.</p>}</section>
      <section className="account-update-card"><header><span className="account-update-icon"><BookOpen size={18}/></span><div><h3>Sách đăng ký chờ</h3><small>{data.reservations.length ? `${data.reservations.length} đầu sách` : 'Theo dõi sách tạm hết'}</small></div></header>{data.reservations.length ? <ul>{data.reservations.map(reservation => <li className="reservation-row" key={reservation.id}><div><Link href={'/books/' + reservation.book.id}>{reservation.book.title}</Link><small>{reservation.book.availableQuantity > 0 ? 'Đã có sách' : 'Đang chờ sách'}</small></div><button aria-label={'Hủy đăng ký ' + reservation.book.title} onClick={async event => { const button = event.currentTarget; button.disabled = true; try { await api.cancelReservation(reservation.book.id); await reload(); } catch (issue) { setMessage(issue.message); } finally { button.disabled = false; } }}><X size={15}/></button></li>)}</ul> : <p className="account-update-empty"><BookOpen size={16}/> Bạn chưa đăng ký chờ sách.</p>}</section>
      <section className="account-update-card"><header><span className="account-update-icon"><Wallet size={18}/></span><div><h3>Khoản phạt</h3><small>{data.fines.length ? `${data.fines.length} khoản cần kiểm tra` : 'Tình trạng phí của bạn'}</small></div></header>{data.fines.length ? <ul>{data.fines.map(fine => <li key={fine.id}><div><Link href="/account/loans">Phiếu mượn #{fine.loan?.id || '—'}</Link><small>{fine.reason}</small></div><span className={fine.paid ? 'fine-paid' : 'fine-unpaid'}>{money(fine.amount)}<small>{fine.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</small></span></li>)}</ul> : <p className="account-update-empty"><CircleCheck size={16}/> Hiện không có khoản phạt.</p>}</section>
    </div>}
  </section>;
}

async function loadExtras() {
  const [notices, reservations, fines] = await Promise.all([api.notifications(), api.reservations(), api.fines()]);
  return { notices, reservations, fines };
}
