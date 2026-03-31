/**
 * DataRetentionModal.jsx — Shown once on first login to inform users what data is stored.
 * Per plan.md Section 4: "On first login, show Data Retention Policy"
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Shield, Database, Clock, Trash2, Download } from 'lucide-react';

const RETENTION_ITEMS = [
    {
        icon: Database,
        title: 'What We Store',
        desc: 'Text transcripts, scores, and structured resume data. No audio or video is ever saved.',
    },
    {
        icon: Clock,
        title: 'How Long',
        desc: 'Your data is retained as long as your account exists. Deleted accounts are purged immediately.',
    },
    {
        icon: Shield,
        title: 'Privacy First',
        desc: 'Audio is processed in real-time and discarded instantly. Only text-based results persist.',
    },
    {
        icon: Download,
        title: 'Export Your Data',
        desc: 'You can export all your interview data as JSON at any time from your Profile page.',
    },
    {
        icon: Trash2,
        title: 'Delete Everything',
        desc: 'You can permanently delete your account and all associated data from your Profile page.',
    },
];

export default function DataRetentionModal({ open, onAccept }) {
    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                hideCloseButton
                className="sm:max-w-[520px] w-[92vw] bg-card/95 backdrop-blur-xl border-white/10 p-0 shadow-2xl rounded-2xl"
            >
                <DialogHeader className="px-6 pt-6 pb-2 space-y-3">
                    <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    <DialogTitle className="text-center font-poppins text-lg">
                        Data Retention Policy
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-muted-foreground">
                        Here's exactly what MockMate AI stores and how your privacy is protected.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 pb-2 space-y-2.5">
                    {RETENTION_ITEMS.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-white/5"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <item.icon className="w-4 h-4 text-primary/70" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{item.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-6 py-4 border-t border-white/5">
                    <Button onClick={onAccept} className="w-full h-11 rounded-xl text-sm font-semibold">
                        I Understand — Continue
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
