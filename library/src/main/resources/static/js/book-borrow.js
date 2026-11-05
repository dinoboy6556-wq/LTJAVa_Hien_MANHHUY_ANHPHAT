document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('bookBorrowForm');
  if (!form) return;
  const message = document.getElementById('bookBorrowMessage');
  const button = form.querySelector('button[type="submit"]');
  let busy = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || button.disabled) return;
    const token = localStorage.getItem('libraryToken');
    if (!token) { window.location.href = '/user/login'; return; }
    const values = new FormData(form);
    const quantity = Number(values.get('quantity'));
    const days = Number(values.get('days'));
    if (!Number.isSafeInteger(quantity) || quantity < 1 || !Number.isSafeInteger(days) || days < 1) {
      message.textContent = 'Số lượng và số ngày mượn phải là số nguyên dương.';
      return;
    }
    if (!window.confirm(`Xác nhận mượn ${quantity} quyển trong ${days} ngày?`)) return;
    busy = true;
    button.disabled = true;
    message.classList.remove('success');
    message.textContent = 'Đang tạo phiếu mượn...';
    let completed = false;
    try {
      const response = await fetch('/api/v1/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ days, items: [{ bookId: Number(form.dataset.bookId), quantity }] })
      });
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('libraryToken');
        localStorage.removeItem('libraryProfile');
        window.location.href = '/user/login';
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'Không thể tạo phiếu mượn. Vui lòng thử lại.');
      completed = true;
      message.classList.add('success');
      message.textContent = 'Mượn sách thành công. Đang mở phiếu mượn...';
      window.location.href = '/user/borrowed';
    } catch (error) { message.textContent = error.message || 'Không thể kết nối máy chủ.'; }
    finally { busy = false; button.disabled = completed; }
  });
});