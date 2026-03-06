/**
 * HowItWorksPage.jsx — Lovable-exact 4-step timeline, full Tailwind.
 */
import { Link } from 'react-router-dom';
import { howItWorks as content } from '../data/data.js';

const STEP_COLORS = ['from-primary to-primary/80', 'from-secondary to-secondary/80', 'from-accent to-accent/80', 'from-primary to-secondary'];

export default function HowItWorksPage() {
    return (
        <div className="font-poppins bg-background min-h-screen">

            {/* Hero */}
            <section className="py-20 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-mesh-hero pointer-events-none" />
                <div className="absolute inset-0 bg-grid-pattern opacity-50" />
                <div className="max-w-2xl mx-auto relative z-10 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border border-primary/30 bg-primary/10">
                        <span className="text-xs text-primary font-semibold">⚡ {content.badge}</span>
                    </div>
                    <h1 className="font-black text-foreground mb-4" style={{ fontSize: 'clamp(32px,5vw,64px)' }}>
                        {content.heading}{' '}
                        <span className="gradient-text">{content.headingHighlight}</span>
                    </h1>
                    <p className="text-muted-foreground text-base leading-relaxed">{content.description}</p>
                </div>
            </section>

            {/* Timeline */}
            <section className="py-10 px-6">
                <div className="max-w-3xl mx-auto space-y-8">
                    {content.steps.map((step, i) => (
                        <div key={i} className="flex gap-6 relative animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                            {/* Connector line */}
                            {i < content.steps.length - 1 && (
                                <div className="absolute left-7 top-14 bottom-[-2rem] w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
                            )}

                            {/* Number badge */}
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${STEP_COLORS[i]} flex items-center justify-center font-black text-sm text-white shrink-0 shadow-[0_0_24px_hsl(var(--primary)/0.4)]`}>
                                {step.num}
                            </div>

                            {/* Content */}
                            <div className="glass-card-enhanced p-7 rounded-2xl flex-1">
                                <h3 className="font-bold text-lg text-foreground mb-2">{step.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-4 font-montserrat">{step.description}</p>
                                <ul className="space-y-1.5">
                                    {step.details.map((d, j) => (
                                        <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="text-primary text-xs">●</span> {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Benefits */}
            <section className="py-16 px-6">
                <div className="max-w-[1200px] mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {content.benefits.map((b, i) => (
                            <div key={i} className="glass-card-enhanced p-6 rounded-2xl text-center hover:-translate-y-1 transition-all duration-300">
                                <h3 className="font-bold text-foreground mb-2">{b.title}</h3>
                                <p className="text-sm text-muted-foreground font-montserrat">{b.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-6">
                <div className="max-w-xl mx-auto text-center glass-card-enhanced p-12 rounded-3xl">
                    <h2 className="font-black text-foreground mb-3" style={{ fontSize: 'clamp(22px,3.5vw,36px)' }}>{content.cta.heading}</h2>
                    <p className="text-muted-foreground text-sm mb-7 leading-relaxed font-montserrat">{content.cta.description}</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <Link to="/register" className="px-7 py-3 rounded-xl font-bold text-sm text-white no-underline bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5 transition-all">
                            🎤 {content.cta.ctaPrimary} →
                        </Link>
                        <Link to="/about" className="px-7 py-3 rounded-xl font-bold text-sm text-muted-foreground no-underline border border-border hover:text-foreground hover:-translate-y-0.5 transition-all">
                            {content.cta.ctaSecondary}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
