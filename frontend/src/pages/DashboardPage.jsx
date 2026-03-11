/**
 * DashboardPage.jsx — Exact port of Lovable's Dashboard.tsx
 * Uses Tailwind + shared UI primitives (Card, Button, etc.)
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { sessionApi } from '../services/api';
import SessionCard from '../components/SessionCard';
import CreateSessionModal from '../components/CreateSessionModal';
import {
    Award, Mic, Brain, Target, TrendingUp, TrendingDown, BarChart3,
    Trophy, Star, Calendar, ArrowRight, Lightbulb, Plus, Sparkles, Flame, Clock,
} from 'lucide-react';

// ── Reusable quick stat strip card ──
function QuickStat({ icon: Icon, value, label, colorClass }) {
    return (
        <div className="flex items-center gap-2 sm:gap-2.5 bg-card/60 backdrop-blur-lg rounded-xl border border-white/10 p-2 sm:p-2.5">
            <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className="text-base sm:text-lg font-bold font-poppins leading-none truncate">{value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight truncate">{label}</p>
            </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);

    // Greeting
    const firstName = user?.name?.split(' ')[0] || 'there';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Derived stats
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const scoredSessions = completedSessions.filter(s => s.scores?.overall != null);
    const latestScored = scoredSessions[0];
    const hasScores = !!latestScored?.scores;
    const avgScore = scoredSessions.length > 0
        ? Math.round(scoredSessions.reduce((acc, s) => acc + (s.scores?.overall || 0), 0) / scoredSessions.length)
        : 0;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_selected || s.duration || 0), 0);

    // Score card metrics
    const metricIcons = [Award, Mic, Brain, Target];
    const metricGradients = ['from-primary to-primary-glow', 'from-secondary to-secondary-glow', 'from-accent to-accent-glow', 'from-primary to-accent'];
    const metricTitles = ['Overall Score', 'Fluency', 'Content Quality', 'Confidence'];
    const metrics = hasScores ? [
        { title: metricTitles[0], value: latestScored.scores.overall, change: +5, icon: metricIcons[0], gradient: metricGradients[0] },
        { title: metricTitles[1], value: latestScored.scores.fluency, change: +3, icon: metricIcons[1], gradient: metricGradients[1] },
        { title: metricTitles[2], value: latestScored.scores.content_quality, change: +8, icon: metricIcons[2], gradient: metricGradients[2] },
        { title: metricTitles[3], value: latestScored.scores.confidence, change: -2, icon: metricIcons[3], gradient: metricGradients[3] },
    ] : [];

    const skillScores = latestScored?.scores?.skills || latestScored?.report?.skill_scores;

    // Fetch sessions
    const fetchSessions = useCallback(async () => {
        try {
            const res = await sessionApi.list();
            setSessions(res.data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchSessions();
        const hasActive = sessions.some(s => s.status === 'creating' || s.status === 'live');
        if (hasActive) {
            const id = setInterval(fetchSessions, 10000);
            return () => clearInterval(id);
        }
    }, [fetchSessions, sessions.length]);

    const handleCreateSession = (newSession) => {
        setSessions(prev => [newSession, ...prev]);
        setTimeout(fetchSessions, 3000);
    };

    // eslint-disable-next-line no-unused-vars
    const handleLogout = () => { logout(); navigate('/'); };

    const achievementIcons = [Star, Award, Calendar];
    const achievements = [
        { title: 'First Step', desc: 'Complete your first interview', unlocked: completedSessions.length >= 1 },
        { title: 'High Achiever', desc: 'Score 80+ on any interview', unlocked: (latestScored?.scores?.overall || 0) >= 80 },
        { title: 'Consistent', desc: 'Complete 5 interviews', unlocked: completedSessions.length >= 5 },
    ];

    const recommendations = (() => {
        const behavioral = latestScored?.ai_suggestions_behavioral || [];
        const technical = latestScored?.ai_suggestions_technical || [];
        const all = [
            ...behavioral.map(s => ({ title: 'Behavioral', desc: s })),
            ...technical.map(s => ({ title: 'Technical', desc: s })),
        ];
        if (all.length > 0) return all.slice(0, 4);
        // Fallback for no scored sessions
        return [
            { title: 'Work on Pacing', desc: 'Try to speak at a consistent pace throughout' },
            { title: 'Use the STAR Method', desc: 'Structure your behavioral answers clearly' },
            { title: 'Research the Company', desc: 'Tailor answers to the company\'s values' },
        ];
    })();

    return (
        <div className="min-h-screen bg-background font-poppins">
            {/* ── Shared global Navigation (has user email, profile icon, sign out) ── */}
            <Navigation />

            <div className="relative pt-14 sm:pt-16">
                {/* Background accents */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute top-40 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative z-10">

                    {/* ── Greeting header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
                        <div className="space-y-1">
                            <p className="text-xs sm:text-sm text-muted-foreground font-montserrat">{todayLabel}</p>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-poppins font-bold">
                                {greeting}, <span className="text-neon-blue">{firstName}</span>
                            </h1>
                        </div>
                        <Button onClick={() => setCreateOpen(true)} className="group w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            <span className="text-sm">New Practice Session</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>





                    {/* ── Two-column layout: sessions + sidebar ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

                        {/* Sessions list */}
                        <div className="lg:col-span-3 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-semibold font-poppins">Practice Sessions</h2>
                                <span className="text-xs text-muted-foreground">{sessions.length} total</span>
                            </div>

                            {loading ? (
                                <Card className="p-8 text-center">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                </Card>
                            ) : sortedSessions.length === 0 ? (
                                <Card className="p-8 sm:p-12 text-center">
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                                            <Mic className="w-8 h-8 text-primary" />
                                        </div>
                                        <h3 className="font-semibold text-base sm:text-lg">No sessions yet</h3>
                                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">Start your first AI-powered mock interview to begin improving.</p>
                                        <Button onClick={() => setCreateOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" /> Start First Interview
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {sortedSessions.map(session => <SessionCard key={session.id} session={session} />)}
                                </div>
                            )}
                        </div>

                        {/* Sidebar — sticky on desktop */}
                        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-20 lg:self-start">

                            {/* ── Quick stats strip (Moved to sidebar) ── */}
                            <div className="grid grid-cols-3 gap-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                                <QuickStat icon={Flame} value={completedSessions.length} label="Sessions" colorClass="bg-primary/15 text-primary" />
                                <QuickStat icon={BarChart3} value={avgScore || '—'} label="Avg Score" colorClass="bg-secondary/15 text-secondary" />
                                <QuickStat icon={Clock} value={`${totalMinutes}m`} label="Practice" colorClass="bg-accent/15 text-accent" />
                            </div>

                            {/* ── Score cards (2x2 grid in sidebar) ── */}
                            {hasScores && (
                                <Card className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm">
                                            <Target className="w-4 h-4 text-primary" /> Overall Performance
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            {metrics.map((metric, i) => (
                                                <Card key={i} className="group relative overflow-hidden bg-card/40 border-white/5">
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-[0.04] group-hover:opacity-[0.1] transition-opacity duration-500`} />
                                                    <div className="p-3 relative">
                                                        <div className="flex items-center gap-3">
                                                            {/* Left side: Big Logo */}
                                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center opacity-80 shrink-0`}>
                                                                <metric.icon className="w-5 h-5 text-white" />
                                                            </div>

                                                            {/* Right side: Title, Score, Trend */}
                                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold line-clamp-1 mb-1">{metric.title}</p>

                                                                <div className="flex items-baseline justify-between gap-2">
                                                                    <div className="flex items-baseline gap-1">
                                                                        <span className="text-xl sm:text-2xl font-bold font-poppins leading-none">{metric.value}</span>
                                                                        <span className="text-[10px] text-muted-foreground">/100</span>
                                                                    </div>
                                                                    <div className={`flex items-center text-[10px] font-medium ${metric.change > 0 ? 'text-secondary' : 'text-destructive'}`}>
                                                                        {metric.change > 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
                                                                        {Math.abs(metric.change)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Bottom: Progress Bar spanning full width */}
                                                        <div className="h-1 w-full rounded-full bg-muted/50 overflow-hidden mt-3">
                                                            <div className={`h-full rounded-full bg-gradient-to-r ${metric.gradient} transition-all duration-1000`} style={{ width: `${metric.value}%` }} />
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Skill analysis */}
                            {skillScores && (
                                <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center gap-2 text-sm">
                                            <BarChart3 className="w-4 h-4 text-secondary" /> Skill Breakdown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {[
                                            { label: 'Technical', value: skillScores.technological_knowledge || skillScores.technical_knowledge || 0, color: 'bg-primary' },
                                            { label: 'Communication', value: skillScores.communication || 0, color: 'bg-secondary' },
                                            { label: 'Problem Solving', value: skillScores.problem_solving || 0, color: 'bg-accent' },
                                            { label: 'Leadership', value: skillScores.leadership || 0, color: 'bg-primary' },
                                            { label: 'Cultural Fit', value: skillScores.cultural_fit || 0, color: 'bg-secondary' },
                                        ].map(skill => (
                                            <div key={skill.label} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-muted-foreground">{skill.label}</span>
                                                    <span className="font-semibold">{skill.value}%</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                    <div className={`h-full rounded-full ${skill.color} transition-all duration-700`} style={{ width: `${skill.value}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Achievements */}
                            <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <Trophy className="w-4 h-4 text-accent" /> Achievements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {achievements.map((a, i) => {
                                        const Icon = achievementIcons[i];
                                        return (
                                            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${a.unlocked ? 'bg-secondary/5' : 'opacity-50'}`}>
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.unlocked ? 'bg-gradient-to-br from-secondary to-secondary-glow' : 'bg-muted'}`}>
                                                    <Icon className={`w-4 h-4 ${a.unlocked ? 'text-white' : 'text-muted-foreground'}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-xs sm:text-sm">{a.title}</p>
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground">{a.desc}</p>
                                                </div>
                                                {a.unlocked && <Sparkles className="w-3 h-3 text-secondary ml-auto shrink-0" />}
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            {/* AI Recommendations */}
                            <Card className="animate-slide-up border-primary/20" style={{ animationDelay: '0.5s' }}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <Lightbulb className="w-4 h-4 text-primary" /> AI Recommendations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {recommendations.map((r, i) => (
                                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-xs sm:text-sm">{r.title}</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground">{r.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <CreateSessionModal open={createOpen} onOpenChange={setCreateOpen} onSessionCreated={handleCreateSession} />
            <Footer />
        </div>
    );
}
