'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, CircleAlert, Heart, Sparkles } from 'lucide-react';
import BorrowActions from './borrow-actions';
import CardRating from './card-rating';
import { api, formatApiError } from '../lib/api';

const money = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v || 0));
const palettes = ['cover-moss','cover-ochre','cover-rose','cover-night','cover-sky'];

export function BookCard({ book, index = 0, rating }) {
  return <article className="book-card"><Link href={'/books/' + book.id} className={'book-cover ' + palettes[index % palettes.length]}>{book.coverImageUrl&&<BookCover url={book.coverImageUrl} title={book.title}/>}<span className="cover-edition">MỘC · TUYỂN CHỌN</span><span className="cover-orbit"/><BookOpen className="cover-icon" size={31}/><strong>{book.title}</strong><small>{book.author?.name || 'Tác giả đang cập nhật'}</small><span className="cover-mark">m.</span></Link><div className="book-info"><span className="book-category">{book.category?.name || 'SÁCH HAY'}</span><Link href={'/books/' + book.id} className="book-title">{book.title}</Link><p>{book.author?.name || 'Đang cập nhật tác giả'}</p><CardRating bookId={book.id} initialSummary={rating}/><div className="book-card-bottom"><span className={book.availableQuantity > 0 ? 'stock stock-available' : 'stock stock-empty'}><i/>{book.availableQuantity > 0 ? 'Còn ' + book.availableQuantity + ' cuốn' : 'Tạm hết sách'}</span><b>{money(book.rentalPrice)}<small>/cuốn · 14 ngày</small></b></div><BorrowActions book={book} compact/></div></article>;
}

export default function BookShelf({ featured = false, initialQuery = '' }) {
  const [books,setBooks]=useState([]),[ratings,setRatings]=useState({}),[categories,setCategories]=useState(['Tất cả']),[category,setCategory]=useState('Tất cả');
  const [query,setQuery]=useState(initialQuery),[author,setAuthor]=useState(''),[min,setMin]=useState(''),[max,setMax]=useState(''),[availability,setAvailability]=useState(''),[sort,setSort]=useState('title'),[page,setPage]=useState(1),[loading,setLoading]=useState(true),[error,setError]=useState(''),[total,setTotal]=useState(0),[totalPages,setTotalPages]=useState(1),[retry,setRetry]=useState(0);
  const refresh=()=>setRetry(n=>n+1);
  useEffect(()=>{let active=true;api.categories().then(list=>{if(active)setCategories(['Tất cả',...list.map(c=>c.name)]);}).catch(()=>{});api.bookRatings().then(data=>{if(active)setRatings(data||{});}).catch(()=>{});return ()=>{active=false;};},[]);
  useEffect(()=>{let active=true;const timer=setTimeout(()=>{setLoading(true);const params={q:query,author,category:category==='Tất cả'?'':category,status:availability,sort:sort==='rental'?'price_asc':sort,page:String(page-1)};if(min!=='')params.min=min;if(max!=='')params.max=max;
   api.catalog(params).then(result=>{if(!active)return;setBooks(result.content||[]);setTotal(result.totalElements||0);setTotalPages(Math.max(1,result.totalPages||1));setError('');}).catch(e=>{if(active){setError(formatApiError(e));setBooks([]);}}).finally(()=>{if(active)setLoading(false);});},200);return ()=>{active=false;clearTimeout(timer);};},[query,author,min,max,availability,category,sort,page,retry]);
  const pageSize=12,currentPage=Math.min(page,totalPages),shown=featured?books.slice(0,4):books;
  const pageNumbers=Array.from({length:Math.min(5,totalPages)},(_,i)=>Math.max(1,Math.min(currentPage-2,totalPages-4))+i);
  return <section className={featured ? 'shelf-section' : 'catalog-area'}>
    {!featured&&<div className="catalog-filters" aria-label="Bộ lọc sách"><div className="filter-grid">
      <label className="filter-query">Tìm kiếm<input value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder="Tên sách, tác giả hoặc thể loại"/></label>
      <label>Tác giả<input value={author} onChange={e=>{setAuthor(e.target.value);setPage(1);}} placeholder="Tên tác giả"/></label>
      <label>Sắp xếp<select aria-label="Sắp xếp sách" value={sort} onChange={e=>{setSort(e.target.value);setPage(1);}}><option value="title">Tên A–Z</option><option value="rental">Phí mượn thấp</option><option value="available">Còn sách trước</option></select></label>
      <label>Phí từ (đ)<input type="number" min="0" value={min} placeholder="Không giới hạn" onChange={e=>{setMin(e.target.value);setPage(1);}}/></label>
      <label>Phí đến (đ)<input type="number" min="0" value={max} placeholder="Không giới hạn" onChange={e=>{setMax(e.target.value);setPage(1);}}/></label>
      <label>Tình trạng<select aria-label="Tình trạng sách" value={availability} onChange={e=>{setAvailability(e.target.value);setPage(1);}}><option value="">Tất cả</option><option value="available">Còn sách</option><option value="unavailable">Hết sách</option></select></label>
      <button className="reset-filters" onClick={()=>{setQuery('');setAuthor('');setMin('');setMax('');setAvailability('');setCategory('Tất cả');setSort('title');setPage(1);}}>Xóa bộ lọc</button>
    </div></div>}
    <div className="category-row">{categories.map((name, i) => <button key={name} className={category === name ? 'category-chip selected' : 'category-chip'} onClick={() => {setCategory(name);setPage(1)}}>{i === 0 && <Sparkles size={14}/>} {name}</button>)}</div>
    {featured && <div className="section-title-row"><div><span className="eyebrow">ĐƯỢC BẠN ĐỌC YÊU THÍCH</span><h2>Sách đáng để <em>mở hôm nay.</em></h2><p>Một vài gợi ý nhỏ cho hành trình đọc của bạn.</p></div><Link href="/books" className="text-link">Khám phá tất cả <ArrowRight size={16}/></Link></div>}
    <div className="shelf-meta"><span>{loading ? 'Đang tải danh mục…' : <><b>{total}</b> đầu sách trong bộ sưu tập</>}</span>{!featured && <span><Heart size={14}/> Cập nhật từ thư viện Mộc</span>}</div>
    {loading ? <div className="loading-grid">{Array.from({length: pageSize}).map((_,i)=><div className="skeleton-card" key={i}><div/><span/><span/></div>)}</div> : error ? <div className="state-panel"><CircleAlert size={25}/><h3>Chưa kết nối được thư viện</h3><p>{error}</p><button className="primary-button" onClick={refresh}>Thử lại <ArrowRight size={16}/></button><small>Bạn có thể tải lại trang hoặc thử lại sau.</small></div> : shown.length ? <><div className="book-grid">{shown.map((book,i)=><BookCard book={book} index={(currentPage-1)*pageSize+i} rating={ratings[book.id]||{average:0,count:0}} key={book.id}/>)}</div>{!featured && totalPages > 1 && <nav className="pagination" aria-label="Phân trang"><button disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}><ChevronLeft size={17}/></button>{pageNumbers.map(n=><button className={n===currentPage?'page-active':''} onClick={()=>setPage(n)} key={n}>{n}</button>)}<span>Trang {currentPage}/{totalPages}</span><button disabled={currentPage===totalPages} onClick={()=>setPage(currentPage+1)}><ChevronRight size={17}/></button></nav>}</> : <div className="state-panel"><BookOpen size={25}/><h3>Chưa tìm thấy đầu sách</h3><p>Thử xóa bộ lọc hoặc tìm bằng từ khóa khác.</p><button className="text-button" onClick={()=>{setCategory('Tất cả');setQuery('')}}>Xóa bộ lọc</button></div>}
  </section>;
}

function BookCover({url,title}){const [failed,setFailed]=useState(false);return failed?null:<Image className="actual-cover" src={url} alt={title} fill unoptimized onError={()=>setFailed(true)}/>;}
