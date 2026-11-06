'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {readCart} from '../lib/cart';
import { api } from '../lib/api';
import { BookOpen, BookMarked, ClipboardList, ShoppingCart, Heart, Library, Menu, Search, UserRound, X } from 'lucide-react';

export default function SiteHeader() {
  const router=useRouter();const pathname=usePathname();
  const [settings,setSettings]=useState({});
  useEffect(()=>{let active=true;api.siteContent().then(data=>{if(active)setSettings(Object.fromEntries(data.filter(c=>c.kind==='CONFIG').map(c=>[c.slug,c.body])));}).catch(()=>{});return()=>{active=false;};},[]);
  const [count,setCount]=useState(0);
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => { try {const profile=JSON.parse(localStorage.getItem('library_user')||'null');setUser(profile);setCount(profile?.email?readCart(profile.email).reduce((n,i)=>n+i.quantity,0):0);}catch{setUser(null);setCount(0);} };
    sync(); if(localStorage.getItem('library_token'))api.profile().then(profile=>{localStorage.setItem('library_user',JSON.stringify(profile));sync();}).catch(()=>{}); window.addEventListener('moc:cart',sync); window.addEventListener('moc:session', sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener('moc:cart',sync);window.removeEventListener('moc:session', sync); window.removeEventListener('storage', sync); };
  }, []);
  return <><header className="site-header"><div className="container header-inner">
    <Link href="/" className="brand"><span className="brand-icon"><BookOpen size={22}/></span><span><b>{settings['library-name']||'mộc.'}</b><small>THƯ VIỆN CỦA BẠN</small></span></Link>
    <button className="mobile-toggle" type="button" aria-label={open ? "Đóng menu" : "Mở menu"} aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav id="site-navigation" className={'main-nav ' + (open ? 'nav-open' : '')} onClick={() => setOpen(false)}><Link aria-current={pathname==='/'?'page':undefined} href="/">Trang chủ</Link><Link aria-current={pathname.startsWith('/books')?'page':undefined} href="/books"><Library size={16}/> Khám phá sách</Link><Link aria-current={pathname==='/library'||pathname.startsWith('/read/')?'page':undefined} href="/library" onClick={()=>window.dispatchEvent(new Event('moc:library-all'))}><BookOpen size={16}/> Thư viện online</Link><Link aria-current={pathname==='/borrowing-policy'?'page':undefined} href="/borrowing-policy"><ClipboardList size={16} aria-hidden="true"/> Quy định</Link>{user && <><Link aria-current={pathname==='/account/loans'?'page':undefined} href="/account/loans"><BookMarked size={16} aria-hidden="true"/> Sách đang mượn</Link><Link aria-current={pathname==='/account/favorites'?'page':undefined} href="/account/favorites"><Heart size={15}/> Yêu thích</Link>{user.roles?.some(role => ['ROLE_ADMIN', 'ROLE_LIBRARIAN'].includes(typeof role === 'string' ? role : role?.name)) && <a href="/admin">Quản trị ↗</a>}</>}</nav>
    <form className="header-search" action="/books"><Search size={17}/><input name="q" placeholder="Tìm tên sách, tác giả..." aria-label="Tìm sách"/></form>
    <div className="header-user"><Link className="cart-badge" href="/cart" aria-label={`Giỏ mượn, ${count} quyển`}><ShoppingCart size={22}/>{count>0&&<b>{count}</b>}</Link>{user ? <Link href="/account/profile" className="user-badge" aria-label={user.fullName || "Tài khoản"}><span>{user.avatarData?<img src={user.avatarData} alt=""/>:(user.fullName || user.email || 'M').slice(0,1).toUpperCase()}</span><strong className="user-name">{user.fullName || 'Tài khoản'}</strong></Link> : <Link href="/login" className="header-login"><UserRound size={17}/> Đăng nhập</Link>}{user&&<button type="button" className="text-button" onClick={()=>{['library_token','library_user'].forEach(k=>localStorage.removeItem(k));window.dispatchEvent(new Event('moc:session'));router.push('/login');}}>Đăng xuất</button>}</div>
  </div></header>{settings['library-announcement']&&<aside className="library-announcement"><div className="container">{settings['library-announcement']}</div></aside>}</>;
}
