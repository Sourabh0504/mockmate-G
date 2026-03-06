import { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { DUMMY_RESUME } from '../data/dummy';
import {
    Calendar, Clock, ChevronDown, ChevronUp, Download, FileDown,
    MessageSquare, Lightbulb, Target, Trophy, Sparkles, BookOpen,
    User, GraduationCap, Briefcase, Code, Award,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

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
        neonBlue: 'bg-neon-blue', neonGreen: 'bg-neon-green', neonPurple: 'bg-neon-purple',
    };
    const shadowColor = color === 'neonBlue' ? 'neon-blue' : color === 'neonGreen' ? 'neon-green' : color === 'neonPurple' ? 'neon-purple' : color;

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center">
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
    const report = session?.report;
    const scores = session?.scores;
    if (!report || !scores) return null;

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
                        <div className="flex items-start justify-between gap-4">
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
                                    <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full">
                                        <Calendar className="w-3 h-3" />{formatDate(session.created_at)}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full">
                                        <Clock className="w-3 h-3" />{session.duration_selected || session.duration || 20} min
                                    </span>
                                    <Badge variant="secondary" className="text-[10px]">{session.difficulty}</Badge>
                                </div>
                            </div>

                            {/* Score Ring */}
                            <div className="flex flex-col items-center">
                                <ScoreRing score={scores.overall} size={88} strokeWidth={5} color="primary" />
                                <span className="text-[10px] text-muted-foreground mt-1 font-medium">Overall Score</span>
                            </div>
                        </div>

                        {/* Mini score breakdown */}
                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/[0.06] overflow-x-auto pb-2">
                            <ScoreRing score={scores.fluency} size={56} strokeWidth={4} label="Fluency" color="neonBlue" />
                            <ScoreRing score={scores.content_quality} size={56} strokeWidth={4} label="Content" color="neonGreen" />
                            <ScoreRing score={scores.confidence} size={56} strokeWidth={4} label="Confidence" color="neonPurple" />
                        </div>
                    </DialogHeader>
                </div>

                {/* ── Tabs ── */}
                <Tabs defaultValue="transcript" className="flex-1 flex flex-col overflow-hidden">
                    <div className="border-b border-white/[0.06] px-6 shrink-0">
                        <TabsList className="bg-transparent h-11 p-0 gap-0 w-full justify-start overflow-x-auto hide-scrollbar">
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
                                    className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-4 h-11 text-xs font-medium gap-1.5 transition-all data-[state=active]:text-primary"
                                >
                                    <Icon className="w-3.5 h-3.5" />
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <Target className="w-4 h-4 text-primary" />
                                        Skill Breakdown
                                    </h4>
                                    {(() => {
                                        const colors = ['primary', 'neonBlue', 'neonGreen', 'accent', 'neonPurple'];
                                        return Object.entries(report.skill_scores || {}).map(([key, value], i) => (
                                            <SkillBar key={key} label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={value} color={colors[i % colors.length]} />
                                        ));
                                    })()}
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="relative">
                                        <ScoreRing score={scores.overall} size={160} strokeWidth={8} color="primary" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold font-poppins">{scores.overall}</span>
                                            <span className="text-[10px] text-muted-foreground">Overall</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* ── Resume Tab ── */}
                        <TabsContent value="resume" className="space-y-2 mt-0">
                            <p className="text-xs text-muted-foreground mb-4">
                                This is the resume used for your interview on {formatDate(session.created_at)}.
                            </p>
                            <ResumeSection title={content.resumeSections.personalInfo} icon={User} defaultOpen>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    {[
                                        [content.personalInfoLabels.name, DUMMY_RESUME.personal_info.name],
                                        [content.personalInfoLabels.email, DUMMY_RESUME.personal_info.email],
                                        [content.personalInfoLabels.phone, DUMMY_RESUME.personal_info.phone],
                                        [content.personalInfoLabels.location, DUMMY_RESUME.personal_info.location],
                                    ].map(([label, val]) => (
                                        <div key={label} className="bg-muted/20 rounded-lg p-2.5">
                                            <span className="text-[10px] text-muted-foreground block">{label}</span>
                                            <span className="text-sm font-medium">{val}</span>
                                        </div>
                                    ))}
                                </div>
                            </ResumeSection>
                            <ResumeSection title={content.resumeSections.education} icon={GraduationCap}>
                                {DUMMY_RESUME.education.map((ed, i) => (
                                    <div key={i} className="bg-muted/20 rounded-lg p-3 text-sm">
                                        <div className="font-medium">{ed.degree}</div>
                                        <div className="text-xs text-muted-foreground">{ed.institution} · {ed.year}{ed.gpa && ` · GPA: ${ed.gpa}`}</div>
                                    </div>
                                ))}
                            </ResumeSection>
                            <ResumeSection title={content.resumeSections.experience} icon={Briefcase}>
                                {DUMMY_RESUME.experience.map((ex, i) => (
                                    <div key={i} className="bg-muted/20 rounded-lg p-3 space-y-1.5">
                                        <div className="text-sm font-medium">{ex.title} <span className="text-muted-foreground font-normal">at {ex.company}</span></div>
                                        <div className="text-[10px] text-muted-foreground">{ex.duration}</div>
                                        <ul className="space-y-0.5 mt-2">
                                            {ex.bullets.map((b, j) => (
                                                <li key={j} className="text-xs text-muted-foreground flex gap-1.5">
                                                    <span className="text-primary mt-1 shrink-0">•</span>{b}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </ResumeSection>
                            <ResumeSection title={content.resumeSections.projects} icon={Code}>
                                {DUMMY_RESUME.projects.map((p, i) => (
                                    <div key={i} className="bg-muted/20 rounded-lg p-3 space-y-2">
                                        <div className="text-sm font-medium">{p.name}</div>
                                        <div className="text-xs text-muted-foreground">{p.description}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {p.tech_stack.map((t) => (
                                                <Badge key={t} variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">{t}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </ResumeSection>
                            <ResumeSection title={content.resumeSections.skills} icon={Award}>
                                <div className="space-y-2">
                                    {Object.entries(DUMMY_RESUME.skills).map(([cat, skills]) => (
                                        <div key={cat} className="bg-muted/20 rounded-lg p-3">
                                            <div className="text-xs font-semibold text-primary mb-1.5">{cat}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {skills.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ResumeSection>
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
                                        onClick={() => alert('PDF export coming soon!')}
                                    >
                                        <FileDown className="w-5 h-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
                                        {content.downloadPdf}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="group border-white/10 hover:border-neon-green/30 hover:bg-neon-green/5 transition-all w-full sm:w-auto"
                                        onClick={() => {
                                            const blob = new Blob([JSON.stringify({ session, report }, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `report_${session.id}.json`;
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
