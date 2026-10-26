
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.topbar nav .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    const selected = href === '/user'
      ? currentPath === '/' || currentPath === '/user'
      : currentPath === href || currentPath.startsWith(href + '/');
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
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
        if (!token) throw new Error('Máy chủ không trả về token đăng nhập.');
        localStorage.setItem('libraryToken', token);
        localStorage.setItem('libraryProfile', JSON.stringify({
          fullName: data.fullName, email: data.email, roles: data.roles || []
        }));
        message.classList.add('success');
        message.textContent = 'Đăng nhập thành công. Đang mở tài khoản...';
        setTimeout(() => window.location.href = '/user/borrowed', 700);
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

  const accountPage = ['/user/borrowed', '/user/history'].includes(window.location.pathname);
  const loanPanel = accountPage ? document.querySelector('main .empty-state') : null;
  const token = localStorage.getItem('libraryToken');

  function clearSession() {
    localStorage.removeItem('libraryToken');
    localStorage.removeItem('libraryProfile');
  }

  function showAccount() {
    const actions = document.querySelector('.user-actions');
    if (!actions) return;
    let profile = {};
    try { profile = JSON.parse(localStorage.getItem('libraryProfile') || '{}') || {}; }
    catch { localStorage.removeItem('libraryProfile'); }
    const account = document.createElement('a');
    account.className = 'login-link';
    account.href = '/user/profile';
    account.title = 'Hồ sơ cá nhân';
    account.textContent = profile.fullName || profile.email || 'Tài khoản của tôi';
    const logout = document.createElement('button');
    logout.type = 'button';
    logout.className = 'login-link';
    logout.textContent = 'Đăng xuất';
    logout.addEventListener('click', () => {
      clearSession();
      window.location.href = '/user/login';
    });
    actions.replaceChildren(account, logout);
    const loginLink = document.getElementById('bookLoginLink');
    const borrowPanel = document.getElementById('bookBorrowPanel');
    if (loginLink) loginLink.hidden = true;
    if (borrowPanel) borrowPanel.hidden = false;
  }

  function showLoans(loans) {
    if (!loanPanel) return;
    const history = window.location.pathname === '/user/history';
    const visible = history ? loans : loans.filter(loan => loan.status !== 'RETURNED');
    const intro = document.querySelector('.page-intro p');
    if (intro) intro.textContent = history
      ? 'Các phiếu mượn và trả sách của tài khoản bạn.'
      : 'Các phiếu mượn chưa trả và hạn trả của bạn.';
    loanPanel.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = visible.length ? `${visible.length} phiếu mượn`
      : (history ? 'Bạn chưa có lịch sử mượn sách.' : 'Bạn không có sách đang mượn.');
    loanPanel.append(heading);
    const statuses = { BORROWED: 'Đang mượn', RETURNED: 'Đã trả', OVERDUE: 'Quá hạn' };
    for (const loan of visible) {
      const card = document.createElement('article');
      const title = document.createElement('h3');
      title.textContent = `Phiếu #${loan.id} — ${statuses[loan.status] || loan.status}`;
      const dates = document.createElement('p');
      dates.textContent = `Ngày mượn: ${loan.borrowDate || '—'} · Hạn trả: ${loan.dueDate || '—'}${loan.returnDate ? ' · Ngày trả: ' + loan.returnDate : ''}`;
      const books = document.createElement('ul');
      for (const item of loan.items || []) {
        const row = document.createElement('li');
        row.textContent = `${item.book?.title || 'Sách'}${item.copy?.code ? ' · Mã quyển: ' + item.copy.code : ''} — Số lượng: ${item.quantity}`;
        books.append(row);
      }
      card.append(title, dates, books);
      loanPanel.append(card);
    }
  }

  // Normal page navigation cannot attach a Bearer header. Load private data via fetch.
  if (token) {
    if (loanPanel) loanPanel.textContent = 'Đang tải tài khoản...';
    fetch('/api/v1/loans/my-loans', { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (response.status === 401 || response.status === 403) {
          clearSession();
          if (accountPage) window.location.href = '/user/login';
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        if (!response.ok) throw new Error('Chưa tải được tài khoản. Vui lòng tải lại trang.');
        const loans = await response.json();
        if (!Array.isArray(loans)) throw new Error('Dữ liệu phiếu mượn không hợp lệ.');
        showAccount();
        showLoans(loans);
      })
      .catch(error => {
        if (loanPanel) loanPanel.textContent = error.message || 'Không thể kết nối máy chủ.';
      });
  } else {
    localStorage.removeItem('libraryProfile');
  }
});
