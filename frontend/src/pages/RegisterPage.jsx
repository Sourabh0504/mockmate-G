/**
 * RegisterPage.jsx — Lovable-exact register form using Tailwind.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { register as content } from '../data/data.js';

function Toast({ msg, onClose }) {
    if (!msg) return null;
    return (
        <div className="fixed top-5 right-5 z-50 glass-card-enhanced px-5 py-4 rounded-xl max-w-sm animate-fade-in">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-sm text-foreground">{msg.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{msg.description}</p>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none bg-transparent border-none cursor-pointer">×</button>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const { login } = useAuth();
    const navigate = useNavigate();

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) { showToast(content.toasts.missingInfo); return; }
        setLoading(true);
        try {
            const res = await authApi.register({ name, email, password });
            login(res.data.access_token, res.data.user);
            showToast(content.toasts.created);
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (err) {
            const msg = err?.response?.data?.detail;
            showToast(msg?.toLowerCase().includes('exist') ? content.toasts.emailTaken : { title: 'Error', description: msg || 'Registration failed.' });
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-poppins";

    return (
        <AuthLayout branding={content.branding}>
            <Toast msg={toast} onClose={() => setToast(null)} />

            <div className="glass-card-enhanced rounded-2xl p-8">
                <div className="text-center mb-7">
                    <h1 className="font-poppins font-bold text-2xl text-foreground mb-1">{content.form.heading}</h1>
                    <p className="text-muted-foreground text-sm">{content.form.description}</p>
                </div>

                {/* Social buttons */}
                <div className="flex gap-3 mb-5">
                    {[
                        { label: content.form.githubButton, icon: '⊗', toast: content.toasts.githubComingSoon },
                        { label: content.form.googleButton, icon: 'G', toast: content.toasts.googleComingSoon },
                    ].map(btn => (
                        <button key={btn.label} onClick={() => showToast(btn.toast)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-muted/30 text-muted-foreground text-sm font-medium hover:border-border/80 hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer font-poppins">
                            <span className="text-base">{btn.icon}</span> {btn.label}
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{content.form.separator}</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{content.form.nameLabel}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">👤</span>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={content.form.namePlaceholder} className={inputCls} />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{content.form.emailLabel}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">✉</span>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={content.form.emailPlaceholder} className={inputCls} />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{content.form.passwordLabel}</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔒</span>
                            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={content.form.passwordPlaceholder} className={`${inputCls} pr-10`} />
                            <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer text-sm">
                                {showPass ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full py-3 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_28px_hsl(var(--primary)/0.6)] hover:-translate-y-px transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer font-poppins">
                        {loading ? 'Creating account…' : content.form.submitButton}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-5">
                    {content.form.hasAccount}{' '}
                    <Link to="/login" className="text-primary hover:text-primary/80 font-semibold no-underline">{content.form.signInLink}</Link>
                </p>
            </div>
        </AuthLayout>
    );
}
