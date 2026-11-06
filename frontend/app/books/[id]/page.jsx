'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CircleAlert, MessageCircle, PackageCheck, Star, ThumbsDown, ThumbsUp } from 'lucide-react';
import BorrowActions from '../../../components/borrow-actions';
import { api, formatApiError } from '../../../lib/api';

const subscribeSession = callback => {
  window.addEventListener('moc:session', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('moc:session', callback);
    window.removeEventListener('storage', callback);
  };
};
const sessionSnapshot = () => Boolean(localStorage.getItem('library_token'));
const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

export default function BookDetailPage() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reaction, setReaction] = useState({ likes: 0, dislikes: 0, mine: null });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [note, setNote] = useState('');
  const signedIn = useSyncExternalStore(subscribeSession, sessionSnapshot, () => false);
  const [rating, setRating] = useState(5);
  const [ratingHover, setRatingHover] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!id) return;
    api.book(id).then(setBook).catch(error => setError(formatApiError(error)));
    api.relatedBooks(id).then(setRelated).catch(() => setRelated([]));
    api.reviews(id).then(data => setReviews(Array.isArray(data) ? data : (data?.reviews || []))).catch(() => {});
    api.reactions(id).then(setReaction).catch(() => {});
  }, [id]);

  const submitReaction = async value => {
    if (!signedIn) {
      setNote('Vui lòng đăng nhập để thích hoặc không thích cuốn sách.');
      return;
    }
    setReactionBusy(true);
    setNote('');
    try { setReaction(await api.react(id, value)); }
    catch (error) { setNote(error.message); }
    finally { setReactionBusy(false); }
  };

  const submitReview = async event => {
    event.preventDefault();
    setBusy(true);
    setNote('');
    try {
      const saved = await api.saveReview(id, { rating, comment });
      setReviews(current => [saved, ...current.filter(item => item.id !== saved.id)]);
      setComment('');
      setNote('Cảm ơn bạn đã chia sẻ cảm nhận.');
    } catch (error) { setNote(error.message); }
    finally { setBusy(false); }
  };

  if (error) return <main className="container state-panel detail-state"><CircleAlert/><h2>Không tải được thông tin sách</h2><p>{error}</p><Link className="primary-button" href="/books">Quay lại thư viện</Link></main>;
  if (!book) return <main className="container state-panel detail-state"><div className="spinner"/><p>Đang tải thông tin sách…</p></main>;

  const average = reviews.length ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1) : 'Chưa có';
  return <main className="container detail-page">
    <div className="breadcrumb"><Link href="/books"><ArrowLeft size={15}/> Trở về bộ sưu tập</Link><span>/</span><span>{book.category?.name || 'Sách'}</span></div>
    <section className="detail-layout">
      <div className={'detail-art ' + (book.id % 2 ? 'cover-moss' : 'cover-ochre')}><span className="cover-edition">MỘC · TUYỂN CHỌN</span><div className="detail-art-ring"/><BookOpen size={55}/><h2>{book.title}</h2><p>{book.author?.name || 'Đang cập nhật tác giả'}</p><span className="detail-art-mark">m.</span></div>
      <div className="detail-copy">
        <span className="eyebrow"><span className="eyebrow-line"/> {book.category?.name || 'GÓC ĐỌC MỘC'}</span>
        <div className={'stock-pill ' + (book.availableQuantity > 0 ? 'pill-green' : 'pill-muted')}><PackageCheck size={15}/>{book.availableQuantity > 0 ? 'Còn ' + book.availableQuantity + ' cuốn' : 'Tạm hết sách'}</div>
        <h1>{book.title}</h1><p className="detail-author">Tác giả <b>{book.author?.name || 'Đang cập nhật'}</b></p>
        <p className="detail-description">{book.description || 'Một cuốn sách được tuyển chọn cho những khoảnh khắc lắng lại, khám phá điều mới và nuôi dưỡng tình yêu đọc mỗi ngày.'}</p>
        <div className="detail-facts"><div><small>PHÍ MƯỢN</small><b>{money(book.rentalPrice)}<small>/cuốn · 14 ngày</small></b></div><div><small>GIÁ BÁN</small><b>{money(book.salePrice)}</b></div><div><small>NHÀ XUẤT BẢN</small><b>{book.publisher?.name || 'Đang cập nhật'}</b></div><div><small>MÃ ISBN</small><b>{book.isbn || '—'}</b></div></div>
        <BorrowActions key={book.id} book={book}/>
        <div className="book-reactions" aria-label="Đánh giá cuốn sách"><span>Cuốn sách này thế nào với bạn?</span><button type="button" aria-pressed={reaction.mine === 'LIKE'} disabled={reactionBusy} onClick={() => submitReaction('LIKE')}><ThumbsUp size={16}/> Thích <b>{reaction.likes}</b></button><button type="button" aria-pressed={reaction.mine === 'DISLIKE'} disabled={reactionBusy} onClick={() => submitReaction('DISLIKE')}><ThumbsDown size={16}/> Không thích <b>{reaction.dislikes}</b></button></div>

      </div>
    </section>

    <section id="reviews" className="review-section">
      <div className="section-title-row review-heading-row"><div><span className="eyebrow">CỘNG ĐỒNG MỘC</span><h2>Bình luận từ bạn đọc.</h2><p>Chia sẻ cảm nhận và đọc góc nhìn của mọi người về cuốn sách.</p></div><div className="review-section-summary"><span><Star size={17} fill="currentColor"/> {average}</span><small>{reviews.length} đánh giá</small><MessageCircle size={15}/></div></div>
      {signedIn ? <form className="review-form" onSubmit={submitReview}><div className="rating-picker"><span className="rating-picker-label">Chấm điểm</span><div className="rating-stars-picker" role="radiogroup" aria-label="Chọn số sao">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio" aria-checked={rating === value} aria-label={`${value} sao`} title={`${value} sao`} onClick={() => setRating(value)} onMouseEnter={() => setRatingHover(value)} onMouseLeave={() => setRatingHover(0)}><Star size={27} fill={(ratingHover || rating) >= value ? "currentColor" : "none"}/></button>)}</div><span className="rating-picker-caption">{rating} sao · {(['', 'Chưa hài lòng', 'Tạm được', 'Bình thường', 'Hay', 'Rất hay'])[rating]}</span></div><label className="review-comment">Bình luận<textarea required value={comment} onChange={event => setComment(event.target.value)} maxLength={1200} placeholder="Chia sẻ cảm nhận của bạn về cuốn sách…"/></label><button className="primary-button" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi bình luận'} <ArrowRight size={15}/></button></form> : <p className="review-login-note">Muốn chia sẻ cảm nhận? <Link href="/login">Đăng nhập</Link> hoặc <Link href="/register">tạo tài khoản</Link> để bình luận.</p>}
      {reviews.length ? <div className="review-grid">{reviews.map(review => <article className="review-card" key={review.id}><div className="review-card-head"><div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>{review.createdAt && <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</time>}</div><p>{review.comment || 'Bạn đọc chưa để lại bình luận.'}</p><small>{review.reviewer || 'Bạn đọc Mộc'}</small></article>)}</div> : <p className="empty-inline">Chưa có bình luận. Hãy là người đầu tiên chia sẻ cảm nhận.</p>}
      {note && <p className="inline-note" role="status">{note}</p>}
    </section>

    <section className="related-section"><div className="section-title-row"><div><span className="eyebrow">CÙNG THỂ LOẠI</span><h2>Có thể bạn cũng thích.</h2><p>Những cuốn sách cùng danh mục với lựa chọn của bạn.</p></div></div>
      {related.length ? <div className="book-grid">{related.slice(0, 4).map((item, index) => <article className="book-card" key={item.id}><Link href={'/books/' + item.id} className={'book-cover cover-' + ['moss', 'ochre', 'rose', 'night'][index]}><BookOpen size={30}/><strong>{item.title}</strong><small>{item.author?.name || 'Đang cập nhật tác giả'}</small></Link><div className="book-info"><Link href={'/books/' + item.id} className="book-title">{item.title}</Link><p>{item.author?.name || 'Đang cập nhật tác giả'}</p></div></article>)}</div> : <p className="empty-inline">Chưa có sách cùng thể loại để gợi ý.</p>}
    </section>
  </main>;
}
