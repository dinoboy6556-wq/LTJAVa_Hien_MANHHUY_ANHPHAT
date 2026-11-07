'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import BorrowActions from '../../components/borrow-actions';
import CardRating from '../../components/card-rating';

const money = (v) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
const palettes = [
  'cover-moss',
  'cover-ochre',
  'cover-rose',
  'cover-night',
  'cover-sky',
];

export function BookCard({ book, index = 0, rating }) {
  return (
    <article className="book-card">
      <Link
        href={'/books/' + book.id}
        className={'book-cover ' + palettes[index % palettes.length]}
      >
        {book.coverImageUrl && (
          <BookCover url={book.coverImageUrl} title={book.title} />
        )}
        <span className="cover-edition">MỘC · TUYỂN CHỌN</span>
        <span className="cover-orbit" />
        <BookOpen className="cover-icon" size={31} />
        <strong>{book.title}</strong>
        <small>{book.author?.name || 'Tác giả đang cập nhật'}</small>
        <span className="cover-mark">m.</span>
      </Link>
      <div className="book-info">
        <span className="book-category">
          {book.category?.name || 'SÁCH HAY'}
        </span>
        <Link href={'/books/' + book.id} className="book-title">
          {book.title}
        </Link>
        <p>{book.author?.name || 'Đang cập nhật tác giả'}</p>
        <CardRating bookId={book.id} initialSummary={rating} />
        <div className="book-card-bottom">
          <span
            className={
              book.availableQuantity > 0
                ? 'stock stock-available'
                : 'stock stock-empty'
            }
          >
            <i />
            {book.availableQuantity > 0
              ? 'Còn ' + book.availableQuantity + ' cuốn'
              : 'Tạm hết sách'}
          </span>
          <b>
            {money(book.rentalPrice)}
            <small>/cuốn · 14 ngày</small>
          </b>
        </div>
        <BorrowActions book={book} compact />
      </div>
    </article>
  );
}

function BookCover({ url, title }) {
  const [failed, setFailed] = useState(false);
  return failed ? null : (
    <Image
      className="actual-cover"
      src={url}
      alt={title}
      fill
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
