import Link from 'next/link';
import { ArrowUp, BookOpen, Clock3, Heart, Library, UserRound } from 'lucide-react';
import SiteContent from './site-content';

const exploreLinks = [
  { href: '/books', label: 'Khám phá sách', icon: Library },
  { href: '/cart', label: 'Giỏ mượn sách', icon: BookOpen },
];

const readerLinks = [
  { href: '/account/loans', label: 'Sách đang mượn', icon: Clock3 },
  { href: '/account/history', label: 'Lịch sử đọc', icon: Clock3 },
  { href: '/account/favorites', label: 'Sách yêu thích', icon: Heart },
  { href: '/account/profile', label: 'Tài khoản của tôi', icon: UserRound },
];

export default function SiteFooter() {
  return <footer className="site-footer">
    <div className="container footer-inner">
      <section className="footer-about" aria-label="Giới thiệu thư viện Mộc">
        <Link className="footer-brand" href="/" aria-label="Mộc Library, về trang chủ">
          <span className="footer-brand-icon"><BookOpen size={21} /></span>
          <span><b>mộc<span>.</span></b><small>THƯ VIỆN CỦA BẠN</small></span>
        </Link>
        <p>Một góc nhỏ để tìm sách, lưu lại những cuốn yêu thích và theo dõi hành trình đọc của bạn.</p>
        <div className="footer-motto"><i /> Đọc chậm <span>·</span> Nghĩ sâu <span>·</span> Sống đẹp</div>
      </section>

      <nav className="footer-link-group" aria-label="Khám phá thư viện">
        <h3>Khám phá</h3>
        {exploreLinks.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon size={15} />{label}</Link>)}
        <SiteContent className="footer-site-content" />
      </nav>

      <nav className="footer-link-group" aria-label="Góc bạn đọc">
        <h3>Góc bạn đọc</h3>
        {readerLinks.map(({ href, label, icon: Icon }) => <Link href={href} key={href}><Icon size={15} />{label}</Link>)}
      </nav>

      <section className="footer-contact" aria-label="Liên hệ thư viện">
        <h3>Liên hệ thư viện</h3>
        <SiteContent mode="contacts" className="footer-contact-details"/>
        <Link href="/read/lien-he">Liên hệ & hỗ trợ</Link>
      </section>
    </div>

    <div className="footer-bottom">
      <div className="container footer-bottom-inner">
        <span>© {new Date().getFullYear()} Mộc Library. Dành cho những người yêu sách.</span>
        <span className="footer-bottom-note">Chậm lại một chút, mở ra một thế giới.</span>
        <a href="#top" className="footer-top-link">Lên đầu trang <ArrowUp size={14} /></a>
      </div>
    </div>
  </footer>;
}
