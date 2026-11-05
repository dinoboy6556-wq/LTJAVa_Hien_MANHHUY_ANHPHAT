'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowRight, BookOpen, Check, Flower2, Leaf, MoveUpRight } from 'lucide-react';
import BorrowSteps from '../components/borrow-steps';
import HomeShelves from '../components/home-shelves';
import { api } from '../lib/api';

export default function HomePage() {
  const [selection,setSelection]=useState(null),[error,setError]=useState('');const count=selection?.totalBooks??null;
  useEffect(()=>{let active=true;api.homeSelections().then(data=>{if(active)setSelection(data);}).catch(e=>{if(active)setError(e.message);});return ()=>{active=false;};},[]);
  const retry=async()=>{try{setSelection(await api.homeSelections());setError('');}catch(e){setError(e.message);}};
  return <main>
    <section className="hero"><div className="container hero-inner"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> MỘT GÓC NHỎ DÀNH CHO NHỮNG TÂM HỒN LỚN</div><h1>Chạm vào thế giới<br/><em>qua từng trang sách.</em></h1><p>Hít một hơi thật sâu. Chọn lấy một câu chuyện. Để những trang sách đưa bạn đến nơi bình yên nhất.</p><div className="hero-actions"><Link className="primary-button" href="/books">Khám phá thư viện <ArrowRight size={17}/></Link><Link className="quiet-link" href="/library">Đọc sách online <MoveUpRight size={16}/></Link></div><div className="hero-proof"><div className="proof-avatars"><span>H</span><span>M</span><span>A</span><span>+</span></div><div><b>{count === null ? 'Thư viện của bạn' : count + ' đầu sách đang chờ'}</b><small>Dữ liệu cập nhật trực tiếp từ thư viện</small></div></div></div><div className="hero-visual"><div className="hero-image-frame"><div className="hero-image-glow"/><div className="hero-window"><div className="window-sun"/><div className="window-hill hill-one"/><div className="window-hill hill-two"/><div className="window-table"/><div className="window-book book-one"/><div className="window-book book-two"/><div className="window-book book-three"/><div className="window-vase"/><div className="window-leaf leaf-one"/><div className="window-leaf leaf-two"/></div><div className="image-caption"><span><Flower2 size={16}/></span><div><b>Khoảng lặng của riêng bạn</b><small>Ở đây, mọi thứ bắt đầu từ một trang sách.</small></div></div><div className="floating-stamp"><span>EST.</span><b>2024</b><small>READ SLOWLY</small></div></div></div></div><div className="hero-bottom-line"><span>CHẬM LẠI · MỞ RA · CẢM NHẬN</span><ArrowDownRight size={16}/><span>THƯ VIỆN MỘC</span></div></section>
    <div className="trust-strip"><div className="container trust-inner"><span><Check size={16}/> Mượn sách thật dễ dàng</span><span><Check size={16}/> Theo dõi hành trình đọc</span><span><Check size={16}/> Lưu lại sách yêu thích</span><span className="trust-decoration"><Leaf size={18}/> MỘC LIBRARY</span></div></div>
    <BorrowSteps/><HomeShelves data={selection} error={error} onRetry={retry}/>
    <section className="reading-note"><div className="container reading-inner"><span className="reading-ornament">“</span><div><span className="eyebrow">MỘT LỜI NHẮN NHỎ</span><h2>“Sách mở ra trước mắt ta<br/>những chân trời mới.”</h2><p>Mỗi cuốn sách là một người bạn, mỗi lần đọc là một lần ta gặp lại chính mình.</p></div><div className="note-aside"><span>ĐỌC CHẬM</span><i/><span>NGHĨ SÂU</span><i/><span>SỐNG ĐẸP</span></div></div></section>
    <section className="join-section container"><div className="join-card"><div className="join-decoration"><BookOpen size={112}/><span>m.</span></div><div><span className="eyebrow">HÀNH TRÌNH ĐỌC CỦA BẠN</span><h2>Một cuốn sách hay<br/>đang chờ bạn.</h2><p>Ghé thư viện Mộc và bắt đầu hành trình của riêng mình.</p><Link className="primary-button" href="/register">Tham gia thư viện <ArrowRight size={17}/></Link></div><div className="join-number">01 <small>— 26</small></div></div></section>
  </main>;
}
