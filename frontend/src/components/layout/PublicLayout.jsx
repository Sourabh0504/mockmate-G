/**
 * PublicLayout.jsx — wraps public pages with Navigation + Footer.
 */
import Navigation from './Navigation';
import Footer from './Footer';

export default function PublicLayout({ children }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navigation />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
