import { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import {
    Calendar, Clock, ChevronDown, ChevronUp, Download, FileDown,
    MessageSquare, Lightbulb, Target, Trophy, Sparkles, BookOpen,
    User, GraduationCap, Briefcase, Code, Award, Mic, Brain, Building2,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { sessionApi } from '../services/api';
import { Loader2 } from 'lucide-react';

const content = {
    tabs: { transcript: 'Transcript', skills: 'Skills', resume: 'Resume', summary: 'Summary', export: 'Export' },
    overallScore: 'Overall Score',
    yourAnswer: 'Your Answer:',
    commentLabel: 'Comment:',
    suggestionLabel: 'Suggestion:',
    showExpected: 'Show Expected Answer',
    hideExpected: 'Hide Expected Answer',
    behavioralSuggestions: 'Behavioral Suggestions',
    technicalSuggestions: 'Technical Suggestions',
    downloadPdf: 'Download PDF',
    downloadJson: 'Download JSON',
    resumeSections: { personalInfo: 'Personal Info', education: 'Education', experience: 'Experience', projects: 'Projects', skills: 'Skills' },
    personalInfoLabels: { name: 'Name:', email: 'Email:', phone: 'Phone:', location: 'Location:' },
};

/* ── SVG Score Ring ── */
const ScoreRing = ({ score, size = 100, strokeWidth = 6, label, color = 'primary' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const colorMap = {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent: 'hsl(var(--accent))',
        neonBlue: 'hsl(var(--neon-blue))',
        neonGreen: 'hsl(var(--neon-green))',
        neonPurple: 'hsl(var(--neon-purple))',
    };
    const strokeColor = colorMap[color] || colorMap.primary;

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="rotate-[-90deg]">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                        stroke="hsl(var(--muted))" strokeWidth={strokeWidth} opacity={0.3} />
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
                        stroke={strokeColor} strokeWidth={strokeWidth}
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: `drop-shadow(0 0 6px ${strokeColor}40)` }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold font-poppins">{score}</span>
                </div>
            </div>
            {label && <span className="text-[11px] text-muted-foreground font-medium">{label}</span>}
        </div>
    );
};

/* ── Skill Bar ── */
const SkillBar = ({ label, value, color }) => {
    const colorMap = {
        primary: 'bg-primary', secondary: 'bg-secondary', accent: 'bg-accent',
        neonBlue: 'bg-primary', neonGreen: 'bg-secondary', neonPurple: 'bg-accent',
    };
    const shadowColor = color === 'neonBlue' ? 'primary' : color === 'neonGreen' ? 'secondary' : color === 'neonPurple' ? 'accent' : color;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center pb-1">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs font-bold text-muted-foreground">{value}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                <div
                    className={`h-full rounded-full ${colorMap[color] || 'bg-primary'} transition-all duration-1000 ease-out`}
                    style={{ width: `${value}%`, boxShadow: `0 0 8px hsl(var(--${shadowColor}) / 0.4)` }}
                />
            </div>
        </div>
    );
};

export default function ReportModal({ open, onClose, session }) {
    const [fetchedSession, setFetchedSession] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && session?.id) {
            setLoading(true);
            sessionApi.getReport(session.id)
                .then(res => setFetchedSession(res.data))
                .catch(err => console.error('Failed to load report', err))
                .finally(() => setLoading(false));
        } else {
            setFetchedSession(null);
        }
    }, [open, session?.id]);

    const displaySession = fetchedSession || session;

    // Normalize the flat backend response into the expected report structure
    const isReportLoaded = Boolean(fetchedSession || displaySession?.transcript || displaySession?.summary_text);

    const report = isReportLoaded ? {
        summary: displaySession.summary_text || displaySession.report?.summary || "No summary available.",
        behavioral_suggestions: displaySession.ai_suggestions_behavioral || displaySession.report?.behavioral_suggestions || [],
        technical_suggestions: displaySession.ai_suggestions_technical || displaySession.report?.technical_suggestions || [],
        skill_scores: displaySession.scores?.skills || displaySession.report?.skill_scores || {},
        questions: displaySession.transcript?.map((t, i) => ({
            number: i + 1,
            section: "Interview",
            questionText: t.question_text,
            userAnswer: t.raw_answer || "No answer provided.",
            comment: t.ai_comment || "No comment.",
            suggestion: t.ai_suggestion || "No suggestion.",
            expectedAnswer: t.expected_answer || "No expected answer.",
            score: t.final_score ? Math.round(t.final_score / 10) : 0
        })) || displaySession.report?.questions || []
    } : null;

    const scores = displaySession?.scores;

    // Optional loading state placeholder inside the dialog
    if (!open) return null;

    const formatDate = (d) =>
        new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const getScoreColor = (s) => s >= 80 ? 'text-neon-green' : s >= 60 ? 'text-primary' : s >= 40 ? 'text-accent' : 'text-destructive';

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="border-white/[0.08] bg-background/80 backdrop-blur-2xl sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
                {/* ── Premium Header ── */}
                <div className="relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <DialogHeader className="relative p-6 pb-5">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Interview Report
                                    </Badge>
                                </div>
                                <DialogTitle className="text-xl sm:text-2xl font-poppins font-bold tracking-tight">
                                    {session.role}
                                </DialogTitle>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                    {session.company && (
                                        <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full font-medium text-foreground/80">
                                            <Building2 className="w-3.5 h-3.5" />{session.company}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full">
                                        <Calendar className="w-3 h-3" />{formatDate(session.created_at)}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full">
                                        <Clock className="w-3 h-3" />{session.duration_selected || session.duration || 20} min
                                    </span>
                                    <Badge variant="secondary" className="text-[10px]">{session.difficulty}</Badge>
                                </div>
                            </div>

                            {/* Overall Score Capsule */}
                            <div className="flex flex-col justify-center bg-card/40 border border-white/10 rounded-2xl px-5 py-4 w-40 shrink-0 mr-24 relative overflow-hidden shadow-lg">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-glow opacity-[0.04]" />
                                <div className="relative">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Overall Score</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold font-poppins leading-none">{scores.overall || 0}</span>
                                        <span className="text-[10px] text-muted-foreground">/100</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden mt-3">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${scores?.overall >= 80 ? 'from-secondary to-secondary-glow' : scores?.overall >= 60 ? 'from-primary to-primary-glow' : 'from-accent to-accent-glow'} transition-all duration-1000`} style={{ width: `${scores.overall || 0}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mini score breakdown */}
                        {scores && (
                            <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2">
                                {[
                                    { label: 'Fluency', value: scores.fluency, icon: Mic },
                                    { label: 'Content', value: scores.content_quality, icon: Brain },
                                    { label: 'Confidence', value: scores.confidence, icon: Target },
                                ].map(s => {
                                    const barColor = s.value >= 80 ? 'bg-secondary' : s.value >= 60 ? 'bg-primary' : 'bg-accent';
                                    const valColor = s.value >= 80 ? 'text-secondary' : s.value >= 60 ? 'text-primary' : 'text-accent';
                                    return (
                                        <div key={s.label} className="flex flex-col justify-center bg-card/40 border border-white/10 rounded-2xl p-4 relative overflow-hidden shadow-sm">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-glow opacity-[0.02]" />
                                            <div className="relative space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                        <s.icon className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</span>
                                                    </div>
                                                    <span className={`text-sm font-bold font-poppins ${valColor}`}>{s.value}<span className="text-[10px] text-muted-foreground ml-0.5 font-sans font-normal">/100</span></span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden w-full">
                                                    <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${s.value}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </DialogHeader>
                </div>

                {/* ── Tabs ── */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12 min-h-[300px]">
                        <div className="flex flex-col items-center gap-4 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-medium">Generating your interview report...</p>
                        </div>
                    </div>
                ) : !report || !scores ? (
                    <div className="flex-1 flex items-center justify-center p-12 min-h-[300px]">
                        <p className="text-sm text-muted-foreground">Report data is unavailable.</p>
                    </div>
                ) : (
                    <Tabs defaultValue="transcript" className="flex-1 flex flex-col overflow-hidden">
                        <div className="border-b border-white/[0.06] px-6 shrink-0">
                            <TabsList className="bg-transparent h-12 p-0 gap-2 w-full flex overflow-x-auto hide-scrollbar">
                                {[
                                    { value: 'transcript', label: content.tabs.transcript, icon: MessageSquare },
                                    { value: 'skills', label: content.tabs.skills, icon: Target },
                                    { value: 'resume', label: content.tabs.resume, icon: BookOpen },
                                    { value: 'summary', label: content.tabs.summary, icon: Lightbulb },
                                    { value: 'export', label: content.tabs.export, icon: Download },
                                ].map(({ value, label, icon: Icon }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="relative flex-1 rounded-t-lg border-b-2 border-transparent data-[state=active]:border-primary hover:bg-white/5 data-[state=active]:bg-primary/5 data-[state=active]:shadow-none px-4 h-12 text-sm font-medium gap-2 transition-all data-[state=active]:text-primary flex items-center justify-center"
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="hidden sm:inline">{label}</span>
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto min-h-0">
                            {/* ── Transcript Tab ── */}
                            <TabsContent value="transcript" className="space-y-3 mt-0">
                                {report?.questions?.map((q) => (
                                    <TranscriptQuestion key={q.number} question={q} />
                                ))}
                            </TabsContent>

                            {/* ── Skills Tab ── */}
                            <TabsContent value="skills" className="mt-0">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Target className="w-4 h-4 text-primary" />
                                        Skill Breakdown
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                        {(() => {
                                            const colors = ['primary', 'neonBlue', 'neonGreen', 'accent', 'neonPurple'];
                                            return Object.entries(report.skill_scores || {}).map(([key, value], i) => (
                                                <SkillBar key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={value} color={colors[i % colors.length]} />
                                            ));
                                        })()}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Resume Tab ── */}
                            <TabsContent value="resume" className="space-y-2 mt-0">
                                {(() => {
                                    const resume = displaySession?.structured_resume_snapshot;
                                    if (!resume) {
                                        return (
                                            <div className="text-center py-10 text-muted-foreground text-sm">
                                                <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                No resume data available for this session.
                                            </div>
                                        );
                                    }
                                    return (
                                        <>
                                            <p className="text-xs text-muted-foreground mb-4">
                                                This is the resume used for your interview on {formatDate(displaySession.created_at)}.
                                            </p>
                                            {resume.personal_info && (
                                                <ResumeSection title={content.resumeSections.personalInfo} icon={User} defaultOpen>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                        {[
                                                            [content.personalInfoLabels.name, resume.personal_info.name],
                                                            [content.personalInfoLabels.email, resume.personal_info.email],
                                                            [content.personalInfoLabels.phone, resume.personal_info.phone],
                                                            [content.personalInfoLabels.location, resume.personal_info.location],
                                                        ].filter(([, val]) => val).map(([label, val]) => (
                                                            <div key={label} className="bg-muted/20 rounded-lg p-2.5">
                                                                <span className="text-[10px] text-muted-foreground block">{label}</span>
                                                                <span className="text-sm font-medium">{val}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ResumeSection>
                                            )}
                                            {resume.education?.length > 0 && (
                                                <ResumeSection title={content.resumeSections.education} icon={GraduationCap}>
                                                    {resume.education.map((ed, i) => (
                                                        <div key={i} className="bg-muted/20 rounded-lg p-3 text-sm">
                                                            <div className="font-medium">{ed.degree}</div>
                                                            <div className="text-xs text-muted-foreground">{ed.institution} · {ed.year}{ed.gpa && ` · GPA: ${ed.gpa}`}</div>
                                                        </div>
                                                    ))}
                                                </ResumeSection>
                                            )}
                                            {resume.experience?.length > 0 && (
                                                <ResumeSection title={content.resumeSections.experience} icon={Briefcase}>
                                                    {resume.experience.map((ex, i) => (
                                                        <div key={i} className="bg-muted/20 rounded-lg p-3 space-y-1.5">
                                                            <div className="text-sm font-medium">{ex.title} <span className="text-muted-foreground font-normal">at {ex.company}</span></div>
                                                            <div className="text-[10px] text-muted-foreground">{ex.duration}</div>
                                                            {ex.bullets?.length > 0 && (
                                                                <ul className="space-y-0.5 mt-2">
                                                                    {ex.bullets.map((b, j) => (
                                                                        <li key={j} className="text-xs text-muted-foreground flex gap-1.5">
                                                                            <span className="text-primary mt-1 shrink-0">•</span>{b}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    ))}
                                                </ResumeSection>
                                            )}
                                            {resume.projects?.length > 0 && (
                                                <ResumeSection title={content.resumeSections.projects} icon={Code}>
                                                    {resume.projects.map((p, i) => (
                                                        <div key={i} className="bg-muted/20 rounded-lg p-3 space-y-2">
                                                            <div className="text-sm font-medium">{p.name}</div>
                                                            <div className="text-xs text-muted-foreground">{p.description}</div>
                                                            {p.tech_stack?.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {p.tech_stack.map((t) => (
                                                                        <Badge key={t} variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">{t}</Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </ResumeSection>
                                            )}
                                            {resume.skills && Object.keys(resume.skills).length > 0 && (
                                                <ResumeSection title={content.resumeSections.skills} icon={Award}>
                                                    <div className="space-y-2">
                                                        {Object.entries(resume.skills).map(([cat, skills]) => (
                                                            <div key={cat} className="bg-muted/20 rounded-lg p-3">
                                                                <div className="text-xs font-semibold text-primary mb-1.5">{cat}</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {(Array.isArray(skills) ? skills : [skills]).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ResumeSection>
                                            )}
                                        </>
                                    );
                                })()}
                            </TabsContent>

                            {/* ── Summary Tab ── */}
                            <TabsContent value="summary" className="space-y-6 mt-0">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    <ScoreRing score={scores.overall} size={120} strokeWidth={7} color="primary" />
                                    <div className="flex-1 space-y-1 text-center sm:text-left text-balance">
                                        <div className={`text-3xl font-bold font-poppins ${getScoreColor(scores.overall)}`}>
                                            {scores.overall >= 80 ? 'Excellent' : scores.overall >= 60 ? 'Good' : scores.overall >= 40 ? 'Fair' : 'Needs Work'}
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{report.summary}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-neon-green/5 border border-neon-green/10 rounded-xl p-4 space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4 text-neon-green" />
                                            {content.behavioralSuggestions}
                                        </h4>
                                        <ul className="space-y-2">
                                            {report.behavioral_suggestions?.map((s, i) => (
                                                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                    <span className="text-neon-green mt-0.5 shrink-0">→</span>{s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <Code className="w-4 h-4 text-primary" />
                                            {content.technicalSuggestions}
                                        </h4>
                                        <ul className="space-y-2">
                                            {report.technical_suggestions?.map((s, i) => (
                                                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                                                    <span className="text-primary mt-0.5 shrink-0">→</span>{s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Export Tab ── */}
                            <TabsContent value="export" className="mt-0">
                                <div className="flex flex-col items-center py-10 space-y-6">
                                    <div className="text-center space-y-2">
                                        <Trophy className="w-10 h-10 text-primary mx-auto mb-4" />
                                        <h3 className="font-poppins font-semibold text-lg">Export Your Report</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm">Download your interview performance report to share or review offline.</p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="group border-white/10 hover:border-primary/30 hover:bg-primary/5 transition-all w-full sm:w-auto"
                                            onClick={async () => {
                                                try {
                                                    const { default: jsPDF } = await import('jspdf');
                                                    const doc = new jsPDF();
                                                    const role = displaySession.role || displaySession.target_role || '';
                                                    const company = displaySession.company || displaySession.company_name || '';
                                                    let y = 20;
                                                    doc.setFontSize(20);
                                                    doc.text('MockMate AI — Interview Report', 14, y); y += 12;
                                                    doc.setFontSize(11);
                                                    doc.text(`Role: ${role}    Company: ${company}`, 14, y); y += 7;
                                                    doc.text(`Date: ${formatDate(displaySession.created_at)}    Score: ${scores?.overall ?? 'N/A'}/100`, 14, y); y += 10;
                                                    if (report?.summary) {
                                                        doc.setFontSize(13); doc.text('Summary', 14, y); y += 7;
                                                        doc.setFontSize(9);
                                                        const lines = doc.splitTextToSize(report.summary, 180);
                                                        doc.text(lines, 14, y); y += lines.length * 4.5 + 6;
                                                    }
                                                    if (report?.questions?.length) {
                                                        doc.setFontSize(13); doc.text('Transcript', 14, y); y += 7;
                                                        report.questions.forEach((q, i) => {
                                                            if (y > 270) { doc.addPage(); y = 20; }
                                                            doc.setFontSize(10); doc.setFont(undefined, 'bold');
                                                            doc.text(`Q${i + 1}: ${q.questionText?.substring(0, 80)}`, 14, y); y += 5;
                                                            doc.setFont(undefined, 'normal'); doc.setFontSize(9);
                                                            const aLines = doc.splitTextToSize(`A: ${q.userAnswer?.substring(0, 300) || 'No answer'}`, 180);
                                                            doc.text(aLines, 14, y); y += aLines.length * 4 + 3;
                                                            doc.text(`Score: ${q.score}/10   ${q.comment?.substring(0, 100) || ''}`, 14, y); y += 7;
                                                        });
                                                    }
                                                    doc.save(`MockMate_Report_${displaySession.id || 'report'}.pdf`);
                                                } catch (err) {
                                                    console.error('PDF export failed:', err);
                                                    alert('PDF export failed. Please try again.');
                                                }
                                            }}
                                        >
                                            <FileDown className="w-5 h-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
                                            {content.downloadPdf}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="group border-white/10 hover:border-neon-green/30 hover:bg-neon-green/5 transition-all w-full sm:w-auto"
                                            onClick={() => {
                                                const blob = new Blob([JSON.stringify({ session: displaySession, report }, null, 2)], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `report_${displaySession.id}.json`;
                                                a.click();
                                            }}
                                        >
                                            <Download className="w-5 h-5 mr-2 text-neon-green group-hover:scale-110 transition-transform" />
                                            {content.downloadJson}
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
}

/* ── Transcript Question Card ── */
function TranscriptQuestion({ question }) {
    const [expanded, setExpanded] = useState(false);

    const scoreColor = question.score >= 8 ? 'text-neon-green border-neon-green/30 bg-neon-green/10'
        : question.score >= 6 ? 'text-primary border-primary/30 bg-primary/10'
            : question.score >= 4 ? 'text-accent border-accent/30 bg-accent/10'
                : 'text-destructive border-destructive/30 bg-destructive/10';

    return (
        <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
            {/* Question header */}
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono bg-muted/30 border-white/10">
                            Q{question.number}
                        </Badge>
                        <Badge className="text-[10px] bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/15">
                            {question.section}
                        </Badge>
                    </div>
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${scoreColor}`}>
                        {question.score}/10
                    </div>
                </div>

                <p className="text-sm font-medium leading-relaxed">{question.questionText}</p>

                {/* User Answer */}
                <div className="bg-muted/20 rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">{content.yourAnswer}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{question.userAnswer}</p>
                </div>

                {/* Feedback */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-secondary/5 border border-secondary/10 rounded-lg p-2.5">
                        <p className="text-[10px] text-secondary font-semibold uppercase tracking-wider mb-1">{content.commentLabel}</p>
                        <p className="text-xs text-muted-foreground">{question.comment}</p>
                    </div>
                    <div className="bg-accent/5 border border-accent/10 rounded-lg p-2.5">
                        <p className="text-[10px] text-accent font-semibold uppercase tracking-wider mb-1">{content.suggestionLabel}</p>
                        <p className="text-xs text-muted-foreground">{question.suggestion}</p>
                    </div>
                </div>
            </div>

            {/* Expected Answer Toggle */}
            <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-primary border-t border-white/[0.04] transition-colors">
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expanded ? content.hideExpected : content.showExpected}
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-4 pb-4">
                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider mb-1.5">Expected Answer</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{question.expectedAnswer}</p>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

/* ── Resume Collapsible Section ── */
function ResumeSection({ title, icon: Icon, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">{title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 px-3 pb-3 animate-in fade-in slide-in-from-top-2">{children}</CollapsibleContent>
        </Collapsible>
    );
}
