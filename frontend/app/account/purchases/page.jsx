"use client";

import { useState } from 'react';
import Link from 'next/link';
import { api, formatApiError } from '../../../lib/api';
import { AccountState, money, useAccount } from '../../../components/account-data';

const statuses = { PENDING: 'Chờ thanh toán tại thư viện', PAID: 'Đã thanh toán', CANCELLED: 'Đã hủy' };

export default function Purchases() {
  const { data, error, reload } = useAccount(api.purchases);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function cancel(id) {
    if (busy || !confirm('Hủy đơn mua này?')) return;
    setBusy(true);
    setMessage('');
    try {
      await api.cancelPurchase(id);
      await reload();
    } catch (err) {
      setMessage(formatApiError(err));
    } finally {
      setBusy(false);
    }
  }

  return <main className="container utility-page purchase-page">
    <Link href="/account/profile">← Hồ sơ của tôi</Link>
    <h1>Đơn mua sách</h1>
    <AccountState data={data} error={error}/>
    {message && <p className="error-alert" role="alert">{message}</p>}
    {data?.length === 0 && <p>Bạn chưa có đơn mua sách. <Link href="/books">Khám phá sách</Link></p>}
    <div className="purchase-list">{data?.map(order => <article className="purchase-panel" key={order.id}>
      <small>Đơn #{order.id}</small>
      <h2><Link href={'/books/' + order.bookId}>{order.title}</Link></h2>
      <p>{order.quantity} quyển × {money(order.unitPrice)} · <strong>{money(order.total)}</strong></p>
      <p>{statuses[order.status]}{order.saleId && ' · Hóa đơn #' + order.saleId}</p>
      {order.status === 'PENDING' && <button className="secondary-button" disabled={busy} onClick={() => cancel(order.id)}>Hủy đơn mua</button>}
    </article>)}</div>
  </main>;
}
