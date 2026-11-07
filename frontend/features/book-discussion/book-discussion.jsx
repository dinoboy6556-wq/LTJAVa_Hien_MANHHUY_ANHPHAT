'use client';

import { Star } from 'lucide-react';
import BookReviews from './book-reviews';
import BookQuestions from './book-questions';
import { useBookDiscussion } from './use-book-discussion';

export default function BookDiscussion({ bookId, signedIn }) {
  const {
    reviews,
    questions,
    eligible,
    busy,
    message,
    loadError,
    saveReview,
    askQuestion,
  } = useBookDiscussion(bookId, signedIn);

  const average = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      ).toFixed(1)
    : 'Chưa có';

  return (
    <section id="reviews" className="review-section">
      <div className="section-title-row review-heading-row">
        <div>
          <span className="eyebrow">CỘNG ĐỒNG MỘC</span>
          <h2>Đánh giá và hỏi đáp</h2>
        </div>
        <div className="review-section-summary">
          <span>
            <Star size={17} fill="currentColor" /> {average}
          </span>
          <small>{reviews.length} đánh giá</small>
        </div>
      </div>
      {loadError && (
        <p className="error-alert" role="alert">
          {loadError}
        </p>
      )}
      <BookReviews
        bookId={bookId}
        signedIn={signedIn}
        eligible={eligible}
        loadError={loadError}
        reviews={reviews}
        busy={busy}
        onSubmit={saveReview}
      />
      <BookQuestions
        questions={questions}
        signedIn={signedIn}
        busy={busy}
        onSubmit={askQuestion}
      />
      {message && (
        <p className="inline-note" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
