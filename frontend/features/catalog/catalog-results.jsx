import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
} from 'lucide-react';
import { BookCard } from './book-card';
import { CATALOG_PAGE_SIZE } from './use-catalog';

function CatalogPagination({ currentPage, totalPages, pageNumbers, setPage }) {
  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        disabled={currentPage === 1}
        onClick={() => setPage(currentPage - 1)}
      >
        <ChevronLeft size={17} />
      </button>
      {pageNumbers.map((n) => (
        <button
          className={n === currentPage ? 'page-active' : ''}
          onClick={() => setPage(n)}
          key={n}
        >
          {n}
        </button>
      ))}
      <span>
        Trang {currentPage}/{totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => setPage(currentPage + 1)}
      >
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}

export default function CatalogResults({ featured, catalog }) {
  const {
    loading,
    error,
    refresh,
    books,
    ratings,
    currentPage,
    totalPages,
    pageNumbers,
    setPage,
    resetSearch,
  } = catalog;
  const shown = featured ? books.slice(0, 4) : books;
  return (
    <>
      {loading ? (
        <div className="loading-grid">
          {Array.from({ length: CATALOG_PAGE_SIZE }).map((_, i) => (
            <div className="skeleton-card" key={i}>
              <div />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="state-panel">
          <CircleAlert size={25} />
          <h3>Chưa kết nối được thư viện</h3>
          <p>{error}</p>
          <button className="primary-button" onClick={refresh}>
            Thử lại <ArrowRight size={16} />
          </button>
          <small>Bạn có thể tải lại trang hoặc thử lại sau.</small>
        </div>
      ) : shown.length ? (
        <>
          <div className="book-grid">
            {shown.map((book, i) => (
              <BookCard
                book={book}
                index={(currentPage - 1) * CATALOG_PAGE_SIZE + i}
                rating={ratings[book.id] || { average: 0, count: 0 }}
                key={book.id}
              />
            ))}
          </div>
          {!featured && totalPages > 1 && (
            <CatalogPagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageNumbers={pageNumbers}
              setPage={setPage}
            />
          )}
        </>
      ) : (
        <div className="state-panel">
          <BookOpen size={25} />
          <h3>Chưa tìm thấy đầu sách</h3>
          <p>Thử xóa bộ lọc hoặc tìm bằng từ khóa khác.</p>
          <button className="text-button" onClick={resetSearch}>
            Xóa bộ lọc
          </button>
        </div>
      )}
    </>
  );
}
