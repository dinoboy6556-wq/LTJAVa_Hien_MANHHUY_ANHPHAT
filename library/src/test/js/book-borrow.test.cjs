const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../../main/resources/static/js/book-borrow.js'), 'utf8');
function setup(status = 200, quantity = '1') {
  const button = { disabled: false }, message = { classList: { add() {}, remove() {} } };
  const form = { dataset: { bookId: '5' }, querySelector: () => button, addEventListener: (_, handler) => form.submit = handler };
  const storage = new Map([['libraryToken', 'token'], ['libraryProfile', '{}']]);
  const calls = [], window = { location: {} };
  vm.runInNewContext(source, {
    document: { addEventListener: (_, fn) => fn(), getElementById: id => id === 'bookBorrowForm' ? form : message },
    localStorage: { getItem: key => storage.get(key), removeItem: key => storage.delete(key) },
    window, FormData: class { get(key) { return key === 'quantity' ? quantity : '14'; } },
    fetch: async (url, options) => { calls.push({url, options}); return { status, ok: status === 200, json: async () => ({ message: 'Sách không đủ tồn kho' }) }; }
  });
  return { form, button, message, calls, window, storage };
}
test('borrow submits selected book with token and blocks duplicate submits', async () => {
  const app = setup();
  await Promise.all([app.form.submit({preventDefault(){}}), app.form.submit({preventDefault(){}})]);
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].options.headers.Authorization, 'Bearer token');
  assert.deepEqual(JSON.parse(app.calls[0].options.body), {days:14,items:[{bookId:5,quantity:1}]});
  assert.equal(app.window.location.href, '/user/borrowed');
});
test('stock failure keeps session and allows retry', async () => {
  const app = setup(400);
  await app.form.submit({preventDefault(){}});
  assert.equal(app.storage.get('libraryToken'), 'token');
  assert.equal(app.button.disabled, false);
  assert.match(app.message.textContent, /tồn kho/);
});
test('expired session requires login', async () => {
  const app = setup(401);
  await app.form.submit({preventDefault(){}});
  assert.equal(app.storage.has('libraryToken'), false);
  assert.equal(app.window.location.href, '/user/login');
});
test('invalid quantities are not submitted', async () => {
  const app = setup(200, '0');
  await app.form.submit({preventDefault(){}});
  assert.equal(app.calls.length, 0);
});