const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../../main/resources/static/js/user.js'), 'utf8');
class Element {
  constructor() { this.children = []; this.events = {}; this.style = {}; this.classList = { add() {}, remove() {}, toggle() {} }; this.textContent = ''; }
  setAttribute() {}
  removeAttribute() {}
  getAttribute(name) { return this[name]; }
  addEventListener(name, handler) { this.events[name] = handler; }
  replaceChildren(...children) { this.children = children; this.textContent = ''; }
  append(...children) { this.children.push(...children); }
}
function setup({ pathname = '/user/borrowed', token = 'test-token', status = 200, loans = [], roles = [], loginResponse } = {}) {
  const storage = new Map(token ? [['libraryToken', token], ['libraryProfile', JSON.stringify({ fullName: 'Huy' })]] : []);
  const actions = new Element(), panel = new Element(), intro = new Element();
  const bookLogin = { hidden: false }, bookBorrow = { hidden: true };
  const message = new Element(), button = new Element(), form = new Element();
  form.querySelector = selector => selector === '#authMessage' ? message : selector.startsWith('button') ? button : null;
  const nav = new Element();
  nav.querySelector = selector => nav.children.find(link => selector === `a[href="${link.href}"]`);
  const window = { location: { pathname }, confirm: () => true };
  const calls = [];
  const links = ['/user', '/user/books', '/user/borrowed', '/user/history'].map(href => ({
    href, selected: false, attributes: {},
    getAttribute() { return href; },
    setAttribute(k, v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; }
  }));
  links.forEach(link => link.classList = { toggle: (_, selected) => link.selected = selected });
  const context = {
    document: {
      addEventListener: (_, fn) => fn(),
      getElementById: id => id === 'bookLoginLink' ? bookLogin : id === 'bookBorrowPanel' ? bookBorrow : pathname === '/user/login' && id === 'loginForm' ? form : null,
      querySelector: selector => ({ '.topbar nav': nav, '.user-actions': actions, 'main .empty-state': panel, '.page-intro p': intro })[selector],
      querySelectorAll: () => links,
      createElement: () => new Element()
    },
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    window,
    FormData: class { get(key) { return key === 'email' ? 'user@example.com' : 'password'; } },
    setTimeout: fn => fn(),
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { status, ok: status < 400, json: async () => url.endsWith('/login') ? loginResponse : url.endsWith('/my-fines') ? [] : url.endsWith('/profile') ? { fullName: 'Huy', roles } : loans };
    }
  };
  vm.runInNewContext(source, context);
  return { storage, actions, panel, window, calls, form, message, links, bookLogin, bookBorrow, nav };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
test('login stores token/profile and opens the account', async () => {
  const app = setup({ pathname: '/user/login', token: null, loginResponse: { token: 'new-token', fullName: 'Huy', email: 'user@example.com' } });
  app.form.events.submit({ preventDefault() {} });
  await flush();
  assert.equal(app.storage.get('libraryToken'), 'new-token');
  assert.equal(JSON.parse(app.storage.get('libraryProfile')).fullName, 'Huy');
  assert.equal(app.window.location.href, '/user/borrowed');
});
test('login without a token is not reported as success', async () => {
  const app = setup({ pathname: '/user/login', token: null, loginResponse: {} });
  app.form.events.submit({ preventDefault() {} });
  await flush();
  assert.equal(app.storage.has('libraryToken'), false);
  assert.equal(app.window.location.href, undefined);
  assert.match(app.message.textContent, /token/);
});
test('restores account, sends Bearer token and excludes returned loans', async () => {
  const app = setup({ loans: [{ id: 1, status: 'BORROWED', items: [{ book: { title: '<script>alert(1)</script>' }, quantity: 2 }] }, { id: 2, status: 'RETURNED' }] });
  await flush();
  assert.equal(app.calls[0].options.headers.Authorization, 'Bearer test-token');
  assert.equal(app.actions.children[0].textContent, 'Huy');
  assert.equal(app.panel.children.length, 2);
  assert.equal(app.panel.children[1].children[2].children[0].textContent, '<script>alert(1)</script> — Số lượng: 2');
  app.actions.children[1].events.click();
  assert.equal(app.storage.has('libraryToken'), false);
  assert.equal(app.storage.has('libraryProfile'), false);
  assert.equal(app.window.location.href, '/user/login');
});
test('history includes returned loans', async () => {
  const app = setup({ pathname: '/user/history', loans: [{ id: 1, status: 'RETURNED' }] });
  await flush();
  assert.equal(app.panel.children.length, 2);
});
test('expired credentials are cleared and account redirects to login', async () => {
  for (const status of [401, 403]) {
    const app = setup({ status });
    await flush();
    assert.equal(app.storage.has('libraryToken'), false);
    assert.equal(app.window.location.href, '/user/login');
  }
});
test('server errors do not destroy the session', async () => {
  const app = setup({ status: 500 });
  await flush();
  assert.equal(app.storage.get('libraryToken'), 'test-token');
  assert.match(app.panel.textContent, /tải lại/);
});
test('guests do not request private data', async () => {
  const app = setup({ token: null });
  await flush();
  assert.equal(app.calls.length, 0);
});
test('navigation marks the current section, including book detail and root', () => {
  for (const [pathname, expected] of [['/', '/user'], ['/user', '/user'], ['/user/books', '/user/books'], ['/user/books/1', '/user/books'], ['/user/history', '/user/history'], ['/user/profile', undefined]]) {
    const app = setup({ pathname, token: null });
    const selected = app.links.filter(link => link.selected);
    assert.equal(selected.length, expected ? 1 : 0);
    if (expected) {
      assert.equal(selected[0].href, expected);
      assert.equal(selected[0].attributes['aria-current'], 'page');
    }
  }
});
test('account name links to the profile page', async () => {
  const app = setup();
  await flush();
  assert.equal(app.actions.children[0].href, '/user/profile');
});
test('authenticated book detail offers borrowing instead of login', async () => {
  const app = setup({ pathname: '/user/books/1' });
  await flush();
  assert.equal(app.bookLogin.hidden, true);
  assert.equal(app.bookBorrow.hidden, false);
});
test('guest and expired sessions do not show borrowing controls', async () => {
  for (const options of [{ token: null }, { status: 401 }]) {
    const app = setup({ pathname: '/user/books/1', ...options });
    await flush();
    assert.equal(app.bookLogin.hidden, false);
    assert.equal(app.bookBorrow.hidden, true);
  }
});

 test('server profile restores missing admin role on home and profile navigation', async () => {
  for (const pathname of ['/user/profile', '/user', '/user/books']) {
    const app = setup({ pathname, roles: ['ROLE_ADMIN'] });
    await flush();
    assert.equal(app.calls[0].url, '/api/v1/profile');
    assert.deepEqual(JSON.parse(app.storage.get('libraryProfile')).roles, ['ROLE_ADMIN']);
    assert.equal(app.nav.children.filter(link => link.href === '/admin').length, 1);
    assert.equal(app.calls.some(call => call.url.endsWith('/my-loans')), false);
  }
});
test('reader does not receive an admin navigation link', async () => {
  const app = setup({ pathname: '/user', roles: ['ROLE_USER'] });
  await flush();
  assert.equal(app.nav.children.some(link => link.href === '/admin'), false);
});

test('past due borrowed loan displays overdue and cannot be renewed', async () => {
  const app = setup({loans:[{id:1,status:'BORROWED',dueDate:'2000-01-01',items:[]}]});
  await flush();
  assert.match(app.panel.children[1].children[0].textContent,/Quá hạn/);
  assert.equal(app.panel.children[1].children.length,3);
});

test('renewal sends the selected number of days', async () => {
 const app=setup({loans:[{id:12,status:'BORROWED',dueDate:'2099-01-01',items:[]}]});await flush();
 const controls=app.panel.children[1].children[3];const select=controls.children[0].children[0];
 assert.equal(select.children.length,7);select.value='3';
 await controls.children[1].events.click();
 const request=app.calls.find(c=>c.url.endsWith('/12/renew'));
 assert.equal(JSON.parse(request.options.body).days,3);
});
