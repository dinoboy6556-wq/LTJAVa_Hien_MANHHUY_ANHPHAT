import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { money } from '../../components/account-data';

export default function CartItems({
  items,
  books,
  copies,
  days,
  busy,
  update,
  pricePerCopy,
  dailyRate,
}) {
  return (
    <section className="cart-items-panel" aria-labelledby="cart-items-title">
      <header className="cart-panel-heading">
        <div>
          <span className="eyebrow">DANH SÁCH CỦA BẠN</span>
          <h2 id="cart-items-title">Sách muốn mượn</h2>
        </div>
        <span className="cart-count">{copies} quyển</span>
      </header>
      {items.length ? (
        <>
          <div className="cart-items-list">
            {items.map((item) => {
              const book = books.get(item.bookId);
              const maxQuantity = Math.min(
                100,
                Number(book?.availableQuantity || 0)
              );
              const insufficient = !book || item.quantity > maxQuantity;
              return (
                <article className="cart-item" key={item.bookId}>
                  <div
                    className={
                      'cart-book-art ' +
                      (item.bookId % 2 ? 'cover-moss' : 'cover-ochre')
                    }
                  >
                    <BookOpen size={25} />
                    <span>MỘC</span>
                  </div>
                  <div className="cart-book-info">
                    <Link
                      href={'/books/' + item.bookId}
                      className="cart-book-title"
                    >
                      {book?.title || 'Sách không còn trong thư viện'}
                    </Link>
                    <span>{book?.author?.name || 'Tác giả đang cập nhật'}</span>
                    <small
                      className={
                        insufficient ? 'cart-stock-low' : 'cart-stock-ok'
                      }
                    >
                      {book
                        ? insufficient
                          ? `Chỉ còn ${maxQuantity} cuốn — vui lòng điều chỉnh`
                          : `Còn ${maxQuantity} cuốn`
                        : 'Sách không khả dụng'}
                    </small>
                    <span className="cart-mobile-price">
                      Phí cho {days} ngày: {money(pricePerCopy(book))}/quyển
                    </span>
                  </div>
                  <div className="cart-item-price">
                    <small>PHÍ / QUYỂN / NGÀY</small>
                    <strong>≈ {dailyRate(book)} đ</strong>
                  </div>
                  <div className="cart-item-quantity">
                    <small>SỐ LƯỢNG</small>
                    <div className="cart-quantity-stepper">
                      <button
                        type="button"
                        aria-label={'Giảm số lượng ' + (book?.title || '')}
                        disabled={busy || item.quantity <= 1}
                        onClick={() =>
                          update(
                            items.map((current) =>
                              current.bookId === item.bookId
                                ? {
                                    ...current,
                                    quantity: Math.max(1, current.quantity - 1),
                                  }
                                : current
                            )
                          )
                        }
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={'Tăng số lượng ' + (book?.title || '')}
                        disabled={busy || item.quantity >= (maxQuantity || 1)}
                        onClick={() =>
                          update(
                            items.map((current) =>
                              current.bookId === item.bookId
                                ? { ...current, quantity: current.quantity + 1 }
                                : current
                            )
                          )
                        }
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total">
                    <small>THÀNH TIỀN</small>
                    <strong>{money(pricePerCopy(book) * item.quantity)}</strong>
                  </div>
                  <button
                    className="cart-remove"
                    type="button"
                    aria-label={'Xóa ' + (book?.title || 'sách')}
                    disabled={busy}
                    onClick={() =>
                      update(
                        items.filter(
                          (current) => current.bookId !== item.bookId
                        )
                      )
                    }
                  >
                    <Trash2 size={15} />
                    <span>Xóa sách</span>
                  </button>
                </article>
              );
            })}
          </div>
          <button
            type="button"
            className="cart-clear-button"
            disabled={busy}
            onClick={() => update([])}
          >
            <Trash2 size={14} /> Xóa toàn bộ giỏ
          </button>
        </>
      ) : (
        <div className="cart-empty">
          <span>
            <ShoppingBag size={28} />
          </span>
          <h3>Giỏ mượn đang trống</h3>
          <p>
            Thêm sách bạn muốn đọc vào đây. Bạn có thể xem số lượng còn trước
            khi gửi yêu cầu mượn.
          </p>
          <Link href="/books" className="primary-button">
            Khám phá sách <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
