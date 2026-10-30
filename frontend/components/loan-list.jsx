'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, CircleAlert, Clock3, History, RefreshCw } from 'lucide-react';
import { api, formatApiError } from '../lib/api';

const date = (v) => v ? new Date(v + 'T00:00:00').toLocaleDateString('vi-VN') : '—';
const money = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v || 0));

export default function LoanList({ showHistory = false }) {
  const router = useRouter(); const [loans, setLoans] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const refresh = () => {
    if (!localStorage.getItem('library_token')) { router.push('/login'); return; }
    setLoading(true); setError('');
    api.loans().then(data => setLoans(Array.isArray(data) ? data : [])).catch(e => setError(formatApiError(e))).finally(() => setLoading(false));
  };
  useEffect(() => { refresh(); }, []);
  const shown = loans.filter(loan => showHistory ? loan.status === 'RETURNED' : loan.status === 'BORROWED' || loan.status === 'OVERDUE');
  return <main className="account-page container"><div className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><b>Tài khoản</b></div><section className="page-heading account-heading"><span className="eyebrow"><span className="eyebrow-line"/> GÓC CỦA BẠN</span><h1>{showHistory ? <>Những trang sách<br/><em>đã đi qua.</em></> : <>Hành trình đọc<br/><em>của bạn.</em></>}</h1><p>{showHistory ? 'Những phiếu mượn đã hoàn thành và các cuốn sách bạn đã đọc.' : 'Theo dõi những cuốn sách đang ở bên bạn và ngày hẹn trả.'}</p></section><div className="account-tabs"><Link className={!showHistory ? 'tab-current' : ''} href="/account/loans"><Clock3 size={16}/> Đang mượn <b>{loans.filter(x => x.status === 'BORROWED' || x.status === 'OVERDUE').length}</b></Link><Link className={showHistory ? 'tab-current' : ''} href="/account/history"><History size={16}/> Lịch sử</Link></div>{loading ? <div className="state-panel"><div className="spinner"/><p>Đang gọi <code>GET /api/v1/loans/my-loans</code>…</p></div> : error ? <div className="state-panel"><CircleAlert/><h2>Chưa tải được phiếu mượn</h2><p>{error}</p><button className="primary-button" onClick={refresh}><RefreshCw size={15}/> Thử lại</button></div> : shown.length === 0 ? <div className="state-panel"><BookOpen/><h2>{showHistory ? 'Chưa có lịch sử mượn sách' : 'Bạn chưa có sách đang mượn'}</h2><p>{showHistory ? 'Các phiếu mượn đã hoàn thành sẽ được lưu lại tại đây.' : 'Khi bạn tạo phiếu mượn, sách và hạn trả sẽ xuất hiện ở đây.'}</p><Link className="primary-button" href="/books">Khám phá sách <ArrowRight size={16}/></Link></div> : <div className="loan-list">{shown.map(loan => <article className="loan-card" key={loan.id}><div className="loan-top"><div><small>PHIẾU MƯỢN</small><h3>#{loan.id}</h3></div><span className={loan.status === 'OVERDUE' ? 'status-badge status-overdue' : 'status-badge'}>{loan.status === 'OVERDUE' ? 'Quá hạn' : loan.status === 'RETURNED' ? 'Đã trả' : 'Đang mượn'}</span></div><div className="loan-dates"><div><small>NGÀY MƯỢN</small><b>{date(loan.borrowDate)}</b></div><div><small>HẠN TRẢ</small><b>{date(loan.dueDate)}</b></div><div><small>PHÍ MƯỢN</small><b>{money(loan.rentalFee)}</b></div></div><div className="loan-items">{(loan.items || []).map(item => <div key={item.id}><BookOpen size={16}/><span>{item.book?.title || 'Đầu sách'}<small>{item.copy?.code || 'Mã quyển đang cập nhật'}</small></span><b>×{item.quantity || 1}</b></div>)}</div></article>)}</div>}</main>;
}
