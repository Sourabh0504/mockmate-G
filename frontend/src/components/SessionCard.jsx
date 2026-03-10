/**
 * SessionCard.jsx — Exact port of Lovable's SessionCard.tsx
 * Circular SVG score dial, score breakdown bars, status badges, action buttons.
 */
import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Clock, AlertTriangle, Loader2, Play, FileText, RotateCcw, ChevronRight, Mic, Brain, Target, Building2 } from 'lucide-react';
import RulesModal from './RulesModal';
import ReportModal from './ReportModal';

const formatDate = (d) => {
    const date = new Date(d);
    const diffHrs = (Date.now() - date.getTime()) / 3_600_000;
    if (diffHrs < 1) return `${Math.floor(diffHrs * 60)}m ago`;
    if (diffHrs < 24) return `${Math.floor(diffHrs)}h ago`;
    if (diffHrs < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function SessionCard({ session }) {
    const [rulesOpen, setRulesOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);

    const statusConfig = {
        creating: { label: 'Creating', dot: 'bg-muted-foreground', bg: 'bg-muted/50' },
        ready: { label: 'Ready', dot: 'bg-secondary', bg: 'bg-secondary/10' },
        live: { label: 'Live', dot: 'bg-destructive animate-pulse', bg: 'bg-destructive/10' },
        completed: {
            label: session.scores ? 'Completed' : 'Evaluating',
            dot: session.scores ? 'bg-secondary' : 'bg-accent animate-pulse',
            bg: session.scores ? 'bg-secondary/10' : 'bg-accent/10'
        },
        interrupted: { label: 'Interrupted', dot: 'bg-accent', bg: 'bg-accent/10' },
        failed: { label: 'Failed', dot: 'bg-destructive', bg: 'bg-destructive/10' },
    };

    const { label: statusLabel, dot: dotClass, bg: statusBg } = statusConfig[session.status] || statusConfig.failed;

    const diffConfig = {
        Easy: { text: 'text-secondary', bg: 'bg-secondary/10' },
        Moderate: { text: 'text-primary', bg: 'bg-primary/10' },
        Hard: { text: 'text-destructive', bg: 'bg-destructive/10' },
    };
    const diff = diffConfig[session.difficulty] || { text: '', bg: '' };

    const scoreColor = !session.scores ? '' : session.scores.overall >= 80 ? 'text-secondary' : session.scores.overall >= 60 ? 'text-primary' : 'text-accent';
    const scoreGradient = !session.scores ? '' : session.scores.overall >= 80 ? 'from-secondary to-secondary-glow' : session.scores.overall >= 60 ? 'from-primary to-primary-glow' : 'from-accent to-accent-glow';
    const strokeColor = !session.scores ? '' : session.scores.overall >= 80 ? 'stroke-secondary' : session.scores.overall >= 60 ? 'stroke-primary' : 'stroke-accent';

    const scoreBreakdown = session.scores ? [
        { label: 'Fluency', value: session.scores.fluency, icon: Mic },
        { label: 'Content', value: session.scores.content_quality, icon: Brain },
        { label: 'Confidence', value: session.scores.confidence, icon: Target },
    ] : [];

    return (
        <>
            <Card className="group hover:border-white/15 transition-all duration-300 relative overflow-hidden">
                {/* Left accent stripe */}
                {session.status === 'completed' && session.scores && (
                    <div className={`absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b ${scoreGradient} opacity-80`} />
                )}
                {session.status === 'ready' && (
                    <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-secondary to-secondary-glow opacity-80" />
                )}
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${session.status === 'completed' && session.scores ? scoreGradient : 'from-primary to-primary-glow'} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                <CardContent className="p-4 sm:p-5 lg:p-6 relative pl-5 sm:pl-6 lg:pl-7">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2.5 min-w-0 flex-1">
                            <h3 className="font-semibold text-base sm:text-lg truncate leading-tight">{session.role}</h3>
                            <div className="flex items-center gap-2 flex-wrap text-sm">
                                {session.company && (
                                    <span className="font-medium text-muted-foreground mr-1 flex items-center gap-1.5 whitespace-nowrap">
                                        <Building2 className="w-3.5 h-3.5 opacity-70" />
                                        {session.company}
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusBg}`}>
                                    <span className={`w-[5px] h-[5px] rounded-full ${dotClass}`} />
                                    {statusLabel}
                                </span>
                                {session.difficulty && (
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium ${diff.bg} ${diff.text}`}>
                                        {session.difficulty}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Circular SVG score dial */}
                        {session.status === 'completed' && session.scores && (
                            <div className="relative shrink-0">
                                <div className="w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] relative">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 68 68">
                                        <circle cx="34" cy="34" r="28" fill="none" strokeWidth="4" className="stroke-muted/40" />
                                        <circle
                                            cx="34" cy="34" r="28" fill="none" strokeWidth="4.5"
                                            strokeLinecap="round"
                                            className={strokeColor}
                                            strokeDasharray={`${(session.scores.overall / 100) * 175.93} 175.93`}
                                            style={{ transition: 'stroke-dasharray 1s ease-out' }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-lg sm:text-xl font-bold font-poppins leading-none ${scoreColor}`}>
                                            {session.scores.overall}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Date + duration */}
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-3">
                        <span>{formatDate(session.created_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{session.duration || session.duration_selected || 0}m
                        </span>
                    </div>

                    {/* Score breakdown bars */}
                    {session.status === 'completed' && session.scores && (
                        <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-3 gap-4">
                            {scoreBreakdown.map(s => {
                                const barColor = s.value >= 80 ? 'bg-secondary' : s.value >= 60 ? 'bg-primary' : 'bg-accent';
                                const valColor = s.value >= 80 ? 'text-secondary' : s.value >= 60 ? 'text-primary' : 'text-accent';
                                return (
                                    <div key={s.label} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <s.icon className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</span>
                                            </div>
                                            <span className={`text-xs sm:text-sm font-semibold ${valColor}`}>{s.value}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                            <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${s.value}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Status messages */}
                    {session.status === 'creating' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 p-2.5 rounded-xl bg-muted/20">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Setting up interview environment...
                        </div>
                    )}
                    {session.status === 'completed' && !session.scores && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 p-2.5 rounded-xl bg-muted/20">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Evaluating your performance...
                        </div>
                    )}
                    {session.status === 'ready' && session.jd_quality && ['low', 'medium'].includes(session.jd_quality) && (
                        <div className="flex items-center gap-2 text-xs text-accent bg-accent/5 rounded-xl p-2.5 mt-4 border border-accent/10">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            JD quality is {session.jd_quality} — add more detail for better results.
                        </div>
                    )}
                    {session.status === 'interrupted' && (
                        <p className="text-xs text-muted-foreground mt-4 p-2.5 rounded-xl bg-muted/20">
                            Session interrupted — you can resume where you left off.
                        </p>
                    )}
                    {session.status === 'failed' && (
                        <p className="text-xs text-muted-foreground mt-4 p-2.5 rounded-xl bg-destructive/5 border border-destructive/10">
                            This session could not be completed.
                        </p>
                    )}

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-2.5">
                        {session.status === 'ready' && (
                            <Button variant="default" size="sm" onClick={() => setRulesOpen(true)} className="text-xs sm:text-sm h-9 shadow-md">
                                <Play className="w-3.5 h-3.5 mr-1.5" /> Start Interview <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                        )}
                        {session.status === 'completed' && session.scores && (
                            <Button variant="outline" size="sm" onClick={() => setReportOpen(true)} className="text-xs sm:text-sm h-9 group/btn">
                                <FileText className="w-3.5 h-3.5 mr-1.5" /> View Report <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform" />
                            </Button>
                        )}
                        {session.status === 'interrupted' && (
                            <Button variant="outline" size="sm" onClick={() => window.location.href = `/interview/${session.id}`} className="text-xs sm:text-sm h-9">
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Resume
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} session={session} />
            <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} session={session} />
        </>
    );
}
