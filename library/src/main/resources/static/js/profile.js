document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('profileForm');
  if (!form) return;
  const message = document.getElementById('profileMessage');
  const fields = form.querySelector('fieldset');
  const token = localStorage.getItem('libraryToken');
  if (!token) { window.location.replace('/user/login'); return; }

  async function request(options = {}) {
    const response = await fetch('/api/v1/profile', {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    });
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('libraryToken');
      localStorage.removeItem('libraryProfile');
      window.location.replace('/user/login');
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'Không thể lưu hoặc tải hồ sơ. Kiểm tra thông tin và thử lại.');
    return data;
  }

  function populate(data) {
    for (const key of ['fullName', 'email', 'phone', 'address']) form.elements.namedItem(key).value = data[key] || '';
    localStorage.setItem('libraryProfile', JSON.stringify(data));
    const account = document.querySelector('.user-actions a');
    if (account && account.getAttribute('href') === '/user/profile') account.textContent = data.fullName || data.email;
  }

  try {
    populate(await request());
    fields.disabled = false;
    message.textContent = '';
  } catch (error) { message.textContent = error.message; }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const values = new FormData(form);
    fields.disabled = true;
    message.classList.remove('success');
    message.textContent = 'Đang lưu...';
    try {
      populate(await request({ method: 'PUT', body: JSON.stringify({
        fullName: values.get('fullName'), phone: values.get('phone'), address: values.get('address')
      }) }));
      message.classList.add('success');
      message.textContent = 'Đã lưu hồ sơ thành công.';
    } catch (error) { message.textContent = error.message; }
    finally { fields.disabled = false; }
  });
});