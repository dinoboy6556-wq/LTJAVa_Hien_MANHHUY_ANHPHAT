import { Trash2 } from 'lucide-react';
import { money } from '../../components/account-data';

export default function PendingPayments({
  payments,
  canContinue,
  busy,
  restoreOrder,
  resumePayment,
  cancelPayment,
}) {
  const resumable = payments.filter(canContinue).slice(0, 5);
  if (!resumable.length) return null;
  return (
    <section
      className="unpaid-orders"
      aria-label="Yêu cầu mượn chưa thanh toán"
    >
      <header>
        <h2>Yêu cầu mượn chưa thanh toán</h2>
        <p>
          Đơn vẫn được lưu khi bạn đóng hoặc hủy trang QR. Tiếp tục sẽ mở link
          còn hiệu lực hoặc tạo link mới cho đúng sách đã chọn. Hủy yêu cầu để
          đặt mới hoặc đổi phương thức.
        </p>
      </header>
      {resumable.map((p) => (
        <article key={p.id}>
          <div>
            <b>{money(p.amount)}</b>
            <small>
              Mã {p.id} ·{' '}
              {p.status === 'PENDING'
                ? 'Đang tự kiểm tra chuyển khoản…'
                : 'Link đã hủy hoặc hết hạn'}
            </small>
          </div>
          <div>
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => restoreOrder(p)}
            >
              Xem lại sách
            </button>
            <button
              className="primary-button"
              disabled={busy}
              onClick={() => resumePayment(p.id)}
            >
              Tiếp tục thanh toán
            </button>
            <button
              className="cancel-payment-button"
              disabled={busy}
              onClick={() => cancelPayment(p.id)}
            >
              <Trash2 size={14} /> Hủy yêu cầu
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
