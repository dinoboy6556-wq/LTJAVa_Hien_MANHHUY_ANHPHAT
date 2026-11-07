import {
  ArrowRight,
  Banknote,
  Clock3,
  CreditCard,
  Minus,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import BorrowingPolicy from '../../components/borrowing-policy';
import { money } from '../../components/account-data';

export default function CheckoutSummary({
  pendingPayment,
  days,
  setDays,
  validDays,
  busy,
  method,
  setMethod,
  copies,
  total,
  valid,
  hasItems,
  policyAccepted,
  setPolicyAccepted,
  checkout,
}) {
  return (
    <aside className="cart-checkout-panel">
      {pendingPayment && (
        <p className="cart-pending-hint">
          Có yêu cầu chuyển khoản đang chờ. Hãy tiếp tục hoặc hủy yêu cầu phía
          trên trước khi đặt đơn khác.
        </p>
      )}
      <div className="cart-panel-heading">
        <div>
          <span className="eyebrow">TÓM TẮT</span>
          <h2>Thông tin mượn</h2>
        </div>
      </div>
      <div className="cart-form-field">
        <label htmlFor="cart-duration">
          <Clock3 size={15} /> Thời hạn mượn
        </label>
        <div className="cart-duration-input">
          <button
            type="button"
            aria-label="Giảm số ngày mượn"
            disabled={busy || !validDays || days <= 1}
            onClick={() => setDays(days - 1)}
          >
            <Minus size={16} />
          </button>
          <input
            id="cart-duration"
            aria-label="Số ngày mượn"
            type="number"
            min="1"
            max="365"
            step="1"
            inputMode="numeric"
            value={days}
            disabled={busy}
            onChange={(event) =>
              setDays(
                event.target.value === '' ? '' : Number(event.target.value)
              )
            }
          />
          <span>ngày</span>
          <button
            type="button"
            aria-label="Tăng số ngày mượn"
            disabled={busy || !validDays || days >= 365}
            onClick={() => setDays(days + 1)}
          >
            <Plus size={16} />
          </button>
        </div>
        {!validDays && (
          <small className="cart-days-error" role="alert">
            Vui lòng nhập số nguyên từ 1 đến 365.
          </small>
        )}
      </div>
      <fieldset className="cart-payment-options">
        <legend>Phương thức thanh toán</legend>
        <label
          className={
            method === 'CASH' ? 'payment-option selected' : 'payment-option'
          }
        >
          <input
            type="radio"
            name="payment"
            value="CASH"
            checked={method === 'CASH'}
            disabled={busy}
            onChange={() => setMethod('CASH')}
          />
          <span className="payment-method-icon">
            <Banknote size={18} />
          </span>
          <span>
            <b>Thanh toán tại thư viện</b>
            <small>Thanh toán trực tiếp tại quầy</small>
          </span>
          <i />
        </label>
        <label
          className={
            method === 'PAYOS' ? 'payment-option selected' : 'payment-option'
          }
        >
          <input
            type="radio"
            name="payment"
            value="PAYOS"
            checked={method === 'PAYOS'}
            disabled={busy}
            onChange={() => setMethod('PAYOS')}
          />
          <span className="payment-method-icon">
            <CreditCard size={18} />
          </span>
          <span>
            <b>Chuyển khoản ngân hàng</b>
            <small>Chuyển đến cổng thanh toán an toàn</small>
          </span>
          <i />
        </label>
      </fieldset>
      <div className="cart-total-lines">
        <div>
          <span>{copies} quyển sách</span>
          <strong>{money(total)}</strong>
        </div>
        <div>
          <span>Thời hạn</span>
          <strong>{validDays ? days + ' ngày' : 'Chưa chọn'}</strong>
        </div>
      </div>
      <div className="cart-total">
        <span>Tổng phí mượn</span>
        <strong>{money(total)}</strong>
      </div>
      {!valid && hasItems && (
        <p className="cart-validation" role="alert">
          Có sách không đủ số lượng hoặc không còn khả dụng. Vui lòng chỉnh lại
          giỏ.
        </p>
      )}
      {pendingPayment && (
        <p className="cart-pending-note">
          <Clock3 size={15} /> Bạn có giao dịch đang chờ. Hãy kiểm tra trạng
          thái trước khi tạo giao dịch mới.
        </p>
      )}
      <BorrowingPolicy expanded />
      <label className="borrowing-policy-agreement">
        <input
          type="checkbox"
          checked={policyAccepted}
          disabled={busy}
          onChange={(e) => setPolicyAccepted(e.target.checked)}
        />
        <span>Tôi đã đọc và đồng ý quy định mượn/trả sách</span>
      </label>
      <button
        className="primary-button cart-checkout-button"
        disabled={
          !valid || !validDays || !policyAccepted || busy || pendingPayment
        }
        onClick={checkout}
      >
        {busy
          ? 'Đang xử lý…'
          : pendingPayment
            ? 'Đang chờ thanh toán'
            : 'Xác nhận mượn'}{' '}
        <ArrowRight size={17} />
      </button>
      <p className="cart-secure-note">
        <ShieldCheck size={15} /> Chưa phát sinh thanh toán cho đến khi xác
        nhận.
      </p>
    </aside>
  );
}
