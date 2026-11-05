document.addEventListener('DOMContentLoaded', () => {
  const favoriteButton = document.getElementById('bookFavoriteButton');
  const bookId = favoriteButton?.dataset.bookId;
  if (!bookId) return;
  const reviewsRoot = document.getElementById('bookReviews');
  const reviewForm = document.getElementById('bookReviewForm');
  const reviewMessage = document.getElementById('reviewMessage');
  const token = localStorage.getItem('libraryToken');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const renderReviews = summary => {
    const score = document.getElementById('reviewAverage');
    if (score) score.textContent = `${summary.average?.toFixed(1) || '0.0'} / 5 · ${summary.count || 0} đánh giá`;
    if (!reviewsRoot) return;
    reviewsRoot.replaceChildren();
    for (const review of summary.reviews || []) {
      const article = document.createElement('article'); article.className = 'review-card';
      const heading = document.createElement('strong'); heading.textContent = `${review.reviewer || 'Độc giả'} · ${review.rating}/5`;
      const text = document.createElement('p'); text.textContent = review.comment || 'Không có nhận xét.';
      article.append(heading, text); reviewsRoot.append(article);
    }
    if (!summary.count) reviewsRoot.textContent = 'Chưa có đánh giá cho cuốn sách này.';
  };
  const loadReviews = () => fetch(`/api/v1/books/${bookId}/reviews`).then(r => r.json()).then(renderReviews).catch(() => { if (reviewsRoot) reviewsRoot.textContent = 'Chưa tải được đánh giá.'; });
  loadReviews();

  reviewForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!token) { window.location.href = '/user/login'; return; }
    const form = new FormData(reviewForm);
    const button = reviewForm.querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const response = await fetch(`/api/v1/books/${bookId}/reviews`, {
        method: 'PUT', headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: Number(form.get('rating')), comment: form.get('comment') })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Chưa thể lưu đánh giá.');
      reviewMessage.textContent = 'Đã lưu đánh giá của bạn.'; reviewForm.reset(); await loadReviews();
    } catch (error) { reviewMessage.textContent = error.message; }
    finally { button.disabled = false; }
  });

  const relatedRoot = document.getElementById('relatedBooks');
  if (relatedRoot) fetch(`/api/v1/books/${bookId}/related`).then(r => r.json()).then(books => {
    relatedRoot.replaceChildren();
    for (const book of books) {
      const link = document.createElement('a'); link.className = 'related-book'; link.href = `/user/books/${book.id}`; link.textContent = book.title;
      relatedRoot.append(link);
    }
    if (!books.length) relatedRoot.textContent = 'Chưa có sách cùng thể loại.';
  }).catch(() => { relatedRoot.textContent = 'Chưa tải được sách liên quan.'; });
});
