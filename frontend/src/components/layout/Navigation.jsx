/**
 * Navigation.jsx — Exact port of Lovable's Navigation.tsx
 * Auth-aware: public links for guests, dashboard+profile for logged-in users.
 */
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import mockmateLogo from '../../assets/mockmate-logo.svg';
import { Menu, X, BookOpen, Users, Phone, BarChart3, LogIn, User, LogOut } from 'lucide-react';
import { navigation as nav } from '../../data/data.js';

const publicIconMap = { '/how-it-works': BookOpen, '/about': Users, '/contact': Phone };
const authIconMap = { '/dashboard': BarChart3 };

export default function Navigation() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setMenuOpen(false); }, [location.pathname]);

    const handleLogout = () => { logout(); navigate('/'); };
    const isActive = (path) => location.pathname === path;

    const publicLinks = nav.publicLinks || [
        { name: 'How It Works', path: '/how-it-works' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const authLinks = [{ name: 'Dashboard', path: '/dashboard' }];

    const navLinks = user ? authLinks : publicLinks;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? 'glass-card-ultimate border-b border-transparent backdrop-blur-3xl shadow-xl'
                    : 'bg-transparent border-b border-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center h-14 sm:h-16">

                    {/* Logo */}
                    <Link to={user ? '/dashboard' : '/'} className="flex items-center group shrink-0">
                        <img
                            src={mockmateLogo}
                            alt="MockMate AI"
                            className="h-8 sm:h-10 w-auto group-hover:scale-105 transition-transform duration-300"
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
                        {navLinks.map(item => {
                            const iconMap = user ? authIconMap : publicIconMap;
                            const Icon = iconMap[item.path];
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-xl transition-all duration-300 relative group overflow-hidden text-sm font-poppins font-semibold ${isActive(item.path)
                                            ? 'text-primary bg-primary/15 border border-primary/40'
                                            : 'text-muted-foreground hover:text-primary hover:bg-white/10 border border-transparent'
                                        }`}
                                >
                                    {Icon && <Icon className="w-4 h-4 group-hover:scale-110 transition-all duration-300" />}
                                    <span>{item.name}</span>
                                    {isActive(item.path) && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary-glow" />}
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Right section */}
                    <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 shrink-0">
                        {user ? (
                            <>
                                {/* User email */}
                                <span className="text-xs xl:text-sm text-muted-foreground font-montserrat truncate max-w-[160px]">
                                    {user.email}
                                </span>
                                {/* Profile icon button */}
                                <Link to="/profile">
                                    <Button variant="ghost" size="icon" className="hover:bg-primary/10 rounded-xl w-9 h-9">
                                        <User className="w-5 h-5" />
                                    </Button>
                                </Link>
                                {/* Sign out */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="text-muted-foreground hover:text-destructive text-sm"
                                >
                                    <LogOut className="w-4 h-4 mr-1.5" /> {nav.signOutButton || 'Sign Out'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-poppins font-semibold text-sm text-muted-foreground border-2 border-primary/30 hover:border-primary/60 bg-transparent hover:bg-white/5 transition-all no-underline"
                                >
                                    <LogIn className="w-4 h-4" /> {nav.loginButton || 'Login'}
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-poppins font-bold text-sm text-white no-underline bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_28px_hsl(var(--primary)/0.6)] hover:-translate-y-px transition-all"
                                >
                                    {nav.tryNowButton || 'Try Now'}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMenuOpen(o => !o)}
                        className="lg:hidden bg-transparent border-none cursor-pointer text-muted-foreground p-2"
                        aria-label="Toggle menu"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>

                {/* Mobile drawer */}
                {menuOpen && (
                    <div className="lg:hidden border-t border-white/20 pt-4 pb-6 animate-fade-in">
                        <div className="flex flex-col space-y-2">
                            {navLinks.map(item => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMenuOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all font-poppins font-semibold text-sm no-underline ${isActive(item.path)
                                            ? 'text-primary bg-primary/15 border border-primary/40'
                                            : 'text-muted-foreground hover:text-primary hover:bg-white/10'
                                        }`}
                                >
                                    <span>{item.name}</span>
                                </NavLink>
                            ))}

                            <div className="pt-3 border-t border-white/20 space-y-2">
                                {user ? (
                                    <>
                                        <Link
                                            to="/profile"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground border border-border no-underline hover:text-foreground transition-all"
                                        >
                                            <User className="w-4 h-4" /> Profile
                                        </Link>
                                        <button
                                            onClick={() => { handleLogout(); setMenuOpen(false); }}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-destructive border border-destructive/30 bg-transparent cursor-pointer hover:bg-destructive/10 transition-all"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/login"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-semibold text-muted-foreground border border-border no-underline"
                                        >
                                            {nav.loginButton || 'Login'}
                                        </Link>
                                        <Link
                                            to="/register"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-bold text-white no-underline bg-gradient-to-r from-primary to-primary/80"
                                        >
                                            {nav.tryNowButton || 'Try Now'}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
