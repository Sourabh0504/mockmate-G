/**
 * Footer.jsx — Lovable-exact footer with 3-column layout.
 */
import { Link } from 'react-router-dom';
import { footer as f } from '../../data/data.js';
import mockmateLogo from '../../assets/mockmate-logo.svg';

export default function Footer() {
    return (
        <footer className="bg-card border-t border-border font-poppins">
            <div className="max-w-[1200px] mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <img src={mockmateLogo} alt="MockMate AI" className="h-8 w-auto" onError={e => { e.target.style.display = 'none'; }} />
                            <span className="font-bold text-base text-foreground">MockMate AI</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
                            {f.brandDescription}
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">{f.quickLinksHeading}</h3>
                        <ul className="space-y-2.5">
                            {f.quickLinks.map(link => (
                                <li key={link.path}>
                                    <Link to={link.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">{f.companyHeading}</h3>
                        <ul className="space-y-2.5">
                            {f.companyLinks.map(link => (
                                <li key={link.path}>
                                    <Link to={link.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline">
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-6 text-center">
                    <p className="text-xs text-muted-foreground">{f.copyright}</p>
                </div>
            </div>
        </footer>
    );
}
