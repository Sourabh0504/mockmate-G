/**
 * AboutPage.jsx — Lovable-exact about page, full Tailwind.
 */
import { Link } from 'react-router-dom';
import { about as content } from '../data/data.js';

const AVATAR_COLORS = ['from-primary/30 to-primary/10', 'from-secondary/30 to-secondary/10', 'from-accent/30 to-accent/10'];
const AVATAR_INITIALS = (name) => name.split(' ').map(n => n[0]).join('');

export default function AboutPage() {
    return (
        <div className="font-poppins bg-background min-h-screen">

            {/* Hero */}
            <section className="py-20 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-mesh-hero pointer-events-none" />
                <div className="absolute inset-0 bg-grid-pattern opacity-50" />
                <div className="max-w-2xl mx-auto relative z-10 animate-fade-in">
                    <h1 className="font-black text-foreground mb-4" style={{ fontSize: 'clamp(32px,5vw,64px)' }}>
                        {content.hero.heading}{' '}
                        <span className="gradient-text">{content.hero.headingHighlight}</span>
                    </h1>
                    <p className="text-muted-foreground text-base leading-relaxed">{content.hero.description}</p>
                </div>
            </section>

            {/* Mission + Vision */}
            <section className="py-12 px-6">
                <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-6">
                    <div className="glass-card-enhanced p-8 rounded-2xl">
                        <h2 className="font-black text-xl text-foreground mb-5">
                            {content.mission.heading}{' '}
                            <span className="gradient-text">{content.mission.headingHighlight}</span>
                        </h2>
                        <div className="space-y-3">
                            {content.mission.paragraphs.map((p, i) => (
                                <p key={i} className="text-sm text-muted-foreground leading-relaxed font-montserrat">{p}</p>
                            ))}
                        </div>
                    </div>
                    <div className="glass-card-enhanced p-8 rounded-2xl">
                        <h2 className="font-black text-xl text-foreground mb-4">{content.vision.heading}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed font-montserrat">{content.vision.description}</p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            {content.values.items.slice(0, 2).map((v, i) => (
                                <div key={i} className="p-4 rounded-xl border border-border bg-muted/30">
                                    <p className="font-bold text-sm text-foreground mb-1">{v.title}</p>
                                    <p className="text-xs text-muted-foreground font-montserrat">{v.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-12 px-6 bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-neural-network" />
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <h2 className="font-black text-center text-foreground mb-8" style={{ fontSize: 'clamp(24px,3.5vw,40px)' }}>
                        {content.stats.heading}{' '}
                        <span className="gradient-text">{content.stats.headingHighlight}</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {content.stats.items.map((stat, i) => (
                            <div key={i} className="glass-card-enhanced p-6 text-center rounded-2xl">
                                <div className="font-black gradient-text mb-1" style={{ fontSize: 'clamp(28px,4vw,48px)' }}>{stat.number}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-14 px-6">
                <div className="max-w-[1000px] mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="font-black text-foreground mb-3" style={{ fontSize: 'clamp(24px,3.5vw,40px)' }}>
                            {content.team.heading}{' '}
                            <span className="gradient-text">{content.team.headingHighlight}</span>
                        </h2>
                        <p className="text-muted-foreground text-sm">{content.team.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {content.team.members.map((member, i) => (
                            <div key={i} className="glass-card-enhanced p-7 rounded-2xl text-center hover:-translate-y-1 transition-all duration-300">
                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i]} border-2 border-white/20 flex items-center justify-center font-bold text-xl text-foreground mx-auto mb-4`}>
                                    {AVATAR_INITIALS(member.name)}
                                </div>
                                <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 mb-3">
                                    {content.team.badgeLabel}
                                </div>
                                <h3 className="font-bold text-foreground text-base mb-1">{member.name}</h3>
                                <p className="text-primary text-xs font-medium mb-3">{member.role}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed font-montserrat">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Technology */}
            <section className="py-12 px-6 bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-neural-network" />
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <h2 className="font-black text-center text-foreground mb-8" style={{ fontSize: 'clamp(22px,3vw,36px)' }}>
                        {content.technology.heading}{' '}
                        <span className="gradient-text">{content.technology.headingHighlight}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {content.technology.items.map((item, i) => (
                            <div key={i} className="glass-card-enhanced p-7 rounded-2xl hover:-translate-y-1 transition-all duration-300">
                                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed font-montserrat">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-14 px-6">
                <div className="max-w-xl mx-auto text-center glass-card-enhanced p-12 rounded-3xl">
                    <h2 className="font-black text-foreground mb-3" style={{ fontSize: 'clamp(20px,3vw,32px)' }}>{content.cta.heading}</h2>
                    <p className="text-muted-foreground text-sm mb-7 leading-relaxed font-montserrat">{content.cta.description}</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <Link to="/register" className="px-7 py-3 rounded-xl font-bold text-sm text-white no-underline bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5 transition-all">
                            🎤 {content.cta.ctaPrimary} →
                        </Link>
                        <Link to="/contact" className="px-7 py-3 rounded-xl font-bold text-sm text-muted-foreground no-underline border border-border hover:text-foreground hover:-translate-y-0.5 transition-all">
                            {content.cta.ctaSecondary}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
