import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Mic, Camera, Shield, Play, AlertTriangle } from 'lucide-react';

const RULES = [
    'You have 10 seconds to start speaking after each question.',
    'If you pause for more than 7 seconds, the AI will move to the next question.',
    'Each answer has a maximum of 120 seconds.',
    'You can say "Can you repeat that?" to hear the question again.',
    'You can end the interview early — partial results will still be evaluated.',
    'This interview is set for {duration} minutes.',
];

export default function RulesModal({ open, onClose, session }) {
    const [agreed, setAgreed] = useState(false);
    const [micChecked, setMicChecked] = useState(false);
    const [camChecked, setCamChecked] = useState(false);
    const navigate = useNavigate();

    if (!session) return null;

    const handleMicToggle = async (checked) => {
        if (checked) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(t => t.stop());
                setMicChecked(true);
            } catch {
                setMicChecked(false);
            }
        } else {
            setMicChecked(false);
        }
    };

    const handleCamToggle = async (checked) => {
        if (checked) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(t => t.stop());
                setCamChecked(true);
            } catch {
                setCamChecked(false);
            }
        } else {
            setCamChecked(false);
        }
    };

    const canStart = agreed && micChecked && camChecked;

    const handleStart = () => {
        navigate(`/interview/${session.id}`);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="border-white/[0.08] bg-[hsl(240,10%,5.5%)]/95 backdrop-blur-2xl w-[90vw] sm:max-w-[60vw] max-h-[90vh] overflow-y-auto p-0 gap-0 shadow-[0_24px_64px_hsl(240,10%,0%/0.6)]">

                {/* ── Centered pill headline ── */}
                <div className="px-7 pt-6 pb-2">
                    <div className="flex justify-center mb-3">
                        <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-primary/[0.08] border border-primary/20">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-sm font-poppins font-semibold text-foreground">Before You Begin</span>
                        </div>
                    </div>
                    <DialogHeader className="sr-only">
                        <DialogTitle>Before You Begin</DialogTitle>
                    </DialogHeader>
                </div>

                <div className="px-7 pb-3 space-y-4">

                    {/* Rules */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/40">RULES</p>
                        <ul className="space-y-1.5">
                            {RULES.map((rule, i) => (
                                <li key={i} className="flex gap-2.5 text-sm text-muted-foreground/70 leading-relaxed">
                                    <span className="text-primary/40 font-mono text-xs mt-[3px] w-4 shrink-0">{i + 1}.</span>
                                    {rule.replace('{duration}', String(session.duration_selected || '20'))}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Network warning */}
                    <div className="flex gap-2.5 rounded-xl bg-accent/[0.04] border border-accent/10 px-3.5 py-2.5">
                        <AlertTriangle className="w-4 h-4 text-accent/50 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground/60 leading-relaxed">
                            <strong>Network Policy:</strong> If you lose connection, you have 3 minutes to reconnect. Your audio is processed in real time and never stored. Only the text transcript is saved.
                        </p>
                    </div>

                    <div className="h-[1px] bg-white/[0.05]" />

                    {/* ── Mic & Camera in one row ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Mic */}
                        <label
                            htmlFor="mic-check"
                            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 cursor-pointer transition-all duration-200 border ${micChecked
                                    ? "bg-secondary/[0.06] border-secondary/25"
                                    : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.12]"
                                }`}
                        >
                            <Checkbox
                                id="mic-check"
                                checked={micChecked}
                                onCheckedChange={(c) => handleMicToggle(!!c)}
                                className="h-5 w-5 border-white/20 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                            />
                            <Mic className={`w-4 h-4 shrink-0 ${micChecked ? "text-secondary" : "text-muted-foreground/40"}`} />
                            <span className="text-sm font-medium select-none">
                                {micChecked ? "Mic Ready" : "Allow Microphone"}
                            </span>
                        </label>

                        {/* Camera */}
                        <label
                            htmlFor="cam-check"
                            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 cursor-pointer transition-all duration-200 border ${camChecked
                                    ? "bg-secondary/[0.06] border-secondary/25"
                                    : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.12]"
                                }`}
                        >
                            <Checkbox
                                id="cam-check"
                                checked={camChecked}
                                onCheckedChange={(c) => handleCamToggle(!!c)}
                                className="h-5 w-5 border-white/20 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary"
                            />
                            <Camera className={`w-4 h-4 shrink-0 ${camChecked ? "text-secondary" : "text-muted-foreground/40"}`} />
                            <span className="text-sm font-medium select-none">
                                {camChecked ? "Camera Ready" : "Allow Camera"}
                            </span>
                        </label>
                    </div>

                    {/* ── Agree terms ── */}
                    <label
                        htmlFor="agree"
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-3 cursor-pointer transition-all duration-200 border ${agreed
                                ? "bg-primary/[0.06] border-primary/25"
                                : "bg-white/[0.02] border-white/[0.07] hover:border-white/[0.12]"
                            }`}
                    >
                        <Checkbox
                            id="agree"
                            checked={agreed}
                            onCheckedChange={(c) => setAgreed(!!c)}
                            className="h-5 w-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-sm font-medium select-none leading-snug">
                            I understand the rules and agree to the privacy policy regarding my interview data.
                        </span>
                    </label>
                </div>

                {/* ── Footer ── */}
                <div className="px-7 py-4 border-t border-white/[0.05] flex flex-col sm:flex-row items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 h-11 text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border border-destructive/20 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStart}
                        disabled={!canStart}
                        className={`w-full sm:flex-1 h-11 rounded-xl text-sm font-semibold tracking-wide transition-all duration-300 ${canStart
                                ? "bg-gradient-to-r from-secondary to-secondary-glow text-secondary-foreground shadow-[0_0_20px_hsl(var(--secondary)/0.35)] hover:shadow-[0_0_32px_hsl(var(--secondary)/0.5)] hover:-translate-y-0.5"
                                : "bg-muted/40 text-muted-foreground/30"
                            }`}
                    >
                        <Play className="w-4 h-4 mr-1.5" />
                        Agree and Start Interview
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
