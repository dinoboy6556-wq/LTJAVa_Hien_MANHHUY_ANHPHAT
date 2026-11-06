"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-react';
import { api, formatApiError } from '../../../lib/api';
import { subscribeSession, getSessionToken, serverSessionToken } from '../../../lib/session';
import { useAccount, AccountState } from '../../../components/account-data';
import { ContactDetails } from '../../../components/site-content';

const rememberKey = slug => 'moc:reading:' + slug;

export default function ReadPage() {
  const { slug } = useParams();
  const loader = useCallback(() => api.read(slug), [slug]);
  const { data, error } = useAccount(loader);
  const session = useSyncExternalStore(subscribeSession, getSessionToken, serverSessionToken);
  const [resume, setResume] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(rememberKey(slug)) || 'null'); } catch {}
    const frame = requestAnimationFrame(() => {
      setResume(saved?.scroll || 0);
      setMessage('');
    });
    return () => cancelAnimationFrame(frame);
  }, [slug, session]);

  useEffect(() => {
    if (!data) return;
    let timer;
    const save = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          localStorage.setItem(rememberKey(slug), JSON.stringify({
            scroll: window.scrollY, title: data.title, time: Date.now(),
          }));
        } catch {}
      }, 350);
    };
    window.addEventListener('scroll', save);
    return () => {
      window.removeEventListener('scroll', save);
      clearTimeout(timer);
    };
  }, [data, slug]);

  async function confirmReading() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await api.recordReading(slug);
      setMessage(result.message);
    } catch (issue) {
      setMessage(formatApiError(issue));
    } finally {
      setBusy(false);
    }
  }

  return <main className="container utility-page reader-page">
    <Link className="reader-back" href="/library"><ArrowLeft size={16}/> Thư viện online</Link>
    <AccountState data={data} error={error}/>
    {data && <>
      <header className="reader-heading">
        <span className="eyebrow">{data.kind === 'EBOOK' ? 'SÁCH ĐIỆN TỬ' : data.kind === 'POST' ? 'TIN THƯ VIỆN' : 'THÔNG TIN THƯ VIỆN'}</span>
        <h1>{data.title}</h1>
        {data.bookId && <Link href={'/books/' + data.bookId}><BookOpen size={16}/> Xem thông tin đầu sách</Link>}
      </header>
      {resume > 200 && <button className="secondary-button reader-resume" onClick={() => {
        window.scrollTo({ top: resume, behavior: 'smooth' });
        setResume(0);
      }}>Đọc tiếp vị trí đã lưu</button>}
      {data.kind === 'PAGE' && slug === 'lien-he' && <ContactDetails/>}
      <article className="reading-text"><div>{data.body}</div></article>
      {data.kind === 'EBOOK' && data.bookId && <section className="reading-confirmation">
        {session ? <button className="primary-button" disabled={busy} onClick={confirmReading}>
          <CheckCircle2 size={17}/>{busy ? 'Đang lưu…' : 'Xác nhận đã đọc'}
        </button> : <Link href="/login">Đăng nhập để lưu sách đã đọc</Link>}
        {message && <p role="status">{message}</p>}
        <Link href={'/books/' + data.bookId + '#reviews'}>Xem đánh giá và hỏi đáp</Link>
      </section>}
      <Link className="reader-back" href="/library">← Chọn nội dung khác</Link>
    </>}
  </main>;
}
