'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {readCart} from '../lib/cart';
import { api } from '../lib/api';
import { BookOpen, ShoppingCart, Heart, Library, Menu, Search, UserRound, X } from 'lucide-react';

export default function SiteHeader() {
  const router=useRouter();
  const [count,setCount]=useState(0);
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => { try {if(!localStorage.getItem('library_token')&&localStorage.getItem('libraryToken')){localStorage.setItem('library_token',localStorage.getItem('libraryToken'));localStorage.setItem('library_user',localStorage.getItem('libraryProfile')||'null');}const profile=JSON.parse(localStorage.getItem('library_user')||'null');setUser(profile);setCount(profile?.email?readCart(profile.email).reduce((n,i)=>n+i.quantity,0):0);}catch{setUser(null);setCount(0);} };
    sync(); if(localStorage.getItem('library_token'))api.profile().then(profile=>{localStorage.setItem('library_user',JSON.stringify(profile));sync();}).catch(()=>{}); window.addEventListener('moc:cart',sync); window.addEventListener('moc:session', sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener('moc:cart',sync);window.removeEventListener('moc:session', sync); window.removeEventListener('storage', sync); };
  }, []);
  return <header className="site-header"><div className="container header-inner">
    <Link href="/" className="brand"><span className="brand-icon"><BookOpen size={22}/></span><span><b>mộc.</b><small>THƯ VIỆN CỦA BẠN</small></span></Link>
    <button className="mobile-toggle" aria-label="Mở menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={'main-nav ' + (open ? 'nav-open' : '')} onClick={() => setOpen(false)}><Link href="/books"><Library size={16}/> Khám phá sách</Link>{user && <><Link href="/account/loans">Sách đang mượn</Link><Link href="/account/favorites"><Heart size={15}/> Yêu thích</Link>{user.roles?.some(role => ['ROLE_ADMIN', 'ROLE_LIBRARIAN'].includes(typeof role === 'string' ? role : role?.name)) && <a href="/admin">Quản trị ↗</a>}</>}</nav>
    <form className="header-search" action="/books"><Search size={17}/><input name="q" placeholder="Tìm tên sách, tác giả..." aria-label="Tìm sách"/></form>
    <div className="header-user"><Link className="cart-badge" href="/cart" aria-label={`Giỏ mượn, ${count} quyển`}><ShoppingCart size={22}/>{count>0&&<b>{count}</b>}</Link>{user ? <Link href="/account/profile" className="user-badge"><span>{(user.fullName || user.email || 'M').slice(0,1).toUpperCase()}</span>{user.fullName || 'Tài khoản'}</Link> : <Link href="/login" className="header-login"><UserRound size={17}/> Đăng nhập</Link>}{user&&<button type="button" className="text-button" onClick={()=>{['library_token','library_user','libraryToken','libraryProfile'].forEach(k=>localStorage.removeItem(k));window.dispatchEvent(new Event('moc:session'));router.push('/login');}}>Đăng xuất</button>}</div>
  </div></header>;
}
