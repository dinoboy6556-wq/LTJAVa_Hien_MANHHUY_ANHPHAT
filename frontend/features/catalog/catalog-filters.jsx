import { Sparkles } from 'lucide-react';

export default function CatalogFilters({
  featured,
  categories,
  filters,
  changeFilter,
  resetFilters,
}) {
  const { query, author, sort, min, max, availability, category } = filters;
  return (
    <>
      {!featured && (
        <div className="catalog-filters" aria-label="Bộ lọc sách">
          <div className="filter-grid">
            <label className="filter-query">
              Tìm kiếm
              <input
                value={query}
                onChange={(event) => changeFilter('query', event.target.value)}
                placeholder="Tên sách, tác giả hoặc thể loại"
              />
            </label>
            <label>
              Tác giả
              <input
                value={author}
                onChange={(event) => changeFilter('author', event.target.value)}
                placeholder="Tên tác giả"
              />
            </label>
            <label>
              Sắp xếp
              <select
                aria-label="Sắp xếp sách"
                value={sort}
                onChange={(event) => changeFilter('sort', event.target.value)}
              >
                <option value="title">Tên A–Z</option>
                <option value="rental">Phí mượn thấp</option>
                <option value="available">Còn sách trước</option>
              </select>
            </label>
            <label>
              Phí từ (đ)
              <input
                type="number"
                min="0"
                value={min}
                placeholder="Không giới hạn"
                onChange={(event) => changeFilter('min', event.target.value)}
              />
            </label>
            <label>
              Phí đến (đ)
              <input
                type="number"
                min="0"
                value={max}
                placeholder="Không giới hạn"
                onChange={(event) => changeFilter('max', event.target.value)}
              />
            </label>
            <label>
              Tình trạng
              <select
                aria-label="Tình trạng sách"
                value={availability}
                onChange={(event) =>
                  changeFilter('availability', event.target.value)
                }
              >
                <option value="">Tất cả</option>
                <option value="available">Còn sách</option>
                <option value="unavailable">Hết sách</option>
              </select>
            </label>
            <button className="reset-filters" onClick={resetFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}
      <div className="category-row">
        {categories.map((name, i) => (
          <button
            key={name}
            type="button"
            aria-pressed={category === name}
            className={
              category === name ? 'category-chip selected' : 'category-chip'
            }
            onClick={() => changeFilter('category', name)}
          >
            {i === 0 && <Sparkles size={14} />} {name}
          </button>
        ))}
      </div>
    </>
  );
}
