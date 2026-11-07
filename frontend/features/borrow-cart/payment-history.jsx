import Link from 'next/link';
import { Banknote, CheckCircle2, CreditCard, RefreshCw } from 'lucide-react';
import { money } from '../../components/account-data';

const statuses = {
  CANCELLED: 'Đã hủy yêu cầu',
  PENDING: 'Chờ xác nhận chuyển khoản',
  UNPAID: 'Chờ thanh toán tại quầy',
  PAID: 'Đã thanh toán',
  FAILED: 'Đã hủy / hết hạn — chưa thanh toán',
  REVIEW_REQUIRED: 'Đã nhận tiền — cần thư viện xử lý',
};

export default function PaymentHistory({
  payments,
  busy,
  refresh,
  canContinue,
  resumePayment,
}) {
  return (
    <section className="payment-history">
      <header>
        <div>
          <span className="eyebrow">LỊCH SỬ GIAO DỊCH</span>
          <h2>Theo dõi thanh toán</h2>
          <p>Trạng thái thanh toán được cập nhật tự động.</p>
        </div>
        <button className="secondary-button" disabled={busy} onClick={refresh}>
          <RefreshCw size={15} /> Kiểm tra trạng thái
        </button>
      </header>
      {payments.length ? (
        <div className="payment-list">
          {payments.map((payment) => (
            <article className="payment-row" key={payment.id}>
              <span className="payment-method-icon">
                {payment.method === 'CASH' ? (
                  <Banknote size={19} />
                ) : (
                  <CreditCard size={19} />
                )}
              </span>
              <div className="payment-row-info">
                <b>
                  {payment.method === 'CASH'
                    ? 'Thanh toán tại thư viện'
                    : 'Chuyển khoản ngân hàng'}
                </b>
                <small>
                  Mã giao dịch {payment.transactionNo || payment.id} ·{' '}
                  {payment.createdAt
                    ? new Date(payment.createdAt).toLocaleString('vi-VN')
                    : 'Thời gian chưa cập nhật'}
                </small>
              </div>
              <strong>{money(payment.amount)}</strong>
              <span
                className={
                  'payment-status ' +
                  (payment.status === 'PAID'
                    ? 'payment-status-done'
                    : ['FAILED', 'CANCELLED'].includes(payment.status)
                      ? 'payment-status-failed'
                      : 'payment-status-wait')
                }
              >
                {statuses[payment.status] || payment.status}
              </span>
              {canContinue(payment) && (
                <button
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => resumePayment(payment.id)}
                >
                  Tiếp tục thanh toán
                </button>
              )}
              {payment.loanId && (
                <Link href="/account/loans">Phiếu #{payment.loanId}</Link>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="payment-empty">
          <CheckCircle2 size={18} />
          <span>Chưa có giao dịch thanh toán nào.</span>
        </div>
      )}
    </section>
  );
}
