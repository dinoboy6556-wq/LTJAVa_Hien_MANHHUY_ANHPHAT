import './globals.css';
import SiteHeader from '../components/site-header';
import ApiMonitor from '../components/api-monitor';

export const metadata = {
  title: 'Mộc Library — Chạm vào thế giới tri thức',
  description: 'Khám phá sách, theo dõi mượn trả và hành trình đọc của bạn tại Mộc Library.',
};

export default function RootLayout({ children }) {
  return <html lang="vi"><body><SiteHeader />{children}<footer className="site-footer"><div className="container footer-inner"><a className="wordmark" href="/">mộc<span>.</span></a><span>Đọc chậm · Nghĩ sâu · Sống đẹp</span><span>© {new Date().getFullYear()} Mộc Library</span></div></footer><ApiMonitor /></body></html>;
}
