
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  async function sendAuth(url, payload, form) {
    const message = form.querySelector('#authMessage');
    const button = form.querySelector('button[type="submit"]');
    message.textContent = '';
    button.disabled = true;
    button.style.opacity = '.7';
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.');
      }
      if (url.endsWith('/login')) {
        const token = data.token || data.accessToken || data.access_token;
        if (token) localStorage.setItem('libraryToken', token);
        message.classList.add('success');
        message.textContent = 'Đăng nhập thành công. Đang chuyển về trang chủ...';
        setTimeout(() => window.location.href = '/user', 700);
      } else {
        message.classList.add('success');
        message.textContent = 'Đăng ký thành công. Bạn có thể đăng nhập.';
        setTimeout(() => window.location.href = '/user/login', 1100);
      }
    } catch (error) {
      message.classList.remove('success');
      message.textContent = error.message || 'Không thể kết nối máy chủ. Hãy kiểm tra Spring Boot.';
    } finally {
      button.disabled = false;
      button.style.opacity = '1';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', event => {
      event.preventDefault();
      const form = new FormData(loginForm);
      sendAuth('/api/v1/auth/login', {
        email: form.get('email'),
        password: form.get('password')
      }, loginForm);
    });
    // Align login form with the existing API's email field.
    const label = loginForm.querySelector('label');
    if (label) {
      label.childNodes[0].textContent = 'Email ';
      const input = label.querySelector('input');
      input.type = 'email';
      input.name = 'email';
      input.autocomplete = 'email';
      input.placeholder = 'ban@email.com';
    }
  }

  if (registerForm) {
    registerForm.addEventListener('submit', event => {
      event.preventDefault();
      const form = new FormData(registerForm);
      sendAuth('/api/v1/auth/register', {
        fullName: form.get('fullName'),
        email: form.get('email'),
        password: form.get('password')
      }, registerForm);
    });
    const usernameLabel = registerForm.querySelector('input[name="username"]')?.closest('label');
    if (usernameLabel) usernameLabel.remove();
  }
});
