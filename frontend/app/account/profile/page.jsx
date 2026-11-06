'use client';
import {useRef,useState} from 'react';
import Link from 'next/link';
import {UserRound,BookOpen,Heart,Clock3,Wallet,ChevronRight,ShoppingCart,History,ShieldCheck} from 'lucide-react';
import {api} from '../../../lib/api';
import {useAccount,AccountState,money} from '../../../components/account-data';

const roleLabels={ROLE_ADMIN:'Quản trị viên',ROLE_LIBRARIAN:'Thủ thư',ROLE_USER:'Độc giả'};
const paymentLabels={UNPAID:'Chờ thu tại quầy',PENDING:'Chờ xác nhận',PAID:'Đã thanh toán',FAILED:'Không thành công',REVIEW_REQUIRED:'Cần thư viện xử lý'};
const date=value=>value?String(value).split('-').reverse().join('/'):'—';
async function loadProfile(){
 const profile=await api.profile();
 const results=await Promise.allSettled([api.loans(),api.favorites(),api.fines(),api.payments(),api.reservations()]);
 return {profile,...Object.fromEntries(['loans','favorites','fines','payments','reservations'].map((key,index)=>[key,results[index].status==='fulfilled'?results[index].value:null]))};
}
export default function Profile(){
 const {data,error,setData,reload,busy}=useAccount(loadProfile);
 return <main className="container utility-page profile-page"><nav className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><b>Hồ sơ cá nhân</b></nav><div className="profile-heading"><div><span className="eyebrow">GÓC CỦA BẠN</span><h1>Hồ sơ cá nhân</h1><p>Quản lý thông tin và theo dõi hành trình đọc tại Mộc.</p></div><button className="secondary-button" onClick={reload} disabled={busy}>{busy?'Đang cập nhật…':'Làm mới tổng quan'}</button></div><AccountState data={data} error={error}/>{data&&<ProfileContent data={data} onSave={profile=>setData(current=>({...current,profile}))}/>}</main>;
}
function ProfileContent({data,onSave}){
 const {profile,loans,favorites,fines,payments,reservations}=data;
 const active=loans?.filter(l=>l.status!=='RETURNED'),today=new Date().toLocaleDateString('sv-SE');
 const overdue=active?.filter(l=>l.status==='OVERDUE'||l.dueDate<today);
 const count=active?.reduce((sum,l)=>sum+(l.items||[]).filter(i=>!i.returnedAt).reduce((n,i)=>n+Number(i.quantity||1),0),0);
 const unpaid=fines?.filter(f=>!f.paid).reduce((sum,f)=>sum+Number(f.amount||0),0);
 const due=[...(active||[])].sort((a,b)=>String(a.dueDate).localeCompare(String(b.dueDate))).slice(0,3);
 const completed=[profile.fullName,profile.phone,profile.address].filter(v=>v?.trim()).length;
 const stats=[{label:'Quyển đang mượn',value:count??'—',icon:BookOpen,href:'/account/loans'}, {label:'Sách yêu thích',value:favorites?.length??'—',icon:Heart,href:'/account/favorites'}, {label:'Phiếu quá hạn',value:overdue?.length??'—',icon:Clock3,href:'/account/loans'}, {label:'Phạt chưa thanh toán',value:fines?money(unpaid):'—',icon:Wallet,href:'/account/loans'}];
 return <><div className="profile-stats">{stats.map(({label,value,icon:Icon,href})=><Link href={href} className="profile-stat" key={label}><Icon size={20} aria-hidden="true"/><strong>{value}</strong><span>{label}</span></Link>)}</div><div className="profile-layout"><aside className="profile-sidebar"><section className="profile-panel identity-panel"><div className="profile-avatar" aria-hidden="true">{(profile.fullName?.trim()||profile.email||'M').slice(0,1).toUpperCase()}</div><h2>{profile.fullName}</h2><p className="profile-email">{profile.email}</p><div className="profile-roles">{profile.roles?.map(r=><span key={r}>{roleLabels[r]||r}</span>)}</div><div className="profile-completion"><div><span>Thông tin cá nhân</span><b>{completed}/3</b></div><progress aria-label="Mức hoàn thiện thông tin cá nhân" max="3" value={completed}/><small>{completed===3?'Bạn đã bổ sung đầy đủ thông tin liên hệ.':'Bổ sung điện thoại và địa chỉ để thư viện liên hệ khi cần.'}</small></div></section><nav className="profile-panel profile-shortcuts" aria-label="Tiện ích tài khoản"><h2>Tiện ích tài khoản</h2>{[[ShoppingCart,'Giỏ mượn','/cart'],[BookOpen,'Sách đang mượn','/account/loans'],[Heart,'Sách yêu thích','/account/favorites'],[History,'Lịch sử mượn','/account/history']].map(([Icon,label,href])=><Link href={href} key={href}><Icon size={18} aria-hidden="true"/>{label}<ChevronRight size={16} aria-hidden="true"/></Link>)}</nav></aside><div className="profile-main"><ProfileForm key={profile.email} profile={profile} onSave={onSave}/><PasswordChangeForm /><section className="profile-panel"><div className="profile-panel-title"><div><h2><Clock3 size={20}/> Hạn trả gần nhất</h2><p>Theo dõi phiếu đang mượn để trả sách đúng hẹn.</p></div><Link href="/account/loans">Xem tất cả →</Link></div>{loans===null?<p className="profile-empty">Chưa tải được phiếu mượn. Nhấn làm mới tổng quan để thử lại.</p>:due.length?due.map(l=><Link className="profile-list-row" href="/account/loans" key={l.id}><div><b>Phiếu #{l.id}</b><span>{[...new Set((l.items||[]).filter(i=>!i.returnedAt).map(i=>i.book?.title).filter(Boolean))].join(' · ')}</span></div><span className={l.dueDate<today||l.status==='OVERDUE'?'profile-status overdue':'profile-status'}>Hạn trả {date(l.dueDate)}</span></Link>):<div className="profile-empty">Bạn chưa có sách đang mượn. <Link href="/books">Khám phá sách →</Link></div>}</section><section className="profile-panel"><div className="profile-panel-title"><div><h2><Wallet size={20}/> Thanh toán gần đây</h2><p>Phí mượn được ghi nhận theo từng phiếu.</p></div><Link href="/cart">Xem giao dịch →</Link></div>{payments===null?<p className="profile-empty">Chưa tải được giao dịch. Thông tin cá nhân vẫn có thể chỉnh sửa.</p>:payments.length?payments.slice(0,3).map(p=><div className="profile-list-row" key={p.id}><div><b>{p.loanId?'Phiếu #'+p.loanId:'Giao dịch '+p.id.slice(0,8)}</b><span>{p.method==='CASH'?'Thanh toán tại thư viện':'Chuyển khoản qua VNPay'}</span></div><div className="profile-payment-value"><b>{money(p.amount)}</b><span className="profile-status">{paymentLabels[p.status]||p.status}</span></div></div>):<p className="profile-empty">Chưa có giao dịch thanh toán.</p>}</section><section className="profile-panel account-info"><h2><ShieldCheck size={20}/> Thông tin tài khoản</h2><p>Email: {profile.email}</p><p>Vai trò: {profile.roles?.map(r=>roleLabels[r]||r).join(', ')}</p><p>Đăng ký chờ sách: {reservations===null?'Chưa tải được':reservations.length+' đầu sách'} · Phiếu đã hoàn trả: {loans===null?'Chưa tải được':loans.filter(l=>l.status==='RETURNED').length}</p><Link href="/account/loans">Xem thông báo, đăng ký chờ và khoản phạt →</Link></section></div></div></>;
}
function ProfileForm({profile,onSave}){
 const normalized=p=>({fullName:p.fullName||'',phone:p.phone||'',address:p.address||''});
 const [baseline,setBaseline]=useState(()=>normalized(profile)),[form,setForm]=useState(()=>normalized(profile)),[message,setMessage]=useState(''),[success,setSuccess]=useState(false),[busy,setBusy]=useState(false);const lock=useRef(false);
 const dirty=JSON.stringify(form)!==JSON.stringify(baseline);
 async function submit(e){e.preventDefault();if(lock.current||!dirty)return;if(!form.fullName.trim()){setSuccess(false);setMessage('Vui lòng nhập họ tên.');return;}if(!/^[0-9+() .-]*$/.test(form.phone)){setSuccess(false);setMessage('Điện thoại chỉ gồm chữ số và các ký tự + ( ) . - hoặc dấu cách.');return;}
  lock.current=true;setBusy(true);setMessage('');try{const updated=await api.updateProfile({fullName:form.fullName.trim(),phone:form.phone.trim(),address:form.address.trim()});const value=normalized(updated);setBaseline(value);setForm(value);onSave(updated);localStorage.setItem('library_user',JSON.stringify(updated));window.dispatchEvent(new Event('moc:session'));setSuccess(true);setMessage('Đã cập nhật hồ sơ.');}catch(e){setSuccess(false);setMessage(e.message);}finally{lock.current=false;setBusy(false);}
 }
 return <section className="profile-panel"><div className="profile-panel-title"><div><h2><UserRound size={20}/> Thông tin cá nhân</h2><p>Cập nhật dữ liệu liên hệ để thư viện thuận tiện hơn khi cần hỗ trợ.</p></div></div>{message&&<p className={success?'success-alert':'error-alert'} role={success?'status':'alert'}>{message}</p>}<form className="auth-form" onSubmit={submit}><label>Họ tên<input value={form.fullName} onChange={e=>setForm(current=>({...current,fullName:e.target.value}))}/></label><label>Email đăng nhập<input value={profile.email} readOnly/></label><label>Điện thoại<input value={form.phone} onChange={e=>setForm(current=>({...current,phone:e.target.value}))}/></label><label>Địa chỉ<input value={form.address} onChange={e=>setForm(current=>({...current,address:e.target.value}))}/></label><div className="utility-row"><button type="button" className="secondary-button" disabled={!dirty||busy} onClick={()=>{setForm({...baseline});setMessage('');setSuccess(false);}}>Hủy thay đổi</button><button className="primary-button" type="submit" disabled={!dirty||busy}>{busy?'Đang lưu…':'Lưu hồ sơ'}</button></div></form></section>;
}
function PasswordChangeForm(){
 const [form,setForm]=useState({currentPassword:'',newPassword:'',confirmPassword:'',otp:''});
 const [message,setMessage]=useState('');
 const [success,setSuccess]=useState(false);
 const [busy,setBusy]=useState(false);
 const [otpBusy,setOtpBusy]=useState(false);
 const email = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('library_user') || '{}')?.email || '' : '';
 async function sendOtp(){
  if(!email){setSuccess(false);setMessage('Không xác định được email tài khoản.');return;}
  setOtpBusy(true);setMessage('');
  try{
   await api.sendPasswordOtp();
   setSuccess(true);
   setMessage(`Mã OTP đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư Gmail thật.`);
  }catch(error){
   setSuccess(false);
   setMessage(error.message);
  }finally{setOtpBusy(false);}
 }
 async function submit(e){
  e.preventDefault();
  if(!form.currentPassword.trim()){setSuccess(false);setMessage('Vui lòng nhập mật khẩu hiện tại.');return;}
  if(form.newPassword.length < 8){setSuccess(false);setMessage('Mật khẩu mới phải có ít nhất 8 ký tự.');return;}
  if(form.newPassword !== form.confirmPassword){setSuccess(false);setMessage('Xác nhận mật khẩu mới không khớp.');return;}
  if(!/^\d{6}$/.test(form.otp)){setSuccess(false);setMessage('Vui lòng nhập mã OTP 6 chữ số đã gửi về Gmail của bạn.');return;}
  setBusy(true);setMessage('');
  try {
   await api.changePassword({currentPassword: form.currentPassword, newPassword: form.newPassword, otp: form.otp});
   setSuccess(true);
   setMessage('Đã đổi mật khẩu thành công. Mã OTP đã được xác nhận và mật khẩu mới đã được cập nhật.');
   setForm({currentPassword:'',newPassword:'',confirmPassword:'',otp:''});
  } catch (error) {
   setSuccess(false);
   setMessage(error.message);
  } finally {
   setBusy(false);
  }
 }
 return <section className="profile-panel"><div className="profile-panel-title"><div><h2><ShieldCheck size={20}/> Bảo mật</h2><p>Đổi mật khẩu phải xác nhận bằng mã OTP gửi về Gmail đăng ký.</p></div></div>{message&&<p className={success?'success-alert':'error-alert'} role={success?'status':'alert'}>{message}</p>}<form className="auth-form" onSubmit={submit}><label>Mật khẩu hiện tại<input type="password" value={form.currentPassword} onChange={e=>setForm(current=>({...current,currentPassword:e.target.value}))} autoComplete="current-password" /></label><label>Mật khẩu mới<input type="password" value={form.newPassword} onChange={e=>setForm(current=>({...current,newPassword:e.target.value}))} autoComplete="new-password" /></label><label>Xác nhận mật khẩu mới<input type="password" value={form.confirmPassword} onChange={e=>setForm(current=>({...current,confirmPassword:e.target.value}))} autoComplete="new-password" /></label><div className="utility-row"><label style={{flex:1}}>Mã OTP<input type="text" inputMode="numeric" maxLength={6} value={form.otp} onChange={e=>setForm(current=>({...current,otp:e.target.value.replace(/\D/g,'').slice(0,6)}))} placeholder="123456" /></label><button type="button" className="secondary-button" disabled={otpBusy||busy} onClick={sendOtp}>{otpBusy?'Đang gửi…':'Gửi mã OTP'}</button></div><button className="primary-button" type="submit" disabled={busy}>{busy?'Đang cập nhật…':'Đổi mật khẩu'}</button></form></section>;
}

