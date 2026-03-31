import { useState, useEffect } from 'react';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { adminApi } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function AdminPage() {
    const [sessions, setSessions] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        adminApi.listAllSessions(0, 50).then(res => {
            setSessions(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSelect = async (id) => {
        setSelectedId(id);
        setDetailsLoading(true);
        try {
            const res = await adminApi.getSessionDetails(id);
            setDetails(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setDetailsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background font-poppins pt-20 flex flex-col">
            <Navigation />
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── Left Sidebar: Session List ── */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="bg-primary/20 text-primary p-1.5 rounded-lg border border-primary/30">Admin</span> 
                        All Sessions 
                        <span className="text-xs text-muted-foreground ml-auto bg-card px-2 py-1 rounded-full">{sessions.length}</span>
                    </h2>
                    
                    {loading ? (
                        <div className="animate-pulse space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card/50 rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="space-y-3 h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                            {sessions.map(s => (
                                <Card 
                                    key={s.id} 
                                    className={`cursor-pointer transition-all ${
                                        selectedId === s.id 
                                            ? 'border-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.2)]' 
                                            : 'border-white/5 bg-card/40 hover:border-white/20 hover:bg-card/60'
                                    }`}
                                    onClick={() => handleSelect(s.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-semibold truncate text-foreground">{s.user_email}</p>
                                            {s.has_debug_data && <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_hsl(var(--secondary))]" title="Has Debug Logs" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">{new Date(s.created_at).toLocaleString()}</p>
                                        <div className="flex gap-2 mt-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-muted-foreground">{s.status}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-muted-foreground">{s.duration_selected}m</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Right Panel: Details & Prompts ── */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-bold">Debug Inspector</h2>
                    
                    {detailsLoading ? (
                        <Card className="h-[75vh] flex items-center justify-center border-white/5 bg-card/20">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </Card>
                    ) : details ? (
                        <Card className="h-[75vh] flex flex-col overflow-hidden border-white/10 bg-card/60 backdrop-blur-md">
                            <CardHeader className="border-b border-white/5 bg-card/40 py-4 z-10">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    {details.id}
                                    {details.jd_quality_warning && <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-md uppercase tracking-wider ml-auto">JD Warning</span>}
                                </CardTitle>
                                <div className="text-sm text-muted-foreground mt-1">
                                    <span className="text-foreground font-medium">{details.user_email}</span> — {details.role} @ {details.company || "Unknown"}
                                </div>
                            </CardHeader>
                            
                            <CardContent className="flex-1 overflow-y-auto p-0 z-0">
                                <div className="p-6 space-y-8">
                                    {/* Evaluation Summary */}
                                    <section>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Scoring Overview
                                        </h3>
                                        <div className="bg-black/30 border border-white/5 rounded-xl p-4 font-mono text-xs overflow-x-auto text-green-400">
                                            {JSON.stringify(details.scores, null, 2)}
                                        </div>
                                    </section>

                                    {/* Prompts Dictionary */}
                                    {details.debug_data && Object.keys(details.debug_data).length > 0 ? (
                                        <section>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-secondary rounded-full" /> Prompt Logs
                                            </h3>
                                            <div className="space-y-4">
                                                {Object.entries(details.debug_data).map(([key, value]) => (
                                                    <div key={key} className="bg-black/30 border border-white/5 rounded-xl overflow-hidden">
                                                        <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                                            <span className="text-xs font-bold text-secondary">{key}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase">{Array.isArray(value) ? `${value.length} calls` : '1 call'}</span>
                                                        </div>
                                                        <div className="p-4 font-mono text-[11px] leading-relaxed text-zinc-300 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar">
                                                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    ) : (
                                        <div className="text-center p-8 bg-black/20 rounded-xl border border-white/5">
                                            <p className="text-sm text-muted-foreground">No debug logs captured for this session.</p>
                                            <p className="text-xs text-muted-foreground mt-1 opacity-60">Sessions created prior to Admin View tracking will not have prompt logs.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="h-[75vh] flex items-center justify-center border-white/5 bg-card/20 border-dashed">
                            <p className="text-muted-foreground text-sm">Select a session from the left to view debug details.</p>
                        </Card>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
