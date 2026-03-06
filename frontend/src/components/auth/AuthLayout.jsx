/**
 * AuthLayout.jsx — Lovable-exact split-panel auth layout.
 * Left: branding with feature list | Right: form (glass card)
 */
import { Link } from 'react-router-dom';
import mockmateLogo from '../../assets/mockmate-logo.svg';

export default function AuthLayout({ children, branding }) {
    return (
        <div className="min-h-screen bg-background flex font-poppins">

            {/* Left panel — branding */}
            <div className="hidden lg:flex flex-col justify-center px-12 w-[45%] relative overflow-hidden bg-gradient-to-br from-background via-card to-background">
                {/* Ambient blobs */}
                <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-morph-blob pointer-events-none" />
                <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-secondary/15 blur-3xl animate-morph-blob-reverse pointer-events-none" />
                <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-accent/10 blur-2xl animate-morph-blob-slow pointer-events-none" />
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

                <div className="relative z-10">
                    <Link to="/" className="flex items-center gap-2.5 no-underline mb-12">
                        <img src={mockmateLogo} alt="MockMate AI" className="h-10 w-auto" onError={e => { e.target.style.display = 'none'; }} />
                        <span className="font-bold text-xl text-foreground">MockMate AI</span>
                    </Link>

                    <h2 className="font-black text-4xl leading-tight text-foreground mb-4">
                        {branding.heading}{' '}
                        <span className="text-neon-green">{branding.headingHighlight}</span>
                    </h2>
                    <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm">
                        {branding.description}
                    </p>

                    {branding.featuresHeading && (
                        <p className="font-semibold text-sm text-foreground mb-4">{branding.featuresHeading}</p>
                    )}
                    <ul className="space-y-3">
                        {branding.features.map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                                <div className="w-5 h-5 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center shrink-0">
                                    <svg className="w-3 h-3 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
                <div className="absolute inset-0 bg-mesh-hero pointer-events-none" />
                <div className="w-full max-w-md relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
