import './globals.css';
import './customer.css';
import './footer.css';
import SiteHeader from '../components/site-header';
import SiteFooter from '../components/site-footer';

export const metadata = {
  title: 'Mộc Library — Chạm vào thế giới tri thức',
  description: 'Khám phá sách, theo dõi mượn trả và hành trình đọc của bạn tại Mộc Library.',
};

export default function RootLayout({ children }) {
  return <html lang="vi" data-scroll-behavior="smooth"><body id="top"><SiteHeader />{children}<SiteFooter /></body></html>;
}
