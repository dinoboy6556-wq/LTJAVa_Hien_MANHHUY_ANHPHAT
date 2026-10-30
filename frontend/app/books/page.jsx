import BookShelf from '../../components/book-shelf';

export default async function BooksPage({ searchParams }) {
  const params = await searchParams;
  return <main className="page-main"><section className="page-heading container"><div className="breadcrumb"><a href="/">Trang chủ</a><span>/</span><b>Khám phá sách</b></div><div className="page-heading-grid"><div><span className="eyebrow"><span className="eyebrow-line"/> BỘ SƯU TẬP MỘC</span><h1>Những trang sách<br/><em>đang chờ bạn.</em></h1><p>Từ một ý tưởng nhỏ đến cả thế giới mới — tìm cuốn sách tiếp theo của bạn.</p></div><div className="catalog-side-note"><span>01</span><i/><b>ĐỌC CHẬM<br/>SỐNG SÂU</b></div></div></section><section className="container"><BookShelf initialQuery={params?.q || ''}/></section></main>;
}
