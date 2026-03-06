/**
 * ContactPage.jsx — Lovable-exact contact page, full Tailwind.
 */
import { useState } from 'react';
import { contact as content } from '../data/data.js';

function FaqItem({ item }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${open ? 'border-primary/30' : 'border-border'}`}>
            <button onClick={() => setOpen(o => !o)} className="w-full flex justify-between items-center px-5 py-4 text-left bg-card hover:bg-muted/30 transition-colors cursor-pointer border-none font-poppins">
                <span className="text-sm font-medium text-foreground">{item.question}</span>
                <span className={`text-muted-foreground text-lg transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
            </button>
            {open && (
                <div className="px-5 py-3 text-sm text-muted-foreground bg-background/50 leading-relaxed font-montserrat">
                    {item.answer}
                </div>
            )}
        </div>
    );
}

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', rating: '' });
    const [toast, setToast] = useState(null);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) { showToast(content.toasts.missingInfo); return; }
        showToast(content.toasts.messageSent);
        setForm({ name: '', email: '', subject: '', message: '', rating: '' });
    };

    const inputCls = "w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-poppins";

    return (
        <div className="font-poppins bg-background min-h-screen">

            {/* Toast */}
            {toast && (
                <div className="fixed top-5 right-5 z-50 glass-card-enhanced px-5 py-4 rounded-xl max-w-sm animate-fade-in">
                    <p className="font-semibold text-sm text-foreground">{toast.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{toast.description}</p>
                </div>
            )}

            {/* Hero */}
            <section className="py-16 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-mesh-hero pointer-events-none" />
                <div className="absolute inset-0 bg-grid-pattern opacity-50" />
                <div className="max-w-xl mx-auto relative z-10 animate-fade-in">
                    <h1 className="font-black text-foreground mb-4" style={{ fontSize: 'clamp(32px,5vw,64px)' }}>
                        {content.heading}{' '}
                        <span className="gradient-text">{content.headingHighlight}</span>
                    </h1>
                    <p className="text-muted-foreground text-base leading-relaxed">{content.description}</p>
                </div>
            </section>

            <section className="py-10 px-6">
                <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-8">

                    {/* Form */}
                    <div className="glass-card-enhanced p-8 rounded-2xl">
                        <h2 className="font-bold text-lg text-foreground mb-1">{content.form.heading}</h2>
                        <p className="text-sm text-muted-foreground mb-6">{content.form.description}</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{content.form.nameLabel}</label>
                                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={content.form.namePlaceholder} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{content.form.emailLabel}</label>
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={content.form.emailPlaceholder} className={inputCls} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{content.form.subjectLabel}</label>
                                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className={`${inputCls} cursor-pointer`}>
                                    <option value="" disabled>{content.form.subjectPlaceholder}</option>
                                    {content.form.subjectOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{content.form.messageLabel}</label>
                                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder={content.form.messagePlaceholder} rows={4} className={`${inputCls} resize-none`} />
                            </div>
                            <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-primary to-primary/80 shadow-[0_4px_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_6px_28px_hsl(var(--primary)/0.6)] hover:-translate-y-px transition-all cursor-pointer font-poppins">
                                {content.form.submitButton} →
                            </button>
                        </form>
                    </div>

                    {/* Info + FAQ */}
                    <div className="flex flex-col gap-5">
                        {/* Contact info cards */}
                        <div className="grid grid-cols-1 gap-3">
                            {content.contactInfo.items.map((item, i) => (
                                <div key={i} className="glass-card-enhanced p-5 rounded-xl flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-lg shrink-0">
                                        {['✉', '💬', '⏱'][i]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-foreground">{item.title}</p>
                                        <p className="text-primary text-sm font-medium">{item.info}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* FAQ */}
                        <div className="glass-card-enhanced p-6 rounded-2xl">
                            <h3 className="font-bold text-base text-foreground mb-4">{content.faq.heading}</h3>
                            <div className="space-y-2">
                                {content.faq.items.map((item, i) => <FaqItem key={i} item={item} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-14 px-6 bg-card relative overflow-hidden">
                <div className="absolute inset-0 bg-neural-network" />
                <div className="max-w-[1200px] mx-auto relative z-10">
                    <h2 className="font-black text-center text-foreground mb-2" style={{ fontSize: 'clamp(22px,3vw,36px)' }}>{content.testimonials.heading}</h2>
                    <p className="text-center text-muted-foreground text-sm mb-8">{content.testimonials.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {content.testimonials.items.map((t, i) => (
                            <div key={i} className="glass-card-enhanced p-6 rounded-2xl hover:-translate-y-1 transition-all duration-300">
                                <div className="flex gap-0.5 mb-3">
                                    {[...Array(t.rating)].map((_, j) => <span key={j} className="text-yellow-400 text-sm">★</span>)}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4 font-montserrat">"{t.comment}"</p>
                                <div>
                                    <p className="font-semibold text-sm text-foreground">{t.name}</p>
                                    <p className="text-xs text-primary">{t.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
