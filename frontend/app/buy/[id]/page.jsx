"use client";

import { useCallback, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, formatApiError } from '../../../lib/api';
import { AccountState, money, useAccount } from '../../../components/account-data';

export default function BuyBook() {
  const { id } = useParams();
  const router = useRouter();
  const loader = useCallback(() => api.book(id), [id]);
  const { data: book, error } = useAccount(loader);
  const [quantity, setQuantity] = useState('1');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const attempt = useRef(null);
  const lock = useRef(false);
  const limit = Math.min(100, book?.availableQuantity || 0);
  const valid = Number.isInteger(Number(quantity)) && Number(quantity) >= 1 && Number(quantity) <= limit;

  async function submit(event) {
    event.preventDefault();
    if (lock.current || !valid) return;
    if (!localStorage.getItem('library_token')) {
      router.push('/login?next=' + encodeURIComponent('/buy/' + id));
      return;
    }
    const body = { bookId: book.id, quantity: Number(quantity), unitPrice: book.salePrice };
    const snapshot = JSON.stringify(body);
    if (attempt.current?.snapshot !== snapshot) attempt.current = { snapshot, key: crypto.randomUUID() };
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      await api.purchase({ ...body, requestKey: attempt.current.key });
      router.push('/account/purchases');
    } catch (err) {
      setMessage(formatApiError(err));
      lock.current = false;
      setBusy(false);
    }
  }

  return <main className="container utility-page purchase-page">
    <Link href={'/books/' + id}>← Chi tiết sách</Link>
    <h1>Mua sách</h1>
    <AccountState data={book} error={error}/>
    {book && <section className="purchase-panel">
      <h2>{book.title}</h2>
      <p>{money(book.salePrice)} / quyển · Còn {limit} quyển có thể đặt</p>
      {Number(book.salePrice) > 0 && limit > 0 ? <form className="auth-form" onSubmit={submit}>
        <label>Số lượng mua<input type="number" min="1" max={limit} value={quantity} onChange={event => setQuantity(event.target.value)} required disabled={busy}/></label>
        <p><strong>Tổng tiền dự kiến:</strong> {valid ? money(Number(book.salePrice) * Number(quantity)) : '—'}</p>
        <p>Thanh toán và nhận sách tại thư viện. Đơn đặt mua chưa giữ sách trong kho.</p>
        {message && <p role="alert" className="error-alert">{message}</p>}
        <button className="primary-button" disabled={busy || !valid}>{busy ? 'Đang đặt mua…' : 'Đặt mua tại thư viện'}</button>
      </form> : <p>Sách hiện chưa thể đặt mua.</p>}
    </section>}
  </main>;
}
