document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('libraryToken');
  const message = document.getElementById('adminMessage');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const request = async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Không thể tải dữ liệu (${response.status}).`);
    return data;
  };
  document.getElementById('adminLogout').addEventListener('click', () => {
    localStorage.removeItem('libraryToken'); localStorage.removeItem('libraryProfile'); location.href = '/user/login';
  });
  if (!token) { message.textContent = 'Đăng nhập bằng tài khoản quản trị để tiếp tục.'; return; }

  const roles = ['ROLE_ADMIN', 'ROLE_LIBRARIAN', 'ROLE_USER'];
  const addStat = (label, value) => {
    const card = document.createElement('article'); card.className = 'admin-stat';
    const title = document.createElement('span'); title.textContent = label;
    const number = document.createElement('strong'); number.textContent = value;
    card.append(title, number); document.getElementById('statCards').append(card);
  };
  const renderUsers = users => {
    const tbody = document.getElementById('adminUsers'); tbody.replaceChildren();
    for (const user of users) {
      const row = document.createElement('tr');
      const identity = document.createElement('td'); identity.textContent = `${user.fullName || ''} · ${user.email}`;
      const roleCell = document.createElement('td');
      const roleChecks = roles.map(role => {
        const label = document.createElement('label'); label.className = 'admin-role';
        const input = document.createElement('input'); input.type = 'checkbox'; input.value = role; input.checked = user.roles.includes(role);
        label.append(input, document.createTextNode(role.replace('ROLE_', ''))); roleCell.append(label); return input;
      });
      const statusCell = document.createElement('td');
      const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.checked = user.enabled; enabled.setAttribute('aria-label', 'Tài khoản đang hoạt động');
      statusCell.append(enabled, document.createTextNode(user.enabled ? ' Đang hoạt động' : ' Đã khóa'));
      const action = document.createElement('td'); const save = document.createElement('button'); save.className = 'btn'; save.type = 'button'; save.textContent = 'Lưu';
      save.addEventListener('click', async () => {
        save.disabled = true;
        try {
          await request(`/api/v1/admin/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: enabled.checked, roles: roleChecks.filter(input => input.checked).map(input => input.value) }) });
          message.textContent = 'Đã cập nhật tài khoản.'; await load();
        } catch (error) { message.textContent = error.message; save.disabled = false; }
      });
      action.append(save); row.append(identity, roleCell, statusCell, action); tbody.append(row);
    }
  };
  async function load() {
    try {
      const summary = await request('/api/v1/statistics/summary');
      document.getElementById('statCards').replaceChildren();
      addStat('Đầu sách', summary.totalBooks); addStat('Sách hết hàng', summary.outOfStockBooks);
      addStat('Tài khoản', summary.totalUsers); addStat('Phiếu đang mượn', summary.activeLoans);
      addStat('Hóa đơn', summary.totalSales); addStat('Doanh thu bán sách', `${Number(summary.totalSalesRevenue || 0).toLocaleString('vi-VN')} đ`);
      renderUsers(await request('/api/v1/admin/users')); message.textContent = '';
    } catch (error) { message.textContent = error.message; }
  }
  document.querySelectorAll('[data-report]').forEach(button => button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const response = await fetch(`/api/v1/admin/reports/${button.dataset.report}.csv`, { headers });
      if (!response.ok) throw new Error('Không thể tải báo cáo. Kiểm tra quyền tài khoản.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = `library-${button.dataset.report}.csv`; link.click(); URL.revokeObjectURL(url);
    } catch (error) { message.textContent = error.message; }
    finally { button.disabled = false; }
  }));
  load();
});
