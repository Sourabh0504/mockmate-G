/**
 * VoiceSettingsModal.jsx — Settings modal for selecting and persisting Edge TTS voice.
 * Allows filtering by Gender and Accent, testing voices, and saving preference to DB.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Volume2, Loader2, Check, Square, Mic, Globe2, User as UserIcon } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const VOICES = [
    // ── US Male ──
    { name: 'en-US-AndrewMultilingualNeural', label: 'Andrew', gender: 'Male', accent: 'US', note: 'Professional, articulate' },
    { name: 'en-US-GuyNeural', label: 'Guy', gender: 'Male', accent: 'US', note: 'Casual, warm' },
    { name: 'en-US-ChristopherNeural', label: 'Christopher', gender: 'Male', accent: 'US', note: 'Neutral reporter' },
    { name: 'en-US-BrianMultilingualNeural', label: 'Brian', gender: 'Male', accent: 'US', note: 'Clear, confident' },
    { name: 'en-US-EricNeural', label: 'Eric', gender: 'Male', accent: 'US', note: 'Conversational' },
    { name: 'en-US-RogerNeural', label: 'Roger', gender: 'Male', accent: 'US', note: 'Deep, authoritative' },
    { name: 'en-US-SteffanNeural', label: 'Steffan', gender: 'Male', accent: 'US', note: 'Smooth narrator' },
    // ── US Female ──
    { name: 'en-US-JennyNeural', label: 'Jenny', gender: 'Female', accent: 'US', note: 'Clear, professional' },
    { name: 'en-US-AriaNeural', label: 'Aria', gender: 'Female', accent: 'US', note: 'Natural, friendly' },
    { name: 'en-US-AvaMultilingualNeural', label: 'Ava', gender: 'Female', accent: 'US', note: 'Warm, expressive' },
    { name: 'en-US-MichelleNeural', label: 'Michelle', gender: 'Female', accent: 'US', note: 'Composed, clear' },
    { name: 'en-US-EmmaMultilingualNeural', label: 'Emma', gender: 'Female', accent: 'US', note: 'Natural, modern' },
    // ── Indian English ──
    { name: 'en-IN-PrabhatNeural', label: 'Prabhat', gender: 'Male', accent: 'Indian', note: 'Indian English, clear' },
    { name: 'en-IN-NeerjaNeural', label: 'Neerja', gender: 'Female', accent: 'Indian', note: 'Indian English, natural' },
    { name: 'en-IN-NeerjaExpressiveNeural', label: 'Neerja (Expressive)', gender: 'Female', accent: 'Indian', note: 'Indian English, expressive' },
    // ── British ──
    { name: 'en-GB-RyanNeural', label: 'Ryan', gender: 'Male', accent: 'British', note: 'British accent' },
    { name: 'en-GB-ThomasNeural', label: 'Thomas', gender: 'Male', accent: 'British', note: 'British, professional' },
    { name: 'en-GB-SoniaNeural', label: 'Sonia', gender: 'Female', accent: 'British', note: 'British accent' },
    { name: 'en-GB-LibbyNeural', label: 'Libby', gender: 'Female', accent: 'British', note: 'British, friendly' },
    // ── Australian ──
    { name: 'en-AU-WilliamMultilingualNeural', label: 'William', gender: 'Male', accent: 'Australian', note: 'Australian accent' },
    { name: 'en-AU-NatashaNeural', label: 'Natasha', gender: 'Female', accent: 'Australian', note: 'Australian accent' },
];

export default function VoiceSettingsModal({ open, onOpenChange }) {
    const { user, updateUser } = useAuth();
    const [selectedVoice, setSelectedVoice] = useState(user?.preferred_voice || 'en-US-AndrewMultilingualNeural');
    const [playing, setPlaying] = useState(null); // voice name currently playing
    const [loadingAudio, setLoadingAudio] = useState(null); // voice name currently loading
    const [saving, setSaving] = useState(false);
    const audioRef = useRef(null);

    // Filters
    const [genderFilter, setGenderFilter] = useState('All');
    const [accentFilter, setAccentFilter] = useState('All');

    // Reset selection to user default when opening
    useEffect(() => {
        if (open) {
            setSelectedVoice(user?.preferred_voice || 'en-US-AndrewMultilingualNeural');
            setGenderFilter('All');
            setAccentFilter('All');
        }
    }, [open, user]);

    const stopAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }
        setPlaying(null);
    }, []);

    const playVoice = useCallback(async (voiceName) => {
        if (playing === voiceName) {
            stopAudio();
            return;
        }
        stopAudio();
        setLoadingAudio(voiceName);

        try {
            const res = await fetch(`${API_BASE}/tts/preview?voice=${encodeURIComponent(voiceName)}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            // Decode base64 MP3
            const binaryStr = atob(data.audio);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i);

            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => { setPlaying(null); URL.revokeObjectURL(url); };
            audio.onplay = () => { setLoadingAudio(null); setPlaying(voiceName); };
            audio.onerror = () => { setLoadingAudio(null); setPlaying(null); };

            await audio.play();
        } catch (err) {
            console.error('[VoicePreview] Failed:', err);
            setLoadingAudio(null);
        }
    }, [playing, stopAudio]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authApi.updateVoice({ voice: selectedVoice });
            updateUser(res.data);
            handleClose(false);
        } catch (error) {
            console.error('Failed to update voice:', error);
            alert('Failed to save voice preference.');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = (val) => {
        if (!val) stopAudio();
        onOpenChange(val);
    };

    const filteredVoices = VOICES.filter(v => {
        if (genderFilter !== 'All' && v.gender !== genderFilter) return false;
        if (accentFilter !== 'All' && v.accent !== accentFilter) return false;
        return true;
    });

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] w-[95vw] bg-card/95 backdrop-blur-xl border-white/10 p-0 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
                
                {/* Header Section */}
                <div className="p-5 md:p-6 pb-4 border-b border-white/5 bg-muted/10 shrink-0">
                    <DialogHeader className="space-y-1.5 mb-4">
                        <DialogTitle className="flex items-center gap-2 font-poppins text-xl tracking-tight">
                            <Mic className="w-5 h-5 text-primary" />
                            Interviewer Voice
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed">
                            Select the personality and tone for your AI interviewer. This preference actively applies to all your future mock sessions.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-1">
                        <div className="flex items-center gap-1.5 bg-background/50 rounded-lg p-1.5 border border-white/5 w-fit">
                            <UserIcon className="w-4 h-4 text-muted-foreground ml-2" />
                            {['All', 'Male', 'Female'].map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGenderFilter(g)}
                                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                                        genderFilter === g ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                    }`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 bg-background/50 rounded-lg p-1.5 border border-white/5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                            <Globe2 className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
                            {['All', 'US', 'Indian', 'British', 'Australian'].map(a => (
                                <button
                                    key={a}
                                    onClick={() => setAccentFilter(a)}
                                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                                        accentFilter === a ? 'bg-secondary/20 text-secondary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                    }`}
                                >
                                    {a === 'All' ? 'All Accents' : a}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Voice List */}
                <div className="p-4 md:p-5 overflow-y-auto flex-1 bg-background/40 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[250px] relative">
                    {filteredVoices.map((voice) => {
                        const isPlaying = playing === voice.name;
                        const isLoading = loadingAudio === voice.name;
                        const isSelected = selectedVoice === voice.name;

                        return (
                            <div
                                key={voice.name}
                                onClick={() => setSelectedVoice(voice.name)}
                                className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer
                                    ${isSelected
                                        ? 'bg-primary/5 border-primary/50 shadow-[0_4px_15px_-10px_rgba(var(--primary-rgb),0.3)]'
                                        : 'bg-card/30 border-white/5 hover:bg-card/60 hover:border-white/10'
                                    }
                                `}
                            >
                                {/* Play/Stop button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); playVoice(voice.name); }}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors mt-0.5
                                        ${isLoading ? 'bg-background/80 text-muted-foreground border border-white/5' :
                                          isPlaying ? 'bg-primary text-white shadow-md' : 
                                          isSelected ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20' :
                                          'bg-background border border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground'}
                                    `}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isPlaying ? (
                                        <Square className="w-3.5 h-3.5 fill-current" />
                                    ) : (
                                        <Volume2 className="w-3.5 h-3.5" />
                                    )}
                                </button>

                                {/* Voice info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-baseline gap-1.5 min-w-0 pr-2">
                                            <span className={`font-semibold text-[13px] sm:text-[14px] shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                {voice.label}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/70 truncate">
                                                — {voice.note}
                                            </span>
                                        </div>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 transition-transform scale-100" />}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold transition-colors ${
                                            voice.gender === 'Male' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'
                                        }`}>
                                            {voice.gender}
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground uppercase tracking-wider font-bold">
                                            {voice.accent}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredVoices.length === 0 && (
                        <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center text-muted-foreground py-12">
                            <Mic className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-sm">No voices match these filters.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 md:px-6 md:py-4 border-t border-white/5 bg-background/50 flex flex-col-reverse sm:flex-row items-center gap-4 justify-between shrink-0 mt-auto">
                    <p className="text-xs text-muted-foreground text-center sm:text-left w-full sm:w-auto">
                        Your selection applies instantly. Change anytime in your profile.
                    </p>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button variant="ghost" onClick={() => handleClose(false)} className="flex-1 sm:flex-none">
                            Discard
                        </Button>
                        <Button onClick={handleSave} disabled={saving || selectedVoice === user?.preferred_voice} className="flex-1 sm:flex-none min-w-[120px] shadow-sm">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {saving ? 'Saving...' : 'Save Voice'}
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
