import styles from './assistant.module.css';
import { Send } from 'lucide-react';

const prompts = [
  'Gợi ý sách lập trình',
  'Cách mượn sách?',
  'Làm sao để mua sách?',
  'Gia hạn thế nào?',
];

export default function ChatComposer({ draft, setDraft, busy, error, send }) {
  return (
    <>
      <div className={styles.prompts}>
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={busy}
            onClick={() => setDraft(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="error-alert">
          {error}
        </p>
      )}
      <form onSubmit={send} className={styles.form}>
        <label htmlFor="library-chat-question">Câu hỏi của bạn</label>
        <div>
          <textarea
            id="library-chat-question"
            value={draft}
            maxLength={500}
            required
            rows={2}
            placeholder="Nhập tên sách, thể loại hoặc câu hỏi của bạn…"
            disabled={busy}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button
            type="submit"
            className="primary-button"
            disabled={busy || !draft.trim()}
          >
            <Send size={18} aria-hidden="true" />
            {busy ? 'Đang gửi…' : 'Gửi'}
          </button>
        </div>
        <small>{draft.length}/500 ký tự</small>
      </form>
    </>
  );
}
