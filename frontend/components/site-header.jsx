'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Heart, Library, Menu, Search, UserRound, X } from 'lucide-react';

export default function SiteHeader() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => { try { setUser(JSON.parse(localStorage.getItem('library_user') || 'null')); } catch { setUser(null); } };
    sync(); window.addEventListener('moc:session', sync); window.addEventListener('storage', sync);
    return () => { window.removeEventListener('moc:session', sync); window.removeEventListener('storage', sync); };
  }, []);
  return <header className="site-header"><div className="container header-inner">
    <Link href="/" className="brand"><span className="brand-icon"><BookOpen size={22}/></span><span><b>mộc.</b><small>THƯ VIỆN CỦA BẠN</small></span></Link>
    <button className="mobile-toggle" aria-label="Mở menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={'main-nav ' + (open ? 'nav-open' : '')} onClick={() => setOpen(false)}><Link href="/books"><Library size={16}/> Khám phá sách</Link>{user && <><Link href="/account/loans">Sách đang mượn</Link><Link href="/account/favorites"><Heart size={15}/> Yêu thích</Link>{user.roles?.some(role => ['ROLE_ADMIN', 'ROLE_LIBRARIAN'].includes(typeof role === 'string' ? role : role?.name)) && <a href="http://localhost:8080/admin">Quản trị ↗</a>}</>}</nav>
    <form className="header-search" action="/books"><Search size={17}/><input name="q" placeholder="Tìm tên sách, tác giả..." aria-label="Tìm sách"/></form>
    <div className="header-user">{user ? <Link href="/account/loans" className="user-badge"><span>{(user.fullName || user.email || 'M').slice(0,1).toUpperCase()}</span>{user.fullName || 'Tài khoản'}</Link> : <Link href="/login" className="header-login"><UserRound size={17}/> Đăng nhập</Link>}</div>
  </div></header>;
}
