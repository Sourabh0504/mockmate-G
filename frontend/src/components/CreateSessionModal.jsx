/**
 * CreateSessionModal.jsx — Exact port of Lovable's CreateSessionModal.tsx
 * Uses Radix Dialog, Slider, Select. Calls real sessionApi.create().
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/input';
import { Textarea } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { ScrollArea } from './ui/scroll-area';
import { Upload, Sparkles, Briefcase, FileText, Gauge, Clock, Building2 } from 'lucide-react';
import { sessionApi } from '../services/api';

export default function CreateSessionModal({ open, onOpenChange, onSessionCreated }) {
    const [role, setRole] = useState('');
    const [company, setCompany] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [difficulty, setDifficulty] = useState('Moderate');
    const [duration, setDuration] = useState([15]);
    const [loading, setLoading] = useState(false);

    const difficultyConfig = {
        Easy: { color: 'border-secondary/30 bg-secondary/[0.08] text-secondary', glow: 'shadow-[0_0_12px_hsl(var(--secondary)/0.15)]', icon: '🟢' },
        Moderate: { color: 'border-accent/30 bg-accent/[0.08] text-accent', glow: 'shadow-[0_0_12px_hsl(var(--accent)/0.15)]', icon: '🟡' },
        Hard: { color: 'border-destructive/30 bg-destructive/[0.08] text-destructive', glow: 'shadow-[0_0_12px_hsl(var(--destructive)/0.15)]', icon: '🔴' },
    };

    const canCreate = role && jobDescription.length >= 50;
    const jdProgress = Math.min((jobDescription.length / 50) * 100, 100);

    const handleSubmit = async () => {
        if (!canCreate) return;
        setLoading(true);
        try {
            const res = await sessionApi.create({
                role,
                company,
                job_description: jobDescription,
                difficulty,
                duration_selected: duration[0],
            });
            onSessionCreated(res.data);
            onOpenChange(false);
            setRole(''); setCompany(''); setJobDescription(''); setDifficulty('Moderate'); setDuration([15]);
        } catch (err) {
            console.error('Failed to create session', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:w-[60vw] sm:max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden">

                {/* Header gradient accent line */}
                <div className="relative">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                    <div className="px-7 pt-6 pb-2">
                        <div className="flex justify-center mb-3">
                            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
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
                <ScrollArea className="max-h-[calc(90vh-160px)]">
                    <div className="px-7 pb-4 space-y-5">

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
                                    <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${jdProgress >= 100 ? 'bg-secondary/60' : 'bg-primary/40'}`}
                                            style={{ width: `${jdProgress}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-mono tabular-nums ${jobDescription.length >= 50 ? 'text-secondary/70' : 'text-muted-foreground/25'}`}>
                                        {jobDescription.length}/50
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

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
                                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300 border cursor-pointer ${isActive ? `${cfg.color} ${cfg.glow}` : 'bg-white/[0.02] border-white/[0.06] text-muted-foreground/35 hover:border-white/[0.12] hover:text-muted-foreground/60'
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
                                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5">
                                    <div className="flex items-center justify-center">
                                        <span className="text-2xl font-poppins font-black text-primary tabular-nums">{duration[0]}</span>
                                        <span className="text-xs text-muted-foreground/40 ml-1.5">min</span>
                                    </div>
                                    <Slider value={duration} onValueChange={setDuration} min={10} max={30} step={5} />
                                    <div className="flex justify-between text-[10px] text-muted-foreground/20">
                                        <span>10 min</span><span>30 min</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-7 py-4 border-t border-white/[0.05] flex items-center gap-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}
                        className="px-6 h-11 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border border-destructive/20 rounded-xl">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canCreate || loading}
                        className={`flex-1 h-11 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${canCreate ? 'bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] shadow-[0_0_20px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_32px_hsl(var(--primary)/0.5)] hover:-translate-y-0.5' : 'bg-muted/40 text-muted-foreground/30'
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
