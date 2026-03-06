/**
 * NotFoundPage.jsx — Lovable-exact 404, full Tailwind.
 */
import { Link, useNavigate } from 'react-router-dom';
import { notFound as content } from '../data/data.js';

export default function NotFoundPage() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 py-20 relative overflow-hidden font-poppins">
            <div className="absolute inset-0 bg-mesh-hero pointer-events-none" />
            <div className="absolute inset-0 bg-grid-pattern opacity-40" />

            <div className="max-w-xl w-full text-center relative z-10 animate-fade-in">
                {/* Error code */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border border-destructive/30 bg-destructive/10">
                    <span className="text-xs text-destructive font-mono font-semibold">{content.errorCode}</span>
                </div>

                {/* 404 giant */}
                <div className="font-black leading-none mb-6 gradient-text" style={{ fontSize: 'clamp(80px,18vw,160px)' }}>
                    404
                </div>

                <h1 className="font-black text-foreground mb-4" style={{ fontSize: 'clamp(24px,4vw,48px)' }}>
                    {content.heading}{' '}
                    <span className="text-destructive">{content.headingHighlight}</span>
                </h1>

                <p className="text-muted-foreground text-base mb-10 leading-relaxed font-montserrat">
                    {content.description}
                </p>

                <div className="flex gap-3 justify-center flex-wrap mb-10">
                    <Link to="/" className="px-7 py-3 rounded-xl font-bold text-sm text-white no-underline bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:-translate-y-0.5 transition-all">
                        {content.returnHome}
                    </Link>
                    <button onClick={() => navigate(-1)} className="px-7 py-3 rounded-xl font-bold text-sm text-muted-foreground border border-border hover:text-foreground hover:-translate-y-0.5 transition-all bg-transparent cursor-pointer font-poppins">
                        ← {content.goBack}
                    </button>
                </div>

                {/* Helpful links */}
                <div className="glass-card-enhanced p-6 rounded-2xl">
                    <p className="text-sm text-muted-foreground mb-4">{content.lookingFor}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {content.helpfulLinks.map(link => (
                            <Link key={link.path} to={link.path} className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground no-underline border border-border hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all text-center">
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
