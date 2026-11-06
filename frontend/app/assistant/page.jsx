'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, MessageCircle, Send, Trash2 } from 'lucide-react';
import { api, formatApiError } from '../../lib/api';

const prompts = ['Gợi ý sách lập trình', 'Cách mượn sách?', 'Làm sao để mua sách?', 'Gia hạn thế nào?'];

function readHistory(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.slice(-60).filter(message =>
      ['user', 'assistant'].includes(message?.role) && typeof message.text === 'string'
    ).map(message => ({
      role: message.role,
      text: message.text.slice(0, 12000),
      mode: ['ai', 'catalog', 'fallback'].includes(message.mode) ? message.mode : 'catalog',
      books: Array.isArray(message.books) ? message.books.filter(book =>
        Number.isSafeInteger(book?.id) && book.id > 0 && typeof book.title === 'string'
        && (book.author == null || typeof book.author === 'string')
        && Number.isInteger(book.availableQuantity)
      ).slice(0, 6) : [],
    }));
  } catch {
    return [];
  }
}

export default function AssistantPage() {
  const [signedIn, setSignedIn] = useState(null);
  const [conversation, setConversation] = useState({ key: null, messages: [] });
  const { messages } = conversation;
  const [storageError, setStorageError] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const sessionVersion = useRef(0);
  const latest = useRef(null);

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
    const storageChanged = event => {
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

  useEffect(() => {
    latest.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, busy]);

  useEffect(() => {
    if (!conversation.key || busy) return;
    try {
      localStorage.setItem(conversation.key, JSON.stringify(conversation.messages.slice(-60)));
      setStorageError('');
    } catch {
      setStorageError('Trình duyệt chưa lưu được hội thoại. Vui lòng kiểm tra dung lượng hoặc quyền lưu trữ.');
    }
  }, [conversation, busy]);

  function clearHistory() {
    if (sending.current || !window.confirm('Xóa toàn bộ hội thoại với trợ lý trên trình duyệt này?')) return;
    setConversation(current => ({ ...current, messages: [] }));
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
    const history = messages.slice(-6).map(({ role, text }) => ({ role, content: text.slice(0, 1000) }));
    setConversation(current => ({ ...current, messages: [...current.messages, { role: 'user', text: question }] }));
    try {
      const reply = await api.libraryChat(question, history);
      if (version === sessionVersion.current) {
        setConversation(current => ({ ...current, messages: [...current.messages, { role: 'assistant', ...reply }].slice(-60) }));
      }
    } catch (err) {
      if (version !== sessionVersion.current) return;
      setError(formatApiError(err));
      setDraft(question);
      setConversation(current => ({ ...current, messages: current.messages.slice(0, -1) }));
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  return <main className="library-chat-page">
    <div className="library-chat-heading">
      <span className="eyebrow">ĐỒNG HÀNH CÙNG BẠN ĐỌC</span>
      <h1><MessageCircle size={30} aria-hidden="true" /> Hỏi AI</h1>
      <p>Tìm cuốn sách phù hợp và giải đáp cách mượn, trả hoặc mua sách tại Mộc.</p>
    </div>
    {signedIn === null ? <p>Đang tải…</p> : !signedIn ?
      <section className="library-chat-login"><BookOpen size={32} /><h2>Bắt đầu trò chuyện</h2>
        <p>Đăng nhập tài khoản độc giả để sử dụng trợ lý thư viện.</p>
        <Link className="primary-button" href="/login?next=%2Fassistant">Đăng nhập <ArrowRight size={17} /></Link>
      </section> :
      <section className="library-chat-panel" aria-label="Trò chuyện với trợ lý thư viện">
        <div className="library-chat-toolbar"><span>Lưu hội thoại trên trình duyệt này</span>
          <button type="button" className="secondary-button" disabled={busy || !messages.length} onClick={clearHistory}><Trash2 size={16} aria-hidden="true" /> Xóa hội thoại</button>
        </div>
        {storageError && <p role="alert" className="error-alert">{storageError}</p>}
        <div className="library-chat-messages" role="log" aria-live="polite" aria-relevant="additions">
          <article className="library-chat-message assistant"><strong>Trợ lý Mộc</strong>
            <p>Chào bạn! Bạn muốn tìm sách gì hoặc cần hướng dẫn sử dụng thư viện?</p>
          </article>
          {messages.map((message, index) => <article className={'library-chat-message ' + message.role} key={index}>
            <strong>{message.role === 'user' ? 'Bạn' : 'Trợ lý Mộc'}</strong>
            {message.role === 'assistant' && message.mode !== 'ai' && <span className="library-chat-mode">{message.mode === 'fallback' ? 'AI tạm gián đoạn · Tra cứu thư viện' : 'Tra cứu thư viện'}</span>}
            <p>{message.text}</p>
            {!!message.books?.length && <ul className="library-chat-books">{message.books.map(book =>
              <li key={book.id}><Link href={'/books/' + book.id}><BookOpen size={18} aria-hidden="true" />
                <span><b>{book.title}</b><small>{book.author || 'Chưa cập nhật tác giả'} · {book.availableQuantity > 0 ? 'Còn ' + book.availableQuantity + ' cuốn' : 'Tạm hết sách'}</small></span>
                <ArrowRight size={17} aria-hidden="true" /></Link></li>)}</ul>}
          </article>)}
          {busy && <p role="status" className="library-chat-loading">Trợ lý đang trả lời…</p>}
          <div ref={latest} />
        </div>
        <div className="library-chat-prompts">{prompts.map(prompt => <button key={prompt} type="button" disabled={busy} onClick={() => setDraft(prompt)}>{prompt}</button>)}</div>
        {error && <p role="alert" className="error-alert">{error}</p>}
        <form onSubmit={send} className="library-chat-form">
          <label htmlFor="library-chat-question">Câu hỏi của bạn</label>
          <div><textarea id="library-chat-question" value={draft} maxLength={500} required rows={2}
            placeholder="Nhập tên sách, thể loại hoặc câu hỏi của bạn…" disabled={busy} onChange={event => setDraft(event.target.value)} />
            <button type="submit" className="primary-button" disabled={busy || !draft.trim()}><Send size={18} aria-hidden="true" />{busy ? 'Đang gửi…' : 'Gửi'}</button></div>
          <small>{draft.length}/500 ký tự</small>
        </form>
      </section>}
  </main>;
}
