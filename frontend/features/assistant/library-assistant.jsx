'use client';

import styles from './assistant.module.css';
import Link from 'next/link';
import { ArrowRight, BookOpen, MessageCircle, Trash2 } from 'lucide-react';
import ChatMessages from './chat-messages';
import ChatComposer from './chat-composer';
import { useLibraryChat } from './use-library-chat';

export default function LibraryAssistant() {
  const {
    signedIn,
    messages,
    storageError,
    draft,
    setDraft,
    busy,
    error,
    clearHistory,
    send,
  } = useLibraryChat();

  return (
    <main className={styles.page} data-library-chat-page>
      <div className={styles.heading}>
        <span className="eyebrow">ĐỒNG HÀNH CÙNG BẠN ĐỌC</span>
        <h1>
          <MessageCircle size={30} aria-hidden="true" /> Hỏi AI
        </h1>
        <p>
          Tìm cuốn sách phù hợp và giải đáp cách mượn, trả hoặc mua sách tại
          Mộc.
        </p>
      </div>
      {signedIn === null ? (
        <p>Đang tải…</p>
      ) : !signedIn ? (
        <section className={styles.login}>
          <BookOpen size={32} />
          <h2>Bắt đầu trò chuyện</h2>
          <p>Đăng nhập tài khoản độc giả để sử dụng trợ lý thư viện.</p>
          <Link className="primary-button" href="/login?next=%2Fassistant">
            Đăng nhập <ArrowRight size={17} />
          </Link>
        </section>
      ) : (
        <section
          className={styles.panel}
          aria-label="Trò chuyện với trợ lý thư viện"
        >
          <div className={styles.toolbar}>
            <span>Lưu hội thoại trên trình duyệt này</span>
            <button
              type="button"
              className="secondary-button"
              disabled={busy || !messages.length}
              onClick={clearHistory}
            >
              <Trash2 size={16} aria-hidden="true" /> Xóa hội thoại
            </button>
          </div>
          {storageError && (
            <p role="alert" className="error-alert">
              {storageError}
            </p>
          )}
          <ChatMessages messages={messages} busy={busy} />
          <ChatComposer
            draft={draft}
            setDraft={setDraft}
            busy={busy}
            error={error}
            send={send}
          />
        </section>
      )}
    </main>
  );
}
