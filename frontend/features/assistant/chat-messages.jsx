import styles from './assistant.module.css';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function ChatMessages({ messages, busy }) {
  const latest = useRef(null);
  useEffect(() => {
    latest.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [messages, busy]);

  return (
    <div
      className={styles.messages}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <article className={styles.message}>
        <strong>Trợ lý Mộc</strong>
        <p>
          Chào bạn! Bạn muốn tìm sách gì hoặc cần hướng dẫn sử dụng thư viện?
        </p>
      </article>
      {messages.map((message, index) => (
        <article
          className={
            message.role === 'user'
              ? styles.message + ' ' + styles.userMessage
              : styles.message
          }
          key={index}
        >
          <strong>{message.role === 'user' ? 'Bạn' : 'Trợ lý Mộc'}</strong>
          {message.role === 'assistant' && message.mode !== 'ai' && (
            <span className={styles.mode}>
              {message.mode === 'fallback'
                ? 'AI tạm gián đoạn · Tra cứu thư viện'
                : 'Tra cứu thư viện'}
            </span>
          )}
          <p>{message.text}</p>
          {!!message.books?.length && (
            <ul className={styles.books}>
              {message.books.map((book) => (
                <li key={book.id}>
                  <Link href={'/books/' + book.id}>
                    <BookOpen size={18} aria-hidden="true" />
                    <span>
                      <b>{book.title}</b>
                      <small>
                        {book.author || 'Chưa cập nhật tác giả'} ·{' '}
                        {book.availableQuantity > 0
                          ? 'Còn ' + book.availableQuantity + ' cuốn'
                          : 'Tạm hết sách'}
                      </small>
                    </span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
      {busy && (
        <p role="status" className={styles.loading}>
          Trợ lý đang trả lời…
        </p>
      )}
      <div ref={latest} />
    </div>
  );
}
