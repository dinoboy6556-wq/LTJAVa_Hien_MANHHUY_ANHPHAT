'use client';

import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import CatalogFilters from './catalog-filters';
import CatalogResults from './catalog-results';
import { useCatalog } from './use-catalog';

export default function BookShelf({ featured = false, initialQuery = '' }) {
  const catalog = useCatalog(initialQuery);
  const { loading, total, categories, filters, changeFilter, resetFilters } =
    catalog;
  return (
    <section className={featured ? 'shelf-section' : 'catalog-area'}>
      <CatalogFilters
        featured={featured}
        categories={categories}
        filters={filters}
        changeFilter={changeFilter}
        resetFilters={resetFilters}
      />
      {featured && (
        <div className="section-title-row">
          <div>
            <span className="eyebrow">ĐƯỢC BẠN ĐỌC YÊU THÍCH</span>
            <h2>
              Sách đáng để <em>mở hôm nay.</em>
            </h2>
            <p>Một vài gợi ý nhỏ cho hành trình đọc của bạn.</p>
          </div>
          <Link href="/books" className="text-link">
            Khám phá tất cả <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="shelf-meta">
        <span>
          {loading ? (
            'Đang tải danh mục…'
          ) : (
            <>
              <b>{total}</b> đầu sách trong bộ sưu tập
            </>
          )}
        </span>
        {!featured && (
          <span>
            <Heart size={14} /> Cập nhật từ thư viện Mộc
          </span>
        )}
      </div>
      <CatalogResults featured={featured} catalog={catalog} />
    </section>
  );
}
