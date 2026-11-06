export function subscribeSession(callback) {
  window.addEventListener('moc:session', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('moc:session', callback);
    window.removeEventListener('storage', callback);
  };
}

export function getSessionToken() {
  return localStorage.getItem('library_token') || '';
}

export function serverSessionToken() {
  return '';
}
