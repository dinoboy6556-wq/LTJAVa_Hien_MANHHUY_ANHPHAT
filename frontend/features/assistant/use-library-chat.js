'use client';

import { useEffect, useRef, useState } from 'react';
import { api, formatApiError } from '../../lib/api';

function readHistory(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved
      .slice(-60)
      .filter(
        (message) =>
          ['user', 'assistant'].includes(message?.role) &&
          typeof message.text === 'string'
      )
      .map((message) => ({
        role: message.role,
        text: message.text.slice(0, 12000),
        mode: ['ai', 'catalog', 'fallback'].includes(message.mode)
          ? message.mode
          : 'catalog',
        books: Array.isArray(message.books)
          ? message.books
              .filter(
                (book) =>
                  Number.isSafeInteger(book?.id) &&
                  book.id > 0 &&
                  typeof book.title === 'string' &&
                  (book.author == null || typeof book.author === 'string') &&
                  Number.isInteger(book.availableQuantity)
              )
              .slice(0, 6)
          : [],
      }));
  } catch {
    return [];
  }
}

export function useLibraryChat() {
  const [signedIn, setSignedIn] = useState(null);
  const [conversation, setConversation] = useState({ key: null, messages: [] });
  const { messages } = conversation;
  const [storageError, setStorageError] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const sessionVersion = useRef(0);

  useEffect(() => {
    const update = () => {
      sessionVersion.current += 1;
      let key = null;
      try {
        const user = JSON.parse(localStorage.getItem('library_user') || 'null');
        const identity = user?.id || user?.email?.trim().toLowerCase();
        if (localStorage.getItem('library_token') && identity) {
          key = 'moc:chat:v1:' + encodeURIComponent(String(identity));
        }
      } catch {
        key = null;
      }
      setSignedIn(Boolean(key));
      setConversation({ key, messages: key ? readHistory(key) : [] });
      setDraft('');
      setStorageError('');
      setError('');
    };
    update();
    const storageChanged = (event) => {
      if (['library_token', 'library_user', null].includes(event.key)) update();
    };
    window.addEventListener('moc:session', update);
    window.addEventListener('storage', storageChanged);
    return () => {
      sessionVersion.current += 1;
      window.removeEventListener('moc:session', update);
      window.removeEventListener('storage', storageChanged);
    };
  }, []);

  function persistHistory(messagesToSave) {
    if (!conversation.key) return;
    try {
      localStorage.setItem(conversation.key, JSON.stringify(messagesToSave));
      setStorageError('');
    } catch {
      setStorageError(
        'Trình duyệt chưa lưu được hội thoại. Vui lòng kiểm tra dung lượng hoặc quyền lưu trữ.'
      );
    }
  }

  function clearHistory() {
    if (
      sending.current ||
      !window.confirm('Xóa toàn bộ hội thoại với trợ lý trên trình duyệt này?')
    )
      return;
    persistHistory([]);
    setConversation((current) => ({ ...current, messages: [] }));
    setDraft('');
    setError('');
  }

  async function send(event) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || sending.current || !signedIn) return;
    const version = sessionVersion.current;
    sending.current = true;
    setBusy(true);
    setError('');
    setDraft('');
    const history = messages
      .slice(-6)
      .map(({ role, text }) => ({ role, content: text.slice(0, 1000) }));
    const withQuestion = [...messages, { role: 'user', text: question }];
    setConversation({ ...conversation, messages: withQuestion });
    try {
      const reply = await api.libraryChat(question, history);
      if (version === sessionVersion.current) {
        const next = [...withQuestion, { role: 'assistant', ...reply }].slice(
          -60
        );
        persistHistory(next);
        setConversation({ ...conversation, messages: next });
      }
    } catch (err) {
      if (version !== sessionVersion.current) return;
      setError(formatApiError(err));
      setDraft(question);
      setConversation(conversation);
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return {
    signedIn,
    messages,
    storageError,
    draft,
    setDraft,
    busy,
    error,
    clearHistory,
    send,
  };
}
