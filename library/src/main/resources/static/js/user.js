
document.addEventListener('DOMContentLoaded', () => {
  const mainNav = document.querySelector('.topbar nav');
  if (mainNav) {
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
    mainNav?.querySelector('a[href="/admin"]')?.remove();
  }

  function updateAdminLink(profile) {
    if (!mainNav) return;
    let link = mainNav.querySelector('a[href="/admin"]');
    if (!Array.isArray(profile.roles) || !profile.roles.some(role => ['ROLE_ADMIN', 'ROLE_LIBRARIAN'].includes(role))) {
      link?.remove();
      return;
    }
    if (!link) {
      link = document.createElement('a');
      link.href = '/admin';
      link.className = 'nav-link';
      link.textContent = 'Quản trị';
      mainNav.append(link);
    }
    const selected = currentPath === '/admin' || currentPath.startsWith('/admin/');
    link.classList.toggle('active', selected);
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }

  function showAccount() {
    const actions = document.querySelector('.user-actions');
    if (!actions) return;
    let profile = {};
    try { profile = JSON.parse(localStorage.getItem('libraryProfile') || '{}') || {}; }
    catch { localStorage.removeItem('libraryProfile'); }
    updateAdminLink(profile);
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
    const visible = (history ? loans.filter(loan => loan.status === 'RETURNED') : loans.filter(loan => loan.status !== 'RETURNED'))
      .sort((a, b) => history ? Number(b.id) - Number(a.id) : String(a.dueDate || '').localeCompare(String(b.dueDate || '')));
    const dateLabel = value => value ? String(value).split('-').reverse().join('/') : '—';
    const localToday = new Date().toLocaleDateString('sv-SE');
    const isOverdue = loan => loan.status === 'OVERDUE' || (loan.status === 'BORROWED' && loan.dueDate && loan.dueDate < localToday);
    const summary = document.getElementById('loanSummary');
    if (summary) {
      summary.hidden = false; summary.replaceChildren();
      const active = loans.filter(l => l.status !== 'RETURNED');
      const stats = history
        ? [['Phiếu đã trả', visible.length], ['Quyển đã trả', visible.reduce((n,l)=>n+(l.items||[]).reduce((m,i)=>m+Number(i.quantity||1),0),0)], ['Tổng phí mượn', visible.reduce((n,l)=>n+Number(l.rentalFee||0),0).toLocaleString('vi-VN')+' đ']]
        : [['Quyển đang mượn', active.reduce((sum,l) => sum + (l.items || []).filter(i => !i.returnedAt).reduce((n,i) => n + Number(i.quantity || 1),0),0)], ['Phiếu đang mượn', active.length], ['Phiếu quá hạn', active.filter(isOverdue).length]];
      for (const [label,value] of stats) {
        const stat = document.createElement('div'); stat.className = 'reading-stat';
        const number = document.createElement('strong'); number.textContent = value;
        const caption = document.createElement('span'); caption.textContent = label;
        stat.append(number, caption); summary.append(stat);
      }
    }
    const intro = document.querySelector('.page-intro p');
    if (intro) intro.textContent = history
      ? 'Mỗi cuốn sách là một chặng đường. Xem lại các phiếu đã trả xong và ngày hoàn trả của bạn.'
      : 'Theo dõi hạn trả và gia hạn để tiếp tục hành trình đọc của bạn.';
    loanPanel.replaceChildren();
    loanPanel.classList.add('reading-loaded');
    const heading = document.createElement('h3');
    heading.textContent = visible.length ? `${visible.length} phiếu mượn`
      : (history ? 'Bạn chưa có lịch sử mượn sách.' : 'Bạn không có sách đang mượn.');
    heading.className = 'reading-result';
    loanPanel.append(heading);
    if (!visible.length) {
      const explore = document.createElement('a'); explore.href = '/user/books'; explore.className = 'btn'; explore.textContent = 'Tìm cuốn sách tiếp theo →'; loanPanel.append(explore);
    }
    const statuses = { BORROWED: 'Đang mượn', RETURNED: 'Đã trả', OVERDUE: 'Quá hạn' };
    for (const loan of visible) {
      const card = document.createElement('article');
      card.className = 'reading-loan';
      const title = document.createElement('h3');
      const overdue = isOverdue(loan);
      title.className = 'reading-loan-title';
      card.classList.add(overdue ? 'loan-overdue' : loan.status === 'RETURNED' ? 'loan-returned' : 'loan-active');
      title.textContent = `Phiếu #${loan.id} — ${overdue ? statuses.OVERDUE : (statuses[loan.status] || loan.status)}`;
      const dates = document.createElement('p');
      dates.className = 'reading-dates';
      function updateDates(data) {
        dates.replaceChildren();
        const values = [['Ngày mượn', data.borrowDate], ['Hạn trả', data.dueDate]];
        if (data.returnDate) values.push(['Ngày trả', data.returnDate]);
        for (const [label, value] of values) {
          const block = document.createElement('span'); const caption = document.createElement('small'); caption.textContent = label;
          const number = document.createElement('strong'); number.textContent = dateLabel(value); block.append(caption, number); dates.append(block);
        }
      }
      updateDates(loan);
      let returning = false;
      const returnButtons = [];
      async function returnBooks(itemIds) {
        if (returning) return;
        if (!window.confirm(`Xác nhận trả ${itemIds.length} quyển? Tồn kho sẽ được cập nhật và khoản phạt quá hạn (nếu có) sẽ được tính.`)) return;
        returning = true; returnButtons.forEach(button => button.disabled = true);
        feedback.textContent = 'Đang xử lý trả sách...';
        try {
          const response = await fetch(`/api/v1/loans/${loan.id}/my-return`, {
            method: 'POST', headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify({itemIds, condition: 'NORMAL'})
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.message || 'Không thể trả sách. Vui lòng thử lại.');
          window.location.reload();
        } catch (error) {
          feedback.textContent = error.message;
          returning = false; returnButtons.forEach(button => button.disabled = false);
        }
      }
      const books = document.createElement('ul'); books.className = 'reading-books';
      for (const item of (loan.items || []).filter(item => history || !item.returnedAt)) {
        const row = document.createElement('li');
        row.className = 'reading-book';
        const cover = document.createElement('div'); cover.className = 'reading-cover';
        const monogram = document.createElement('span'); monogram.textContent = (item.book?.title || 'S').slice(0,1); cover.append(monogram);
        if (item.book?.coverImageUrl && /^(https?:\/\/|\/(?!\/))/.test(item.book.coverImageUrl)) {
          const image = document.createElement('img'); image.src = item.book.coverImageUrl; image.alt = `Bìa ${item.book.title}`; image.loading = 'lazy';
          image.addEventListener('error', () => { image.hidden = true; }); cover.append(image);
        }
        const info = document.createElement('div'); info.className = 'reading-book-info';
        const bookTitle = document.createElement(item.book?.id ? 'a' : 'strong'); bookTitle.textContent = item.book?.title || 'Sách';
        if (item.book?.id) bookTitle.href = `/user/books/${item.book.id}`;
        const author = document.createElement('span'); author.textContent = item.book?.author?.name || 'Tác giả đang cập nhật';
        const detail = document.createElement('small'); detail.textContent = `${item.copy?.code ? 'Mã quyển: ' + item.copy.code + ' · ' : ''}Số lượng: ${item.quantity || 1}`;
        if (item.returnedAt) detail.textContent += ` · Đã trả ${dateLabel(item.returnedAt)}`;
        info.append(bookTitle, author, detail); row.append(cover, info);
        if (!history && !item.returnedAt) {
          const returnOne = document.createElement('button'); returnOne.type = 'button'; returnOne.className = 'btn btn-secondary return-one'; returnOne.textContent = 'Trả quyển này';
          returnOne.addEventListener('click', () => returnBooks([item.id]));returnButtons.push(returnOne);row.append(returnOne);
        }
        books.append(row);
      }
      card.append(title, dates, books);
      if (!history) {
        const remaining = (loan.items || []).filter(item => !item.returnedAt);
        if (remaining.length) {
          const actions = document.createElement('div'); actions.className = 'reading-return-actions';
          const all = document.createElement('button'); all.type='button';all.className='btn';all.textContent=`Trả tất cả ${remaining.length} quyển còn lại`;
          all.addEventListener('click', () => returnBooks(remaining.map(item => item.id)));returnButtons.push(all);
          const hint=document.createElement('span');hint.textContent='Trả sách bình thường. Sách hỏng hoặc mất: liên hệ thủ thư để xử lý.';
          actions.append(hint,all);card.append(actions);
        }
      }
      const dueDate = loan.dueDate ? new Date(`${loan.dueDate}T00:00:00`) : null;
      const canRenew = !history && loan.status === 'BORROWED' && Number(loan.renewalCount || 0) < 1 && dueDate && dueDate >= new Date(new Date().toDateString());
      if (canRenew) {
        const renewal = document.createElement('div'); renewal.className = 'renewal-controls';
        const label = document.createElement('label'); label.textContent = 'Thời gian gia hạn ';
        const duration = document.createElement('select'); duration.setAttribute('aria-label', 'Số ngày gia hạn');
        for (let day = 1; day <= 7; day++) {
          const option = document.createElement('option'); option.value = String(day); option.textContent = `${day} ngày`; duration.append(option);
        }
        duration.value = '7'; label.append(duration);
        const renew = document.createElement('button'); renew.type = 'button'; renew.className = 'btn btn-secondary'; renew.textContent = 'Gia hạn';
        renew.addEventListener('click', async () => {
          const days = Number(duration.value);
          if (renew.disabled || !window.confirm(`Gia hạn phiếu mượn này thêm ${days} ngày?`)) return;
          duration.disabled = true;
          renew.disabled = true;
          try {
            const response = await fetch(`/api/v1/loans/${loan.id}/renew`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ days }) });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.message || 'Không thể gia hạn phiếu mượn.');
            updateDates({ ...loan, ...result });
            feedback.textContent = 'Gia hạn thành công. Hạn trả mới đã được cập nhật.';
            feedback.classList.add('success');
            renew.textContent = 'Đã gia hạn';
          } catch (error) { feedback.textContent = error.message; feedback.classList.remove('success'); renew.disabled = false; duration.disabled = false; }
        });
        renewal.append(label, renew); card.append(renewal);
      }
      const footer = document.createElement('div'); footer.className = 'reading-loan-footer';
      const fee = document.createElement('span'); fee.textContent = `Phí mượn: ${Number(loan.rentalFee || 0).toLocaleString('vi-VN')} đ`;
      const note = document.createElement('span'); note.textContent = loan.status === 'RETURNED' ? 'Cảm ơn bạn đã hoàn trả sách' : overdue ? 'Vui lòng liên hệ thư viện để trả sách' : Number(loan.renewalCount || 0) >= 1 ? 'Đã sử dụng lượt gia hạn' : 'Mỗi phiếu được gia hạn một lần';
      footer.append(fee, note); card.append(footer);
      const feedback = document.createElement('p'); feedback.className = 'form-message reading-feedback'; feedback.setAttribute('role','status'); feedback.setAttribute('aria-live','polite'); card.append(feedback);
      loanPanel.append(card);
    }
  }

  // Normal page navigation cannot attach a Bearer header. Load private data via fetch.
  if (token) {
    if (loanPanel) loanPanel.textContent = 'Đang tải tài khoản...';
    fetch('/api/v1/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        if (response.status === 401 || response.status === 403) {
          clearSession();
          if (accountPage) window.location.href = '/user/login';
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        if (!response.ok) throw new Error('Chưa tải được tài khoản. Vui lòng tải lại trang.');
        const profile = await response.json();
        localStorage.setItem('libraryProfile', JSON.stringify(profile));
        showAccount();
        if (!loanPanel) return;
        const loanResponse = await fetch('/api/v1/loans/my-loans', { headers: { Authorization: `Bearer ${token}` } });
        if (!loanResponse.ok) throw new Error('Chưa tải được phiếu mượn. Vui lòng tải lại trang.');
        const loans = await loanResponse.json();
        if (!Array.isArray(loans)) throw new Error('Dữ liệu phiếu mượn không hợp lệ.');
        showLoans(loans);
        if (loanPanel) fetch('/api/v1/fines/my-fines', { headers: { Authorization: `Bearer ${token}` } }).then(async response => {
          if (!response.ok) throw new Error('Chưa tải được danh sách khoản phạt.');
          const fines = await response.json();
          if (!fines.length) return;
          const section = document.createElement('section'); section.className = 'fine-list reading-fines';
          const heading = document.createElement('h3'); heading.textContent = 'Khoản phạt'; section.append(heading);
          for (const fine of fines) {
            const row = document.createElement('p');
            row.textContent = `Phiếu #${fine.loan?.id || '—'} · ${fine.reason || 'Khoản phạt'} · ${Number(fine.amount || 0).toLocaleString('vi-VN')} đ · ${fine.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}`;
            section.append(row);
          }
          loanPanel.append(section);
        }).catch(() => { const notice = document.createElement('p'); notice.className = 'form-message'; notice.textContent = 'Chưa tải được khoản phạt. Vui lòng tải lại trang để kiểm tra.'; loanPanel.append(notice); });
      })
      .catch(error => {
        if (loanPanel) loanPanel.textContent = error.message || 'Không thể kết nối máy chủ.';
      });
  } else {
    localStorage.removeItem('libraryProfile');
  }
});
