'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BORROWING_POLICY_VERSION } from '../../components/borrowing-policy';
import { money } from '../../components/account-data';
import { api } from '../../lib/api';
import {
  readCart,
  saveCart,
  cartKey,
  checkoutAttempt,
  clearMatchedCart,
} from '../../lib/cart';

export async function loadCart() {
  const [profile, books, payments] = await Promise.all([
    api.profile(),
    api.books(),
    api.payments(),
  ]);
  return { profile, books, payments };
}

export function useBorrowCheckout(initial) {
  const email = initial.profile.email;
  const [items, setItems] = useState(() => readCart(email));
  const [days, setDays] = useState(14);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [method, setMethod] = useState('CASH');
  const [payments, setPayments] = useState(initial.payments);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const syncing = useRef(false);
  const books = new Map(initial.books.map((book) => [book.id, book]));
  const update = (next) => {
    saveCart(email, next);
    setItems(next);
  };
  const valid =
    items.length > 0 &&
    items.every(
      (item) =>
        books.has(item.bookId) &&
        books.get(item.bookId).availableQuantity >= item.quantity
    );
  const validDays = Number.isInteger(days) && days >= 1 && days <= 365;
  const pricePerCopy = (book) =>
    validDays
      ? Math.ceil(
          (Math.round(Number(book?.rentalPrice || 0) * 100) * days) / 1400
        )
      : 0;
  const dailyRate = (book) =>
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(
      Number(book?.rentalPrice || 0) / 14
    );
  const total = items.reduce(
    (sum, item) => sum + pricePerCopy(books.get(item.bookId)) * item.quantity,
    0
  );
  const copies = items.reduce((sum, item) => sum + item.quantity, 0);
  const canContinue = (p) =>
    p.method === 'PAYOS' &&
    ['PENDING', 'FAILED'].includes(p.status) &&
    !payments.some((next) => next.requestKey === 'retry-' + p.id);
  const pendingPayment = payments.some(
    (payment) => payment.status === 'PENDING'
  );

  const refresh = useCallback(
    async (options = {}) => {
      try {
        const current = await api.payments();
        await Promise.all(
          current
            .filter((p) => p.method === 'PAYOS' && p.status === 'PENDING')
            .map((p) => api.syncPayment(p.id))
        );
        const list = await api.payments();
        setPayments(list);
        let attempt;
        try {
          attempt = JSON.parse(
            localStorage.getItem(cartKey(email) + ':checkout') || 'null'
          );
        } catch {}
        const payment = list.find((item) => item.requestKey === attempt?.id);
        if (payment && ['PAID', 'UNPAID'].includes(payment.status)) {
          if (clearMatchedCart(email, JSON.parse(attempt.payload).items))
            setItems([]);
          localStorage.removeItem(cartKey(email) + ':checkout');
        }
        if (!options.silent && !options.preserveMessage)
          setMessage('Đã cập nhật trạng thái thanh toán.');
      } catch (error) {
        if (!options.silent) setMessage(error.message);
      }
    },
    [email]
  );

  const syncSilently = useCallback(async () => {
    if (syncing.current || lock.current || document.visibilityState === 'hidden')
      return;
    syncing.current = true;
    try {
      await refresh({ silent: true });
    } finally {
      syncing.current = false;
    }
  }, [refresh]);

  useEffect(() => {
    syncSilently();
    window.addEventListener('focus', syncSilently);
    document.addEventListener('visibilitychange', syncSilently);
    return () => {
      window.removeEventListener('focus', syncSilently);
      document.removeEventListener('visibilitychange', syncSilently);
    };
  }, [syncSilently]);

  useEffect(() => {
    if (!pendingPayment) return;
    const timer = setInterval(syncSilently, 8000);
    return () => clearInterval(timer);
  }, [pendingPayment, syncSilently]);

  async function resumePayment(id) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await api.resumePayment(id);
      if (result.requestKey && result.order)
        localStorage.setItem(
          cartKey(email) + ':checkout',
          JSON.stringify({
            id: result.requestKey,
            payload: JSON.stringify(result.order),
            method: 'PAYOS',
          })
        );
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'pay.payos.vn')
        throw Error('Liên kết chuyển khoản không hợp lệ.');
      window.location.assign(url.href);
    } catch (error) {
      setMessage(error.message);
      try {
        setPayments(await api.payments());
      } catch {}
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function cancelPayment(id) {
    if (
      lock.current ||
      !confirm(
        'Hủy yêu cầu mượn này? Sách vẫn giữ trong giỏ để bạn đặt mới hoặc đổi phương thức thanh toán.'
      )
    )
      return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      await api.cancelPayment(id);
      localStorage.removeItem(cartKey(email) + ':checkout');
      await refresh({ silent: true });
      setMessage(
        'Đã hủy yêu cầu. Bạn có thể sửa giỏ, đặt đơn mới hoặc chọn thanh toán trực tiếp.'
      );
    } catch (error) {
      setMessage(error.message);
      try {
        setPayments(await api.payments());
      } catch {}
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function restoreOrder(payment) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const order = await api.paymentOrder(payment.id);
      if (items.length && !confirm('Thay sách trong giỏ bằng yêu cầu đã lưu?'))
        return;
      update(order.items);
      setDays(order.days);
      setMethod('PAYOS');
      setMessage(
        'Đã khôi phục sách từ giao dịch. Kiểm tra số lượng và dùng Tiếp tục thanh toán.'
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function checkout() {
    if (lock.current) return;
    if (!policyAccepted) {
      setMessage('Vui lòng đọc và đồng ý quy định mượn/trả sách.');
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setMessage('Thời hạn mượn phải từ 1 đến 365 ngày.');
      return;
    }
    const payload = JSON.stringify({
      days,
      items,
      policyAccepted: true,
      policyVersion: BORROWING_POLICY_VERSION,
    });
    if (method === 'PAYOS') {
      let old;
      try {
        old = JSON.parse(
          localStorage.getItem(cartKey(email) + ':checkout') || 'null'
        );
      } catch {}
      const payment = payments.find((p) => p.requestKey === old?.id);
      if (
        old?.method === 'PAYOS' &&
        old.payload === payload &&
        payment &&
        ['FAILED', 'PENDING'].includes(payment.status)
      ) {
        await resumePayment(payment.id);
        return;
      }
    }
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const attempt = checkoutAttempt(email, payload, method);
      const result = await api.checkout(
        method,
        JSON.parse(payload),
        attempt.id
      );
      if (method === 'PAYOS') {
        const url = new URL(result.url);
        if (url.protocol !== 'https:')
          throw Error('Địa chỉ thanh toán không hợp lệ.');
        window.location.assign(url.href);
        return;
      }
      if (clearMatchedCart(email, items)) setItems([]);
      setMessage(
        `Đã tạo phiếu #${result.loanId}. Thanh toán ${money(result.amount)} tại thư viện.`
      );
      await refresh({ preserveMessage: true });
    } catch (error) {
      setMessage(error.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return {
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
  };
}
