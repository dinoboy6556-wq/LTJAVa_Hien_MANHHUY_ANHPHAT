import Link from 'next/link';
import './globals.css';
import './customer.css';
import SiteContent from '../components/site-content';
import SiteHeader from '../components/site-header';

export const metadata = {
  title: 'Mộc Library — Chạm vào thế giới tri thức',
  description: 'Khám phá sách, theo dõi mượn trả và hành trình đọc của bạn tại Mộc Library.',
};

export default function RootLayout({ children }) {
  return <html lang="vi" data-scroll-behavior="smooth"><body><SiteHeader />{children}<footer className="site-footer"><div className="container footer-inner"><Link className="wordmark" href="/">mộc<span>.</span></Link><span>Đọc chậm · Nghĩ sâu · Sống đẹp</span><span>© {new Date().getFullYear()} Mộc Library</span></div><SiteContent/></footer></body></html>;
}
