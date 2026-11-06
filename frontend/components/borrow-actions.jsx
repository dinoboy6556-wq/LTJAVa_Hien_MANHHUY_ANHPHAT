'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { addCart } from '../lib/cart';

export default function BorrowActions({ book, compact = false }) {
  const router = useRouter();
  const lock = useRef(false);
  const maxQuantity = Math.max(1, Number(book.availableQuantity || 0));
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [reserved, setReserved] = useState(false);

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem('library_token') || compact) return;
    Promise.all([api.favorites(), api.reservations()]).then(([favorites, reservations]) => {
      if (active) {
        setFavorite(favorites.some(item => (item.book?.id || item.id) === book.id));
        setReserved(reservations.some(item => item.book.id === book.id));
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [book.id, compact]);

  async function run(action) {
    if (lock.current) return;
    if (!localStorage.getItem('library_token')) {
      router.push('/login?next=' + encodeURIComponent('/books/' + book.id));
      return;
    }
    lock.current = true;
    setBusy(true);
    try { await action(); }
    catch (error) { setMessage(error.message); }
    finally { lock.current = false; setBusy(false); }
  }

  const add = now => run(async () => {
    const [profile, freshBook] = await Promise.all([api.profile(), api.book(book.id)]);
    addCart(profile.email, book.id, compact ? 1 : quantity, freshBook.availableQuantity);
    setMessage('Đã thêm vào giỏ.');
    if (now) router.push('/cart');
  });

  return <div className="borrow-actions">
    {!compact && <div className="quantity-field"><span>Số lượng</span><div className="quantity-stepper" aria-label="Chọn số lượng sách">
      <button type="button" aria-label="Giảm số lượng" disabled={busy || quantity <= 1} onClick={() => setQuantity(value => Math.max(1, value - 1))}><Minus size={15}/></button>
      <input type="number" min="1" max={maxQuantity} value={quantity} readOnly aria-label="Số lượng sách"/>
      <button type="button" aria-label="Tăng số lượng" disabled={busy || quantity >= maxQuantity} onClick={() => setQuantity(value => Math.min(maxQuantity, value + 1))}><Plus size={15}/></button>
    </div></div>}
    <div className="utility-row">
      <button className="secondary-button" disabled={busy || book.availableQuantity <= 0} onClick={() => add(false)}>Thêm vào giỏ</button>
      <button className="primary-button" disabled={busy || book.availableQuantity <= 0} onClick={() => add(true)}>Mượn ngay</button>
      {!compact && <>
        <button disabled={busy} className="secondary-button" onClick={() => run(async () => { await (favorite ? api.unfavorite(book.id) : api.favorite(book.id)); setFavorite(!favorite); setMessage(favorite ? 'Đã bỏ yêu thích.' : 'Đã lưu yêu thích.'); })}>{favorite ? '♥ Bỏ yêu thích' : '♡ Yêu thích'}</button>
        {(book.availableQuantity <= 0 || reserved) && <button disabled={busy} onClick={() => run(async () => { await (reserved ? api.cancelReservation(book.id) : api.reserve(book.id)); setReserved(!reserved); setMessage(reserved ? 'Đã hủy đăng ký.' : 'Đã đăng ký chờ, sách chưa được giữ riêng.'); })}>{reserved ? 'Hủy đăng ký chờ' : 'Đăng ký chờ sách'}</button>}
      </>}
    </div>
    {Number(book.salePrice) > 0 && book.availableQuantity > 0 &&
      <Link className="secondary-button purchase-link" href={'/buy/' + book.id}>Mua sách</Link>}
    <p className="action-feedback" role="status">{message}</p>
  </div>;
}
