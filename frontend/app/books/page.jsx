import Link from 'next/link';
import BookShelf from '../../features/catalog/book-shelf';

export default async function BooksPage({ searchParams }) {
  const params = await searchParams;
  return <main className="page-main"><section className="page-heading container"><div className="breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><b>Khám phá sách</b></div><div className="page-heading-grid"><div><span className="eyebrow"><span className="eyebrow-line"/> BỘ SƯU TẬP MỘC</span><h1>Khám phá sách</h1><p>Từ một ý tưởng nhỏ đến cả thế giới mới — tìm cuốn sách tiếp theo của bạn.</p></div></div></section><section className="container"><BookShelf key={params?.q || ""} initialQuery={params?.q || ''}/></section></main>;
}
