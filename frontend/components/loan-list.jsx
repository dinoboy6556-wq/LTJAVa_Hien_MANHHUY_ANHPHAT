'use client';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, History, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import { api } from '../lib/api';
import AccountData, { useAccount, AccountState, money } from './account-data';

const date = value => value ? String(value).split('-').reverse().join('/') : '—';
const today = () => new Date().toLocaleDateString('sv-SE');

export default function LoanList({ showHistory = false }) {
  const { data, error, reload, busy } = useAccount(api.loans);
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
    <AccountState data={data} error={error}/>
    {data && (records.length ? <section className="loan-records"><div className="loan-section-heading"><div><span className="eyebrow">{showHistory ? 'KHOẢNH KHẮC ĐÃ QUA' : 'ĐANG ĐỒNG HÀNH'}</span><h2>{showHistory ? 'Các phiếu đã hoàn tất' : 'Chi tiết phiếu mượn'}</h2></div><span>{records.length} phiếu</span></div><div className="loan-list">{records.map(loan => <LoanCard key={loan.id} loan={loan} history={showHistory} reload={reload}/>)}</div></section> : <section className="loan-empty"><span className="loan-empty-icon">{showHistory ? <History size={27}/> : <BookOpen size={27}/>}</span><span className="eyebrow">{showHistory ? 'MỖI CUỐN SÁCH LÀ MỘT KỶ NIỆM' : 'SẴN SÀNG CHO CUỐN SÁCH ĐẦU TIÊN?'}</span><h2>{showHistory ? 'Chưa có lịch sử mượn trả' : 'Bạn chưa mượn cuốn sách nào'}</h2><p>{showHistory ? 'Khi bạn hoàn tất trả sách, thông tin sẽ được lưu tại đây để tiện xem lại.' : 'Khám phá bộ sưu tập của Mộc, chọn một cuốn sách và bắt đầu hành trình đọc của bạn.'}</p><Link href="/books" className="primary-button">Khám phá sách <ArrowRight size={17}/></Link></section>)}
    {!showHistory && <AccountData/>}
  </main>;
}

function LoanCard({ loan, history, reload }) {
  const [days, setDays] = useState(7), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const lock = useRef(false);
  const remaining = (loan.items || []).filter(item => !item.returnedAt);
  const overdue = loan.status === 'OVERDUE' || loan.dueDate < today();
  async function run(action) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await action(); await reload(); setMessage('Đã cập nhật phiếu.'); }
    catch (error) { setMessage(error.message); }
    finally { lock.current = false; setBusy(false); }
  }
  function returnItems(ids) {
    if (!confirm(ids ? 'Xác nhận trả quyển đã chọn?' : 'Xác nhận trả tất cả quyển còn lại?')) return;
    run(() => api.returnLoan(loan.id, ids));
  }
  return <article className="loan-card"><header className="loan-card-heading"><div><span className="loan-card-kicker">PHIẾU MƯỢN #{loan.id}</span><h3>{loan.items?.length || 0} quyển sách</h3></div><span className={'loan-status-pill ' + (history ? 'loan-status-done' : overdue ? 'loan-status-late' : 'loan-status-active')}>{history ? <CheckCircle2 size={15}/> : overdue ? <Clock3 size={15}/> : <BookOpen size={15}/>} {history ? 'Đã trả' : overdue ? 'Quá hạn' : 'Đang mượn'}</span></header>
    <div className="loan-dates loan-card-dates"><div><small>NGÀY MƯỢN</small><b>{date(loan.borrowDate)}</b></div><div><small>{history ? 'HẠN TRẢ' : 'HẠN TRẢ'}</small><b>{date(loan.dueDate)}</b></div>{history && <div><small>NGÀY HOÀN TẤT</small><b>{date(loan.returnDate)}</b></div>}<div><small>PHÍ MƯỢN</small><b><Wallet size={14}/>{money(loan.rentalFee)}</b></div></div>
    <div className="loan-books-table utility-table-wrap"><table className="utility-table"><thead><tr><th>Sách</th><th>Mã quyển</th><th>Trạng thái</th>{!history && <th>Thao tác</th>}</tr></thead><tbody>{(loan.items || []).map(item => <tr key={item.id}><td><Link href={'/books/' + item.book?.id}>{item.book?.title || 'Sách trong thư viện'}</Link></td><td>{item.copy?.code || '—'}</td><td><span className={item.returnedAt ? 'copy-returned' : 'copy-borrowed'}>{item.returnedAt ? 'Đã trả ' + date(item.returnedAt) : 'Đang mượn'}</span></td>{!history && <td>{!item.returnedAt && <button className="return-one-button" disabled={busy} onClick={() => returnItems([item.id])}>Trả quyển này</button>}</td>}</tr>)}</tbody></table></div>
    {!history && <footer className="loan-card-actions"><button className="primary-button" disabled={busy || !remaining.length} onClick={() => returnItems()}>Trả tất cả còn lại ({remaining.length})</button>{!overdue && Number(loan.renewalCount || 0) < 1 && <div className="renew-controls"><label>Gia hạn<select aria-label="Gia hạn" value={days} disabled={busy} onChange={event => setDays(Number(event.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map(value => <option key={value} value={value}>{value} ngày</option>)}</select></label><button disabled={busy} onClick={() => { if (confirm(`Gia hạn ${days} ngày?`)) run(() => api.renew(loan.id, days)); }}>Xác nhận gia hạn</button></div>}{Number(loan.renewalCount || 0) >= 1 && <span className="renew-used">Đã sử dụng lượt gia hạn</span>}</footer>}
    {message && <p className="loan-action-message" role="status">{message}</p>}
  </article>;
}
