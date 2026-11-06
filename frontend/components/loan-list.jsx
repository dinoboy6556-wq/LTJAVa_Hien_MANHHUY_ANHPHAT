'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, History, RefreshCw, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import LoanCard from './loan-card';
import BorrowingPolicy from './borrowing-policy';
import AccountData, { useAccount, AccountState } from './account-data';

const today = () => new Date().toLocaleDateString('sv-SE');

export default function LoanList({ showHistory = false }) {
  const { data, error, reload, busy } = useAccount(api.loans);
  const [returnNotice, setReturnNotice] = useState('');
  const pending = useRef(new Set());
  useEffect(() => {
    if (!data) return;
    const items = data.flatMap(loan => loan.items || []);
    if (items.some(item => item.returnedAt && pending.current.has(item.id)))
      setReturnNotice('Trả sách thành công. Thư viện đã kiểm tra và duyệt yêu cầu của bạn.');
    pending.current = new Set(items.filter(item => !item.returnedAt && item.returnRequestedAt).map(item => item.id));
  }, [data]);
  useEffect(() => {
    if (showHistory) return;
    const timer = setInterval(() => { if (!document.hidden) reload(); }, 10000);
    return () => clearInterval(timer);
  }, [reload, showHistory]);
  const records = useMemo(() => (data || []).filter(loan => showHistory ? loan.status === 'RETURNED' : loan.status !== 'RETURNED'), [data, showHistory]);
  const copyCount = records.reduce((sum, loan) => sum + (loan.items || []).filter(item => showHistory || !item.returnedAt).length, 0);
  const overdueCount = records.filter(loan => !showHistory && (loan.status === 'OVERDUE' || loan.dueDate < today())).length;
  const comingDue = records.filter(loan => !showHistory && loan.dueDate >= today()).length;

  return <main className="container utility-page account-loans-page">
    <nav className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><b>Tài khoản bạn đọc</b></nav>
    <header className="account-loans-hero">
      <div><span className="eyebrow"><span className="eyebrow-line"/> GÓC BẠN ĐỌC</span><h1>{showHistory ? 'Hành trình đã đọc' : 'Sách bạn đang mượn'}</h1><p>{showHistory ? 'Những cuốn sách đã đồng hành cùng bạn qua các trang đọc.' : 'Theo dõi sách đang mượn, thời hạn trả và các cập nhật từ thư viện.'}</p></div>
      <button className="secondary-button account-refresh" onClick={reload} disabled={busy}><RefreshCw size={16} className={busy ? 'refresh-spinning' : ''}/>{busy ? 'Đang cập nhật' : 'Làm mới'}</button>
    </header>
    <nav className="account-tabs account-loans-tabs" aria-label="Lịch sử mượn sách"><Link className={!showHistory ? 'tab-current' : ''} href="/account/loans"><BookOpen size={17}/> Đang mượn</Link><Link className={showHistory ? 'tab-current' : ''} href="/account/history"><History size={17}/> Lịch sử đã trả</Link></nav>
    {data && <div className="loan-overview" aria-label="Tổng quan mượn sách"><article><span className="loan-overview-icon"><BookOpen size={19}/></span><div><small>{showHistory ? 'PHIẾU ĐÃ TRẢ' : 'PHIẾU ĐANG MƯỢN'}</small><strong>{records.length}</strong><span>phiếu sách</span></div></article><article><span className="loan-overview-icon"><Sparkles size={19}/></span><div><small>{showHistory ? 'SỐ QUYỂN ĐÃ ĐỌC' : 'SỐ QUYỂN ĐANG GIỮ'}</small><strong>{copyCount}</strong><span>quyển sách</span></div></article><article><span className={'loan-overview-icon ' + (overdueCount ? 'loan-icon-alert' : '')}>{overdueCount ? <Clock3 size={19}/> : showHistory ? <CheckCircle2 size={19}/> : <CalendarDays size={19}/>}</span><div><small>{showHistory ? 'TÌNH TRẠNG' : overdueCount ? 'CẦN LƯU Ý' : 'THEO DÕI HẠN TRẢ'}</small><strong>{showHistory ? 'Hoàn tất' : overdueCount ? overdueCount : comingDue}</strong><span>{showHistory ? 'các phiếu đã trả' : overdueCount ? 'phiếu quá hạn' : 'phiếu còn hạn'}</span></div></article></div>}
    {returnNotice && <p className="loan-action-message" role="status">{returnNotice}</p>}
    <AccountState data={data} error={error}/>
    {data && (records.length ? <section className="loan-records"><div className="loan-section-heading"><div><span className="eyebrow">{showHistory ? 'KHOẢNH KHẮC ĐÃ QUA' : 'ĐANG ĐỒNG HÀNH'}</span><h2>{showHistory ? 'Các phiếu đã hoàn tất' : 'Chi tiết phiếu mượn'}</h2></div><span>{records.length} phiếu</span></div><div className="loan-list">{records.map(loan => <LoanCard key={loan.id} loan={loan} history={showHistory} reload={reload}/>)}</div></section> : <section className="loan-empty"><span className="loan-empty-icon">{showHistory ? <History size={27}/> : <BookOpen size={27}/>}</span><span className="eyebrow">{showHistory ? 'MỖI CUỐN SÁCH LÀ MỘT KỶ NIỆM' : 'SẴN SÀNG CHO CUỐN SÁCH ĐẦU TIÊN?'}</span><h2>{showHistory ? 'Chưa có lịch sử mượn trả' : 'Bạn chưa mượn cuốn sách nào'}</h2><p>{showHistory ? 'Khi bạn hoàn tất trả sách, thông tin sẽ được lưu tại đây để tiện xem lại.' : 'Khám phá bộ sưu tập của Mộc, chọn một cuốn sách và bắt đầu hành trình đọc của bạn.'}</p><Link href="/books" className="primary-button">Khám phá sách <ArrowRight size={17}/></Link></section>)}
    {!showHistory && <><BorrowingPolicy/><AccountData/></>}
  </main>;
}
