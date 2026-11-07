import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function BookQuestions({ questions, signedIn, busy, onSubmit }) {
  const [question, setQuestion] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (await onSubmit(question)) setQuestion('');
  }

  return (
    <div className="book-questions">
      <h3>
        <MessageCircle size={20} /> Hỏi thư viện
      </h3>
      {signedIn && (
        <form className="book-question-form" onSubmit={submit}>
          <label htmlFor="book-question">Câu hỏi về sách</label>
          <textarea
            id="book-question"
            required
            maxLength={1200}
            rows={3}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Bạn cần tìm hiểu gì về cuốn sách này?"
          />
          <button className="primary-button" disabled={busy}>
            {busy ? 'Đang gửi…' : 'Gửi câu hỏi'}
          </button>
        </form>
      )}
      {questions.map((item) => (
        <article className="book-question-card" key={item.id}>
          <strong>{item.reader || 'Bạn đọc Mộc'}</strong>
          <p>{item.question}</p>
          {item.answer ? (
            <div className="book-question-answer">
              <b>Thư viện trả lời</b>
              <p>{item.answer}</p>
            </div>
          ) : (
            <small>Đang chờ thư viện trả lời</small>
          )}
        </article>
      ))}
      {!questions.length && (
        <p className="empty-inline">Chưa có câu hỏi về cuốn sách này.</p>
      )}
    </div>
  );
}
