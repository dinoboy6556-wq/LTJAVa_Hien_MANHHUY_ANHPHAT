import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

export default function BookReviews({
  bookId,
  signedIn,
  eligible,
  loadError,
  reviews,
  busy,
  onSubmit,
}) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (await onSubmit({ rating, comment })) setComment('');
  }

  return (
    <>
      {signedIn && eligible === null && !loadError && (
        <p>Đang kiểm tra quyền đánh giá…</p>
      )}
      {signedIn && eligible === false && (
        <p className="review-login-note">
          Bạn có thể đánh giá sau khi mua, mượn hoặc xác nhận đã đọc sách điện
          tử này. Hãy đặt câu hỏi bên dưới nếu cần tìm hiểu thêm.
        </p>
      )}
      {signedIn && eligible === true && (
        <form className="review-form" onSubmit={submit}>
          <div className="rating-picker">
            <span className="rating-picker-label">Chấm điểm</span>
            <div
              className="rating-stars-picker"
              role="radiogroup"
              aria-label="Chọn số sao"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={value + ' sao'}
                  disabled={busy}
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHover(value)}
                  onMouseLeave={() => setHover(0)}
                >
                  <Star
                    size={27}
                    fill={(hover || rating) >= value ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>
            <span className="rating-picker-caption">{rating} sao</span>
          </div>
          <label className="review-comment">
            Bình luận
            <textarea
              required
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1200}
              placeholder="Chia sẻ trải nghiệm với cuốn sách…"
            />
          </label>
          <button className="primary-button" disabled={busy}>
            {busy ? 'Đang gửi…' : 'Gửi bình luận'} <ArrowRight size={15} />
          </button>
        </form>
      )}
      {!signedIn && (
        <p className="review-login-note">
          <Link href={'/login?next=' + encodeURIComponent('/books/' + bookId)}>
            Đăng nhập
          </Link>{' '}
          để đặt câu hỏi hoặc đánh giá khi đủ điều kiện.
        </p>
      )}
      <div className="review-grid">
        {reviews.map((review) => (
          <article className="review-card" key={review.id}>
            <div className="review-card-head">
              <div className="review-stars">
                {'★'.repeat(review.rating)}
                {'☆'.repeat(5 - review.rating)}
              </div>
              {review.createdAt && (
                <time dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </time>
              )}
            </div>
            <p>{review.comment || 'Bạn đọc chưa để lại bình luận.'}</p>
            <small>{review.reviewer || 'Bạn đọc Mộc'}</small>
          </article>
        ))}
      </div>
      {!reviews.length && (
        <p className="empty-inline">Chưa có đánh giá cho cuốn sách này.</p>
      )}
    </>
  );
}
