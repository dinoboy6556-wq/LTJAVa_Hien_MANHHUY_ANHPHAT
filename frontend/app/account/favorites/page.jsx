'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, CircleAlert, BookOpen, ArrowRight } from 'lucide-react';
import { api, formatApiError } from '../../../lib/api';
import { BookCard } from '../../../components/book-shelf';

export default function FavoritesPage(){
 const router=useRouter();const [books,setBooks]=useState([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);
 useEffect(()=>{if(!localStorage.getItem('library_token')){router.push('/login');return}api.favorites().then(data=>setBooks(Array.isArray(data)?data:[])).catch(e=>setError(formatApiError(e))).finally(()=>setLoading(false))},[]);
 const list=books.map(x=>x.book||x);
 return <main className="account-page container"><div className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><b>Yêu thích</b></div><section className="page-heading account-heading"><span className="eyebrow"><Heart size={14}/> GÓC SÁCH CỦA BẠN</span><h1>Những cuốn sách<br/><em>đã lưu lại.</em></h1><p>Một danh sách nhỏ dành riêng cho những điều bạn muốn đọc.</p></section>{loading?<div className="state-panel">Đang gọi <code>GET /api/v1/favorites</code>…</div>:error?<div className="state-panel"><CircleAlert/><h2>Chưa tải được sách yêu thích</h2><p>{error}</p></div>:list.length?<div className="book-grid">{list.map((book,i)=><BookCard key={book.id} book={book} index={i}/>)}</div>:<div className="state-panel"><BookOpen/><h2>Danh sách đang chờ cuốn đầu tiên</h2><p>Chạm biểu tượng trái tim ở trang chi tiết để lưu sách tại đây.</p><Link href="/books" className="primary-button">Khám phá sách <ArrowRight size={16}/></Link></div>}</main>;
}
