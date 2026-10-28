
document.addEventListener('DOMContentLoaded', () => {
  const mainNav = document.querySelector('.topbar nav');
  if (mainNav) {
    let cachedProfile = {};
    try { cachedProfile = JSON.parse(localStorage.getItem('libraryProfile') || '{}') || {}; }
    catch { localStorage.removeItem('libraryProfile'); }
    const fixedLinks = [
      ['/user', 'Trang chủ'],
      ['/user/books', 'Khám phá sách'],
      ['/user/favorites', 'Yêu thích'],
      ['/user/borrowed', 'Sách đang mượn'],
      ['/user/history', 'Lịch sử']
    ].map(([href, label]) => {
      let link = mainNav.querySelector(`a[href="${href}"]`);
      if (!link) {
        link = document.createElement('a');
        link.href = href;
        link.className = 'nav-link';
        link.textContent = label;
      }
      return link;
    });
    if (Array.isArray(cachedProfile.roles) && cachedProfile.roles.includes('ROLE_ADMIN')) {
      let adminLink = mainNav.querySelector('a[href="/admin"]');
      if (!adminLink) {
        adminLink = document.createElement('a');
        adminLink.href = '/admin';
        adminLink.className = 'nav-link';
        adminLink.textContent = 'Quản trị';
      }
      fixedLinks.push(adminLink);
    }
    mainNav.append(...fixedLinks);
  }
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
      const dueDate = loan.dueDate ? new Date(`${loan.dueDate}T00:00:00`) : null;
      const canRenew = loan.status === 'BORROWED' && Number(loan.renewalCount || 0) < 1 && dueDate && dueDate >= new Date(new Date().toDateString());
      if (canRenew) {
        const renew = document.createElement('button'); renew.type = 'button'; renew.className = 'btn btn-secondary'; renew.textContent = 'Gia hạn thêm 7 ngày';
        renew.addEventListener('click', async () => {
          if (!window.confirm('Gia hạn phiếu mượn này thêm 7 ngày?')) return;
          renew.disabled = true;
          try {
            const response = await fetch(`/api/v1/loans/${loan.id}/renew`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'Không thể gia hạn phiếu mượn.');
            dates.textContent = `Ngày mượn: ${result.borrowDate || '—'} · Hạn trả mới: ${result.dueDate || '—'}`;
            renew.textContent = 'Đã gia hạn';
          } catch (error) { dates.textContent += ` · ${error.message}`; renew.disabled = false; }
        });
        card.append(renew);
      }
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
        if (loanPanel) fetch('/api/v1/fines/my-fines', { headers: { Authorization: `Bearer ${token}` } }).then(async response => {
          if (!response.ok) throw new Error('Chưa tải được danh sách khoản phạt.');
          const fines = await response.json();
          if (!fines.length) return;
          const section = document.createElement('section'); section.className = 'fine-list';
          const heading = document.createElement('h3'); heading.textContent = 'Khoản phạt'; section.append(heading);
          for (const fine of fines) {
            const row = document.createElement('p');
            row.textContent = `Phiếu #${fine.loan?.id || '—'} · ${fine.reason || 'Khoản phạt'} · ${Number(fine.amount || 0).toLocaleString('vi-VN')} đ · ${fine.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}`;
            section.append(row);
          }
          loanPanel.append(section);
        }).catch(() => {});
      })
      .catch(error => {
        if (loanPanel) loanPanel.textContent = error.message || 'Không thể kết nối máy chủ.';
      });
  } else {
    localStorage.removeItem('libraryProfile');
  }
});
