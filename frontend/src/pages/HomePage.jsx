/**
 * HomePage.jsx — Lovable-exact landing page, full Tailwind.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { home } from '../data/data.js';

const logoModules = import.meta.glob('../assets/logos/*.svg', { eager: true });
const getLogoSrc = (name) => logoModules[`../assets/logos/${name.toLowerCase()}.svg`]?.default || null;

const FEATURE_COLORS = [
    'text-primary border-primary/30 bg-primary/10',
    'text-secondary border-secondary/30 bg-secondary/10',
    'text-accent border-accent/30 bg-accent/10',
    'text-primary border-primary/30 bg-primary/10',
    'text-secondary border-secondary/30 bg-secondary/10',
    'text-accent border-accent/30 bg-accent/10',
];
const FEATURE_ICONS = ['🎤', '🧠', '📊', '🔒', '⚡', '🎯'];

function LogoRow({ companies, animClass }) {
    return (
        <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-card to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-card to-transparent z-10" />
            <div className={`flex ${animClass} gap-3 w-max`}>
                {[0, 1].map(setIdx => (
                    <div key={setIdx} className="flex gap-3">
                        {companies.map((name, i) => (
                            <div key={`${setIdx}-${i}`} className="glass-card-enhanced p-2.5 rounded-xl flex items-center justify-center min-w-[120px] md:min-w-[140px] h-12 hover:scale-105 transition-all duration-300 cursor-pointer">
                                {getLogoSrc(name)
                                    ? <img src={getLogoSrc(name)} alt={name} className="h-5 max-w-[90px] object-contain opacity-60 brightness-0 invert" />
                                    : <span className="text-[11px] text-muted-foreground font-semibold tracking-wide">{name}</span>
                                }
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function HomePage() {
    const [scrollY, setScrollY] = useState(0);
    useEffect(() => {
        const fn = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <div className="font-poppins">

            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="relative min-h-[92vh] flex items-center justify-center py-20 px-6 overflow-hidden bg-background">
                <div className="absolute inset-0 bg-grid-pattern" />
                <div className="absolute inset-0 bg-mesh-hero pointer-events-none" />

                {/* Floating particles */}
                {[...Array(8)].map((_, i) => (
                    <div key={i} className={`absolute w-1.5 h-1.5 rounded-full animate-float opacity-20 pointer-events-none ${['bg-primary', 'bg-secondary', 'bg-accent'][i % 3]}`}
                        style={{ left: `${8 + i * 11}%`, top: `${12 + i * 10}%`, animationDelay: `${i * 0.4}s`, animationDuration: `${3 + i * 0.4}s` }} />
                ))}

                <div className="max-w-4xl w-full text-center relative z-10 animate-fade-in" style={{ transform: `translateY(${scrollY * 0.03}px)` }}>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 border border-primary/30 bg-gradient-to-r from-primary/15 to-accent/10 backdrop-blur-sm">
                        <span className="text-sm text-primary font-semibold">✨ {home.hero.badge}</span>
                    </div>

                    {/* Title */}
                    <h1 className="font-black leading-none tracking-tight mb-0" style={{ fontSize: 'clamp(52px,9vw,110px)' }}>
                        <span className="text-primary">{home.hero.titleBrand1}</span>
                        <span className="text-foreground">{home.hero.titleBrand2}</span>
                    </h1>

                    <p className="font-light text-muted-foreground tracking-widest my-3" style={{ fontSize: 'clamp(18px,3.5vw,42px)' }}>
                        {home.hero.subtitle}
                    </p>

                    <p className="text-muted-foreground max-w-xl mx-auto mb-9 leading-relaxed font-montserrat" style={{ fontSize: 'clamp(15px,2vw,19px)' }}>
                        {home.hero.description}{' '}
                        <span className="text-secondary font-medium">{home.hero.descriptionHighlight}</span>{' '}
                        {home.hero.descriptionEnd}
                    </p>

                    {/* CTAs */}
                    <div className="flex gap-4 justify-center flex-wrap mb-16">
                        <Link to="/register" className="px-8 py-3.5 rounded-xl font-bold text-base text-white no-underline bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_32px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 transition-all">
                            ▶ {home.hero.ctaPrimary} →
                        </Link>
                        <Link to="/how-it-works" className="px-8 py-3.5 rounded-xl font-bold text-base text-muted-foreground no-underline border border-border hover:border-white/30 hover:text-foreground hover:-translate-y-0.5 transition-all backdrop-blur-sm">
                            🧠 {home.hero.ctaSecondary}
                        </Link>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                        {home.stats.map((stat, i) => (
                            <div key={i} className="glass-card-enhanced p-5 text-center rounded-2xl">
                                <div className="font-black gradient-text mb-1" style={{ fontSize: 'clamp(22px,3.5vw,36px)' }}>{stat.number}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Trust badges */}
                    <div className="flex justify-center gap-7 mt-9 flex-wrap">
                        {home.hero.trustBadges.map((b, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-muted-foreground text-sm font-montserrat">
                                <span className="text-secondary">✓</span> {b}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── COMPANIES ─────────────────────────────────────────── */}
            <section className="py-20 bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-neural-network" />
                <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-accent/25 bg-accent/10">
                            <span className="text-xs text-accent font-semibold">🏆 {home.companies.badge}</span>
                        </div>
                        <h2 className="font-black text-foreground mb-3" style={{ fontSize: 'clamp(26px,4vw,48px)' }}>
                            <span className="gradient-text">{home.companies.heading1}</span><br />{home.companies.heading2}
                        </h2>
                        <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
                            {home.companies.description}{' '}
                            <span className="text-primary font-semibold">{home.companies.descriptionHighlight}</span>
                        </p>
                    </div>
                    <div className="flex flex-col gap-3.5">
                        <LogoRow companies={home.companies.logoRow1} animClass="animate-scroll-left" />
                        <LogoRow companies={home.companies.logoRow2} animClass="animate-scroll-right" />
                        <LogoRow companies={home.companies.logoRow3} animClass="animate-scroll-left-slow" />
                    </div>
                </div>
            </section>

            {/* ── FEATURES ──────────────────────────────────────────── */}
            <section className="py-20 px-6 bg-background relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, hsl(var(--accent)/0.08) 0px, transparent 60%)' }} />
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <div className="text-center mb-14">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-secondary/25 bg-secondary/10">
                            <span className="text-xs text-secondary font-semibold">⚡ {home.features.badge}</span>
                        </div>
                        <h2 className="font-black text-foreground mb-3" style={{ fontSize: 'clamp(26px,4vw,48px)' }}>
                            {home.features.heading}{' '}
                            <span className="gradient-text">{home.features.headingHighlight}</span>?
                        </h2>
                        <p className="text-muted-foreground text-base max-w-lg mx-auto leading-relaxed">
                            {home.features.description}{' '}
                            <span className="text-secondary">{home.features.descriptionHighlight}</span>
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {home.features.items.map((item, i) => (
                            <div key={i} className="glass-card-enhanced p-7 rounded-2xl hover:-translate-y-1 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 border ${FEATURE_COLORS[i]}`}>
                                    {FEATURE_ICONS[i]}
                                </div>
                                <h3 className="font-bold text-base text-foreground mb-2.5">{item.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed font-montserrat">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <section className="py-20 px-6 bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-neural-network" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="glass-card-enhanced p-16 text-center rounded-3xl" style={{ boxShadow: '0 20px 80px hsl(240 10% 0% / 0.6), 0 8px 32px hsl(var(--primary)/0.15), inset 0 2px 0 rgba(255,255,255,0.12)' }}>
                        <h2 className="font-black text-foreground mb-4" style={{ fontSize: 'clamp(26px,4vw,48px)' }}>
                            {home.cta.heading}{' '}
                            <span className="gradient-text">{home.cta.headingHighlight}</span>?
                        </h2>
                        <p className="text-muted-foreground text-base max-w-sm mx-auto mb-8 leading-relaxed">
                            Join thousands of candidates who transformed their careers with{' '}
                            <span className="text-secondary font-medium">{home.cta.descriptionHighlight}</span>.
                        </p>
                        <div className="flex justify-center gap-5 flex-wrap mb-8">
                            {home.cta.checkpoints.map((c, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <span className="text-secondary">✓</span> {c}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3.5 justify-center flex-wrap">
                            <Link to="/register" className="px-8 py-3.5 rounded-xl font-bold text-base text-white no-underline bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_32px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5 transition-all">
                                🎤 {home.cta.ctaPrimary} →
                            </Link>
                            <Link to="/how-it-works" className="px-8 py-3.5 rounded-xl font-bold text-base text-muted-foreground no-underline border border-border hover:border-white/30 hover:text-foreground hover:-translate-y-0.5 transition-all">
                                ▶ {home.cta.ctaSecondary}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
