document.addEventListener('DOMContentLoaded', async () => {
  const button = document.getElementById('bookFavoriteButton');
  const message = document.getElementById('favoriteMessage');
  const list = document.getElementById('favoriteList');
  if (!button && !list) return;
  const feedback = text => { if (message) message.textContent = text; };
  let saved = false;
  let busy = false;
  let loaded = false;

  async function request(path = '', method = 'GET') {
    const token = localStorage.getItem('libraryToken');
    if (!token) { window.location.href = '/user/login'; throw new Error('Vui lòng đăng nhập.'); }
    const response = await fetch(`/api/v1/favorites${path}`, {
      method, headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('libraryToken');
      localStorage.removeItem('libraryProfile');
      window.location.href = '/user/login';
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'Không thể cập nhật sách yêu thích. Vui lòng thử lại.');
    return data;
  }
  function updateButton() {
    if (!button) return;
    button.textContent = saved ? '♥ Bỏ yêu thích' : '♡ Thêm yêu thích';
    button.setAttribute('aria-pressed', String(saved));
  }
  function render(data) {
    if (!list) return;
    list.replaceChildren();
    for (const favorite of data) {
      const book = favorite.book;
      if (!book) continue;
      const card = document.createElement('article'); card.className = 'book-card favorite-card';
      const link = document.createElement('a'); link.className = 'favorite-book-title';
      link.href = `/user/books/${book.id}`; link.textContent = book.title || 'Sách';
      const author = document.createElement('p'); author.textContent = book.author?.name || 'Đang cập nhật tác giả';
      const remove = document.createElement('button'); remove.className = 'btn btn-secondary';
      remove.type = 'button'; remove.textContent = 'Bỏ yêu thích';
      remove.addEventListener('click', async () => {
        if (remove.disabled) return;
        remove.disabled = true; feedback('Đang bỏ yêu thích...');
        try {
          await request(`/${book.id}`, 'DELETE');
          card.remove();
          if (!list.children.length) list.textContent = 'Bạn chưa lưu sách yêu thích.';
          feedback('Đã bỏ sách khỏi danh sách yêu thích.');
        } catch (error) { feedback(error.message || 'Không thể kết nối máy chủ.'); }
        finally { remove.disabled = false; }
      });
      const cover = document.createElement('a'); cover.href = link.href; cover.className = 'favorite-cover';
      const fallback = document.createElement('span'); fallback.className = 'favorite-cover-fallback';
      fallback.textContent = book.title || 'Chưa có ảnh bìa'; cover.append(fallback);
      if (book.coverImageUrl && /^(https?:\/\/|\/(?!\/))/.test(book.coverImageUrl)) {
        const image = document.createElement('img'); image.alt = `Bìa sách ${book.title || ''}`;
        image.loading = 'lazy'; image.decoding = 'async'; image.src = book.coverImageUrl;
        image.addEventListener('load', () => { fallback.hidden = true; });
        image.addEventListener('error', () => { image.hidden = true; fallback.hidden = false; });
        cover.append(image);
      }
      card.append(cover, link, author, remove); list.append(card);
    }
    if (!list.children.length) list.textContent = 'Bạn chưa lưu sách yêu thích.';
  }
  async function load() {
    const data = await request();
    if (!Array.isArray(data)) throw new Error('Dữ liệu yêu thích không hợp lệ. Vui lòng thử lại.');
    saved = !!button && data.some(f => String(f.book?.id) === button.dataset.bookId);
    loaded = true;
    updateButton(); render(data);
  }
  button?.addEventListener('click', async () => {
    if (busy) return;
    busy = true; button.disabled = true;
    try {
      if (!loaded) await load();
      await request(`/${button.dataset.bookId}`, saved ? 'DELETE' : 'PUT');
      saved = !saved; updateButton();
      feedback(saved ? 'Đã thêm sách vào danh sách yêu thích.' : 'Đã bỏ sách khỏi danh sách yêu thích.');
    } catch (error) { feedback(error.message || 'Không thể kết nối máy chủ.'); }
    finally { busy = false; button.disabled = false; }
  });
  if (!localStorage.getItem('libraryToken')) {
    if (list) list.textContent = 'Đăng nhập để xem danh sách yêu thích.';
    return;
  }
  busy = true;
  if (button) button.disabled = true;
  try { await load(); }
  catch (error) {
    feedback(error.message || 'Không thể kết nối máy chủ.');
    if (list) list.textContent = 'Chưa tải được sách yêu thích. Hãy tải lại trang để thử lại.';
  } finally { busy = false; if (button) button.disabled = false; }
});
