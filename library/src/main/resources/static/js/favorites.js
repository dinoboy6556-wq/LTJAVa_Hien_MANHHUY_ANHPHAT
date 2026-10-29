document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('libraryToken');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const button = document.getElementById('bookFavoriteButton');
  const message = document.getElementById('favoriteMessage');

  button?.addEventListener('click', async () => {
    if (!token) { window.location.href = '/user/login'; return; }
    button.disabled = true;
    try {
      const response = await fetch(`/api/v1/favorites/${button.dataset.bookId}`, { method: 'PUT', headers });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || 'Không thể lưu sách yêu thích.');
      button.textContent = '♥ Đã lưu yêu thích';
      if (message) message.textContent = 'Đã thêm sách vào danh sách yêu thích.';
    } catch (error) { if (message) message.textContent = error.message; }
    finally { button.disabled = false; }
  });

  const list = document.getElementById('favoriteList');
  if (!list) return;
  if (!token) { list.textContent = 'Đăng nhập để xem danh sách yêu thích.'; return; }
  fetch('/api/v1/favorites', { headers })
    .then(async response => {
      const data = await response.json().catch(() => []);
      if (!response.ok) throw new Error(data.message || 'Không thể tải danh sách yêu thích.');
      list.replaceChildren();
      if (!data.length) { list.textContent = 'Bạn chưa lưu sách yêu thích.'; return; }
      for (const favorite of data) {
        const book = favorite.book;
        if (!book) continue;
        const card = document.createElement('article'); card.className = 'book-card favorite-card';
        const link = document.createElement('a'); link.className = 'favorite-book-title'; link.href = `/user/books/${book.id}`; link.textContent = book.title || 'Sách';
        const author = document.createElement('p'); author.textContent = book.author?.name || 'Đang cập nhật tác giả';
        const remove = document.createElement('button'); remove.className = 'btn btn-secondary'; remove.type = 'button'; remove.textContent = 'Bỏ yêu thích';
        remove.addEventListener('click', async () => {
          remove.disabled = true;
          const response = await fetch(`/api/v1/favorites/${book.id}`, { method: 'DELETE', headers });
          if (response.ok) card.remove(); else { remove.disabled = false; document.getElementById('favoriteMessage').textContent = 'Chưa thể bỏ sách khỏi danh sách.'; }
        });
        card.append(link, author, remove); list.append(card);
      }
    }).catch(error => { list.textContent = error.message; });
});
