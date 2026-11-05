const API_ROOT = '/api/v1';

export async function apiRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('library_token');
    if (token) headers.set('Authorization', 'Bearer ' + token);
  }
  let response;
  try {
    response = await fetch(API_ROOT + path, { ...options, method, headers, cache: 'no-store' });
    const text = await response.text();
    let data = null;
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }

    if(response.status===401){['library_token','library_user'].forEach(k=>localStorage.removeItem(k));window.dispatchEvent(new Event('moc:session'));}
    if (!response.ok) throw new Error(data?.message || data?.error || (typeof data === 'string' ? data : 'API trả về HTTP ' + response.status));
    return data;
  } catch (error) {

    throw error;
  }
}

export const api = {
  updateProfile: (body) => apiRequest('/profile',{method:'PUT',body:JSON.stringify(body)}),
  returnLoan: (id,itemIds) => apiRequest(`/loans/${id}/my-return`,{method:'POST',body:JSON.stringify({condition:'NORMAL',...(itemIds?{itemIds}:{})})}),
  renew: (id,days) => apiRequest(`/loans/${id}/renew`,{method:'POST',body:JSON.stringify({days})}),
  fines: () => apiRequest('/fines/my-fines'),
  reservations: () => apiRequest('/reservations'),
  reserve: (id) => apiRequest('/reservations/'+id,{method:'PUT'}),
  cancelReservation: (id) => apiRequest('/reservations/'+id,{method:'DELETE'}),
  notifications: () => apiRequest('/notifications'),
  payments: () => apiRequest('/payments/my'),
  resumePayment: (id) => apiRequest(`/payments/payos/${id}/resume`,{method:'POST'}),
  syncPayment: (id) => apiRequest(`/payments/payos/${id}/sync`,{method:'POST'}),
  checkout: (method,body,key) => apiRequest(method==='CASH'?'/payments/cash':method==='PAYOS'?'/payments/payos/checkout':'/payments/checkout',{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(body)}),
  content: () => apiRequest('/content/catalog'),
  read: (slug) => apiRequest('/content/read/'+encodeURIComponent(slug)),
  siteContent: () => apiRequest('/content/public'),
  profile: () => apiRequest('/profile'),
  updateAvatar: (avatarData) => apiRequest('/profile/avatar', { method: 'PUT', body: JSON.stringify({ avatarData }) }),
  homeSelections: () => apiRequest('/books/home-selections'),
  changePassword: (body) => apiRequest('/auth/change-password',{method:'POST',body:JSON.stringify(body)}),
  catalog: (params) => apiRequest('/books/catalog?'+new URLSearchParams(params)),
  books: () => apiRequest('/books'),
  bookRatings: () => apiRequest('/books/ratings'),
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
  reactions: (id) => apiRequest('/books/' + id + '/reactions'),
  react: (id, reaction) => apiRequest('/books/' + id + '/reactions', { method: 'PUT', body: JSON.stringify({ reaction }) }),
  stats: () => apiRequest('/statistics/summary'),
};

export function formatApiError(error) {
  return error?.message || 'Chưa thể kết nối thư viện. Vui lòng thử lại sau.';
}
