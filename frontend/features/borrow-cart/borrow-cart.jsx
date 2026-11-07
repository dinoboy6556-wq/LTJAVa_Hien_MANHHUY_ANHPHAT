'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import BorrowSteps from '../../components/borrow-steps';
import { AccountState, useAccount } from '../../components/account-data';
import CartItems from './cart-items';
import CheckoutSummary from './checkout-summary';
import PaymentHistory from './payment-history';
import PendingPayments from './pending-payments';
import { loadCart, useBorrowCheckout } from './use-borrow-checkout';

export default function BorrowCart() {
  const state = useAccount(loadCart);
  return (
    <main className="container utility-page cart-page">
      <nav className="breadcrumb">
        <Link href="/">Trang chủ</Link>
        <span>/</span>
        <b>Giỏ mượn</b>
      </nav>
      <header className="cart-heading">
        <div>
          <span className="eyebrow">BƯỚC 2 · XÁC NHẬN MƯỢN</span>
          <h1>Giỏ mượn sách</h1>
          <p>
            Kiểm tra sách, chọn thời hạn mượn và phương thức thanh toán trước
            khi gửi yêu cầu.
          </p>
        </div>
        <Link href="/books" className="cart-back-link">
          <ArrowLeft size={16} /> Tiếp tục chọn sách
        </Link>
      </header>
      <BorrowSteps current={2} />
      <AccountState data={state.data} error={state.error} />
      {state.data && (
        <CartBody key={state.data.profile.email} initial={state.data} />
      )}
    </main>
  );
}

function CartBody({ initial }) {
  const {
    items,
    books,
    copies,
    days,
    setDays,
    busy,
    update,
    pricePerCopy,
    dailyRate,
    pendingPayment,
    validDays,
    method,
    setMethod,
    total,
    valid,
    policyAccepted,
    setPolicyAccepted,
    checkout,
    payments,
    canContinue,
    restoreOrder,
    resumePayment,
    cancelPayment,
    refresh,
    message,
  } = useBorrowCheckout(initial);

  return (
    <>
      <div className="cart-policy-note">
        <ShieldCheck size={17} />
        <span>
          Phí mượn tính theo số ngày bạn chọn và làm tròn lên đến đồng cho mỗi
          quyển. Sách được giữ khi yêu cầu được xác nhận.
        </span>
      </div>
      {message && (
        <div
          className={
            message.startsWith('Đã tạo')
              ? 'cart-feedback cart-feedback-success'
              : 'cart-feedback'
          }
          role="status"
        >
          {message}
          {message.startsWith('Đã tạo') && (
            <Link href="/account/loans">
              Theo dõi phiếu mượn <ArrowRight size={15} />
            </Link>
          )}
        </div>
      )}
      <PendingPayments
        payments={payments}
        canContinue={canContinue}
        busy={busy}
        restoreOrder={restoreOrder}
        resumePayment={resumePayment}
        cancelPayment={cancelPayment}
      />
      <div className="cart-layout">
        <CartItems
          items={items}
          books={books}
          copies={copies}
          days={days}
          busy={busy}
          update={update}
          pricePerCopy={pricePerCopy}
          dailyRate={dailyRate}
        />
        <CheckoutSummary
          pendingPayment={pendingPayment}
          days={days}
          setDays={setDays}
          validDays={validDays}
          busy={busy}
          method={method}
          setMethod={setMethod}
          copies={copies}
          total={total}
          valid={valid}
          hasItems={items.length > 0}
          policyAccepted={policyAccepted}
          setPolicyAccepted={setPolicyAccepted}
          checkout={checkout}
        />
      </div>
      <PaymentHistory
        payments={payments}
        busy={busy}
        refresh={refresh}
        canContinue={canContinue}
        resumePayment={resumePayment}
      />
    </>
  );
}
