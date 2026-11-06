"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Star } from 'lucide-react';
import { api, formatApiError } from '../lib/api';

export default function BookDiscussion({ bookId, signedIn }) {
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [eligible, setEligible] = useState(null);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const lock = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([api.reviews(bookId), api.questions(bookId)])
      .then(([reviewData, questionData]) => {
        if (!active) return;
        setReviews(Array.isArray(reviewData) ? reviewData : reviewData.reviews || []);
        setQuestions(questionData);
      })
      .catch(error => { if (active) setLoadError(formatApiError(error)); });
    if (signedIn) {
      api.reviewEligibility(bookId)
        .then(data => { if (active) setEligible(data.canReview); })
        .catch(error => { if (active) setLoadError(formatApiError(error)); });
    }
    return () => { active = false; };
  }, [bookId, signedIn]);

  async function submit(event, type) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      if (type === 'review') {
        const saved = await api.saveReview(bookId, { rating, comment });
        setReviews(current => [saved, ...current.filter(item => item.id !== saved.id)]);
        setComment('');
        setMessage('Đã lưu đánh giá của bạn.');
      } else {
        const saved = await api.askQuestion(bookId, question);
        setQuestions(current => [saved, ...current]);
        setQuestion('');
        setMessage('Đã gửi câu hỏi. Thư viện sẽ trả lời tại đây.');
      }
    } catch (error) {
      setMessage(formatApiError(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 'Chưa có';

  return <section id="reviews" className="review-section">
    <div className="section-title-row review-heading-row">
      <div><span className="eyebrow">CỘNG ĐỒNG MỘC</span><h2>Đánh giá và hỏi đáp</h2></div>
      <div className="review-section-summary">
        <span><Star size={17} fill="currentColor"/> {average}</span>
        <small>{reviews.length} đánh giá</small>
      </div>
    </div>
    {loadError && <p className="error-alert" role="alert">{loadError}</p>}
    {signedIn && eligible === null && !loadError && <p>Đang kiểm tra quyền đánh giá…</p>}
    {signedIn && eligible === false && <p className="review-login-note">
      Bạn có thể đánh giá sau khi mua, mượn hoặc xác nhận đã đọc sách điện tử này. Hãy đặt câu hỏi bên dưới nếu cần tìm hiểu thêm.
    </p>}
    {signedIn && eligible === true && <form className="review-form" onSubmit={event => submit(event, 'review')}>
      <div className="rating-picker">
        <span className="rating-picker-label">Chấm điểm</span>
        <div className="rating-stars-picker" role="radiogroup" aria-label="Chọn số sao">
          {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" role="radio"
            aria-checked={rating === value} aria-label={value + ' sao'} disabled={busy}
            onClick={() => setRating(value)} onMouseEnter={() => setHover(value)} onMouseLeave={() => setHover(0)}>
            <Star size={27} fill={(hover || rating) >= value ? 'currentColor' : 'none'}/>
          </button>)}
        </div>
        <span className="rating-picker-caption">{rating} sao</span>
      </div>
      <label className="review-comment">Bình luận
        <textarea required value={comment} onChange={event => setComment(event.target.value)}
          maxLength={1200} placeholder="Chia sẻ trải nghiệm với cuốn sách…"/>
      </label>
      <button className="primary-button" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi bình luận'} <ArrowRight size={15}/></button>
    </form>}
    {!signedIn && <p className="review-login-note"><Link href={'/login?next=' + encodeURIComponent('/books/' + bookId)}>
      Đăng nhập</Link> để đặt câu hỏi hoặc đánh giá khi đủ điều kiện.</p>}
    <div className="review-grid">{reviews.map(review => <article className="review-card" key={review.id}>
      <div className="review-card-head">
        <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
        {review.createdAt && <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</time>}
      </div>
      <p>{review.comment || 'Bạn đọc chưa để lại bình luận.'}</p>
      <small>{review.reviewer || 'Bạn đọc Mộc'}</small>
    </article>)}</div>
    {!reviews.length && <p className="empty-inline">Chưa có đánh giá cho cuốn sách này.</p>}

    <div className="book-questions">
      <h3><MessageCircle size={20}/> Hỏi thư viện</h3>
      {signedIn && <form className="book-question-form" onSubmit={event => submit(event, 'question')}>
        <label htmlFor="book-question">Câu hỏi về sách</label>
        <textarea id="book-question" required maxLength={1200} rows={3} value={question}
          onChange={event => setQuestion(event.target.value)} placeholder="Bạn cần tìm hiểu gì về cuốn sách này?"/>
        <button className="primary-button" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi câu hỏi'}</button>
      </form>}
      {questions.map(item => <article className="book-question-card" key={item.id}>
        <strong>{item.reader || 'Bạn đọc Mộc'}</strong>
        <p>{item.question}</p>
        {item.answer ? <div className="book-question-answer"><b>Thư viện trả lời</b><p>{item.answer}</p></div>
          : <small>Đang chờ thư viện trả lời</small>}
      </article>)}
      {!questions.length && <p className="empty-inline">Chưa có câu hỏi về cuốn sách này.</p>}
    </div>
    {message && <p className="inline-note" role="status">{message}</p>}
  </section>;
}
