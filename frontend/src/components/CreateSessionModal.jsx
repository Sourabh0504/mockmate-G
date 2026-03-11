/**
 * CreateSessionModal.jsx — Exact port of Lovable's CreateSessionModal.tsx
 * Uses Radix Dialog, Slider, Select. Calls real sessionApi.create().
 */
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/input';
import { Textarea } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { ScrollArea } from './ui/scroll-area';
import { Upload, Sparkles, Briefcase, FileText, Gauge, Clock, Building2, Check, X } from 'lucide-react';
import { sessionApi, resumeApi } from '../services/api';

export default function CreateSessionModal({ open, onOpenChange, onSessionCreated }) {
    const [role, setRole] = useState('');
    const [company, setCompany] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Moderate');
    const [duration, setDuration] = useState([15]);
    const [resumeId, setResumeId] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [uploadingResume, setUploadingResume] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch user resumes when modal opens
    useEffect(() => {
        if (open) {
            resumeApi.list()
                .then(res => setResumes(res.data))
                .catch(err => console.error('Failed to load resumes', err));
        }
    }, [open]);

    const handleResumeUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingResume(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await resumeApi.upload(formData);
            setResumes(prev => [res.data, ...prev]);
            setResumeId(res.data.id);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to upload resume. Please try again.';
            setError(msg);
            console.error('Failed to upload resume', err);
        } finally {
            setUploadingResume(false);
            // Reset file input so the same file can be re-selected
            e.target.value = '';
        }
    };

    const difficultyConfig = {
        Easy: { color: 'border-secondary/30 bg-secondary/[0.08] text-secondary', glow: 'shadow-[0_0_12px_hsl(var(--secondary)/0.15)]', icon: '🟢' },
        Moderate: { color: 'border-accent/30 bg-accent/[0.08] text-accent', glow: 'shadow-[0_0_12px_hsl(var(--accent)/0.15)]', icon: '🟡' },
        Hard: { color: 'border-destructive/30 bg-destructive/[0.08] text-destructive', glow: 'shadow-[0_0_12px_hsl(var(--destructive)/0.15)]', icon: '🔴' },
    };

    const canCreate = role && jobDescription.length >= 50 && resumeId;
    const jdProgress = Math.min((jobDescription.length / 50) * 100, 100);

    const handleSubmit = async () => {
        if (!canCreate) return;
        setLoading(true);
        try {
            setError('');
            const res = await sessionApi.create({
                role,
                company,
                jd_text: jobDescription,
                difficulty,
                duration: duration[0],
                resume_id: resumeId,
            });
            onSessionCreated(res.data);
            onOpenChange(false);
            setRole(''); setCompany(''); setJobDescription(''); setDifficulty('Moderate'); setDuration([15]); setResumeId(null);
        } catch (err) {
            const msg = err.response?.data?.detail || 'Failed to create session. Please try again.';
            setError(msg);
            console.error('Failed to create session', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:w-[75vw] sm:max-w-[720px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">

                {/* Header gradient accent line */}
                <div className="relative shrink-0">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                    <div className="px-7 pt-6 pb-2">
                        <div className="flex justify-center mb-3">
                            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-primary/[0.15] border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-sm font-poppins font-semibold text-foreground">New Practice Session</span>
                            </div>
                        </div>
                        <DialogHeader className="sr-only">
                            <DialogTitle>New Practice Session</DialogTitle>
                            <DialogDescription>Set up your AI mock interview session</DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {/* Scrollable content */}
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="px-7 pb-4 space-y-5">

                        {/* Error message */}
                        {error && (
                            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        {/* Role & Company row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="role"><Briefcase className="w-3.5 h-3.5" /> Target Role *</Label>
                                <Input id="role" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="company"><Building2 className="w-3.5 h-3.5" /> Company</Label>
                                <Input id="company" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Google" />
                            </div>
                        </div>

                        {/* Resume Selection */}
                        <div className="space-y-1.5 pt-2">
                            <Label htmlFor="resume"><Upload className="w-3.5 h-3.5" /> Resume *</Label>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    {resumes.length > 0 ? (
                                        <Select value={resumeId} onValueChange={setResumeId}>
                                            <SelectTrigger id="resume" className="w-full">
                                                <SelectValue placeholder="Select a resume to use..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={null}>None (Role & JD only)</SelectItem>
                                                {resumes.map(r => (
                                                    <SelectItem key={r.id} value={r.id}>
                                                        {r.filename}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="h-11 rounded-xl border border-white/[0.15] bg-white/[0.02] flex items-center px-4 text-sm text-muted-foreground/60 italic">
                                            No resumes uploaded yet
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="resume-upload"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleResumeUpload}
                                        className="sr-only"
                                        disabled={uploadingResume}
                                    />
                                    <label
                                        htmlFor="resume-upload"
                                        className={`flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${uploadingResume
                                            ? 'bg-muted/30 border-white/[0.1] text-muted-foreground/50'
                                            : 'bg-white/[0.05] border-white/[0.15] text-foreground hover:bg-white/[0.1] hover:border-white/[0.25]'
                                            }`}
                                    >
                                        {uploadingResume ? (
                                            <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</span>
                                        ) : (
                                            <><Upload className="w-4 h-4 mr-2" /> Upload New</>
                                        )}
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Job Description with progress */}
                        <div className="space-y-1.5">
                            <Label htmlFor="jd"><FileText className="w-3.5 h-3.5" /> Job Description * (min 50 chars)</Label>
                            <div className="relative">
                                <Textarea
                                    id="jd"
                                    value={jobDescription}
                                    onChange={e => setJobDescription(e.target.value)}
                                    placeholder="Paste the job description here for tailored questions..."
                                    rows={4}
                                    className="pb-7"
                                />
                                <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
                                    <div className="flex-1 h-1 rounded-full bg-white/[0.15] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${jdProgress >= 100 ? 'bg-secondary' : 'bg-primary'}`}
                                            style={{ width: `${jdProgress}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-mono tabular-nums ${jobDescription.length >= 50 ? 'text-secondary/90' : 'text-muted-foreground/70'}`}>
                                        {jobDescription.length}/50
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />

                        {/* Difficulty & Duration row */}
                        <div className="grid grid-cols-2 gap-5">
                            {/* Difficulty */}
                            <div className="space-y-2">
                                <Label><Gauge className="w-3.5 h-3.5" /> Difficulty</Label>
                                <div className="flex gap-1.5">
                                    {['Easy', 'Moderate', 'Hard'].map(d => {
                                        const cfg = difficultyConfig[d];
                                        const isActive = difficulty === d;
                                        return (
                                            <button key={d} onClick={() => setDifficulty(d)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300 border cursor-pointer flex items-center justify-center ${isActive ? `${cfg.color} ${cfg.glow}` : 'bg-white/[0.05] border-white/[0.15] text-muted-foreground/80 hover:border-white/[0.25] hover:text-foreground'
                                                    }`}>
                                                {isActive && <span className="mr-1">{cfg.icon}</span>}{d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="space-y-2">
                                <Label><Clock className="w-3.5 h-3.5" /> Duration</Label>
                                <div className="rounded-xl border border-white/[0.15] bg-white/[0.05] p-3 space-y-2.5">
                                    <div className="flex items-center justify-center">
                                        <span className="text-2xl font-poppins font-black text-primary tabular-nums">{duration[0]}</span>
                                        <span className="text-xs text-muted-foreground/80 ml-1.5">min</span>
                                    </div>
                                    <Slider value={duration} onValueChange={setDuration} min={10} max={30} step={5} />
                                    <div className="flex justify-between text-[10px] text-muted-foreground/70">
                                        <span>10 min</span><span>30 min</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="shrink-0 px-7 py-4 border-t border-white/[0.15] flex items-center gap-4 bg-white/[0.02]">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}
                        className="px-6 h-11 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border border-destructive/30 rounded-xl">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canCreate || loading}
                        className={`flex-1 h-11 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${canCreate ? 'bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] shadow-[0_0_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5' : 'bg-muted/50 text-muted-foreground/80'
                            }`}>
                        {loading ? (
                            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</span>
                        ) : (
                            <><Sparkles className="w-4 h-4 mr-1.5" /> Create Session</>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
