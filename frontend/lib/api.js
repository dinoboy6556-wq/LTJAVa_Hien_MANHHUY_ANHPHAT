const API_ROOT = '/api/v1';

function emitApiCall(entry) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('moc:api-call', { detail: entry }));
}

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('library_token');
    if (token) headers.set('Authorization', 'Bearer ' + token);
  }
  const started = performance.now();
  let response;
  try {
    response = await fetch(API_ROOT + path, { ...options, method, headers, cache: 'no-store' });
    const text = await response.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }
    emitApiCall({ method, path: API_ROOT + path, status: response.status, duration: Math.round(performance.now() - started), ok: response.ok });
    if (!response.ok) throw new Error(data?.message || data?.error || (typeof data === 'string' ? data : 'API trả về HTTP ' + response.status));
    return data;
  } catch (error) {
    if (!response) emitApiCall({ method, path: API_ROOT + path, status: 'ERR', duration: Math.round(performance.now() - started), ok: false });
    throw error;
  }
}

export const api = {
  books: () => apiRequest('/books'),
  book: (id) => apiRequest('/books/' + id),
  relatedBooks: (id) => apiRequest('/books/' + id + '/related'),
  categories: () => apiRequest('/categories'),
  login: (body) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  loans: () => apiRequest('/loans/my-loans'),
  borrow: (body) => apiRequest('/loans', { method: 'POST', body: JSON.stringify(body) }),
  favorites: () => apiRequest('/favorites'),
  favorite: (id) => apiRequest('/favorites/' + id, { method: 'PUT' }),
  unfavorite: (id) => apiRequest('/favorites/' + id, { method: 'DELETE' }),
  reviews: (id) => apiRequest('/books/' + id + '/reviews'),
  saveReview: (id, body) => apiRequest('/books/' + id + '/reviews', { method: 'PUT', body: JSON.stringify(body) }),
  stats: () => apiRequest('/statistics/summary'),
};

export function formatApiError(error) {
  return error?.message || 'Không thể kết nối API. Kiểm tra Spring Boot và thử lại.';
}
