/**
 * InterviewPage.jsx — Full-screen AI interview with webcam, AI avatar, and question flow.
 * Uses useInterviewWS hook for real-time WebSocket communication with the backend.
 * Uses useAudioCapture for microphone PCM streaming and useAudioPlayback for AI TTS.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useInterviewWS from '../hooks/useInterviewWS';
import useAudioCapture from '../hooks/useAudioCapture';
import useAudioPlayback from '../hooks/useAudioPlayback';
import { Phone, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';

export default function InterviewPage() {
    const { session_id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // ── WebSocket hook — all interview state comes from here ──
    const ws = useInterviewWS(session_id);
    const {
        state, question: currentQuestion, questionIndex, totalQuestions,
        countdown, elapsed, aiSpeaking, pace, connected, error: wsError,
        endReason, endText,
        notifySpeaking, sendText, sendAudioChunk, endInterview: wsEndInterview, requestRepeat,
        onAudioDataRef,
    } = ws;

    // ── Audio capture (mic → PCM → WebSocket) ──
    const handleAudioChunk = useCallback((pcmBuffer) => {
        // Convert ArrayBuffer to base64
        const bytes = new Uint8Array(pcmBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        sendAudioChunk(b64);
    }, [sendAudioChunk]);

    const { isCapturing, startCapture, stopCapture, micPermission } = useAudioCapture(handleAudioChunk);

    // ── Audio playback (WebSocket TTS → speaker) ──
    const { isPlaying: isAudioPlaying, enqueue: enqueueAudio, clearBuffer: clearAudioBuffer } = useAudioPlayback();

    // Wire audio playback to WebSocket messages
    useEffect(() => {
        onAudioDataRef.current = enqueueAudio;
        return () => { onAudioDataRef.current = null; };
    }, [onAudioDataRef, enqueueAudio]);

    const [showEndDialog, setShowEndDialog] = useState(false);
    const [networkLost, setNetworkLost] = useState(false);
    const [reconnectSeconds, setReconnectSeconds] = useState(180);

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    /* ── Camera setup (video only — mic is handled by useAudioCapture) ── */
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(() => { });
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    /* ── Auto-start/stop audio capture based on interview state ── */
    useEffect(() => {
        if (connected && (state === 'waiting' || state === 'listening') && !isCapturing) {
            startCapture();
        } else if ((state === 'ended' || !connected) && isCapturing) {
            stopCapture();
        }
    }, [state, connected, isCapturing, startCapture, stopCapture]);

    /* ── Navigate to dashboard when interview ends ── */
    useEffect(() => {
        if (state === 'ended') {
            stopCapture();
            clearAudioBuffer();
            streamRef.current?.getTracks().forEach(t => t.stop());
            const timer = setTimeout(() => navigate('/dashboard'), 2500);
            return () => clearTimeout(timer);
        }
    }, [state, navigate, stopCapture, clearAudioBuffer]);

    /* ── Detect network loss + 180s countdown ── */
    const reconnectCountdownRef = useRef(null);

    useEffect(() => {
        if (!connected && state !== 'connecting' && state !== 'ended') {
            // Network lost — start 180s countdown
            setNetworkLost(true);
            setReconnectSeconds(180);
            stopCapture();  // Stop mic during disconnect

            reconnectCountdownRef.current = setInterval(() => {
                setReconnectSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(reconnectCountdownRef.current);
                        // Timeout expired — navigate to dashboard
                        navigate('/dashboard');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Connection restored or not applicable
            setNetworkLost(false);
            setReconnectSeconds(180);
            if (reconnectCountdownRef.current) {
                clearInterval(reconnectCountdownRef.current);
                reconnectCountdownRef.current = null;
            }
        }

        return () => {
            if (reconnectCountdownRef.current) {
                clearInterval(reconnectCountdownRef.current);
            }
        };
    }, [connected, state, navigate, stopCapture]);

    /* ── Text-mode fallback: clicking camera area during 'waiting' starts speaking ── */
    const handleCameraClick = () => {
        if (state === 'waiting' && !isCapturing) {
            notifySpeaking();
        }
    };

    const handleEndInterview = () => {
        wsEndInterview();
        stopCapture();
        clearAudioBuffer();
        streamRef.current?.getTracks().forEach(t => t.stop());
        setShowEndDialog(false);
    };

    const formatTime = secs => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div style={styles.layout}>

            {/* ── Background ambient blobs ── */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                <div style={{ ...styles.blob, top: '10%', left: '-10%', background: 'rgba(108,99,255,0.06)' }} />
                <div style={{ ...styles.blob, bottom: '10%', right: '-10%', background: 'rgba(78,205,196,0.05)' }} />
            </div>

            {/* ── Top bar: question text ── */}
            <div style={styles.topBar}>
                <div style={styles.questionBox}>
                    {state === 'connecting' ? (
                        <div style={styles.connectingRow}>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            <span style={styles.mutedSm}>Connecting to interview server...</span>
                        </div>
                    ) : state === 'ended' ? (
                        <div style={styles.connectingRow}>
                            <span style={{ color: 'var(--accent-success)' }}>✓</span>
                            <span style={styles.mutedSm}>Interview complete. Redirecting to dashboard...</span>
                        </div>
                    ) : (
                        <div style={styles.questionRow}>
                            <p style={styles.questionText}>{currentQuestion}</p>
                            <div style={styles.timerChip}>
                                {state === 'waiting' && (
                                    <span style={{ color: 'var(--accent-warning)', fontWeight: 600, fontSize: 12 }}>
                                        ⏳ {countdown}s
                                    </span>
                                )}
                                {state === 'listening' && (
                                    <span style={{ color: 'var(--accent-success)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        🎤 {formatTime(elapsed)}
                                    </span>
                                )}
                                {state === 'transitioning' && (
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Processing...</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Main video area ── */}
            <div style={styles.videoArea}>
                {/* User camera */}
                <div style={{ ...styles.videoCard, cursor: state === 'waiting' ? 'pointer' : 'default' }} onClick={handleCameraClick}>
                    {/* Hint overlay during waiting state */}
                    {state === 'waiting' && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, background: 'rgba(0,0,0,0.3)', borderRadius: 24 }}>
                            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500, padding: '8px 16px', background: 'rgba(0,0,0,0.5)', borderRadius: 100, backdropFilter: 'blur(8px)' }}>
                                Click to start speaking
                            </span>
                        </div>
                    )}
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', background: '#000' }}
                    />
                    {/* Name tag */}
                    <div style={styles.nameTag}>
                        <div style={{ ...styles.nameDot, background: 'var(--gradient-primary)' }} />
                        <span style={styles.nameText}>{user?.name || 'You'}</span>
                    </div>
                    {/* Not recorded badge */}
                    <div style={styles.notRecording}>NOT RECORDED</div>
                    {/* Pace indicator */}
                    {state === 'listening' && (
                        <div style={styles.paceIndicator}>
                            {pace === 'good' && <span style={{ color: 'var(--accent-success)' }}>✅ Good pace</span>}
                            {pace === 'too_fast' && <span style={{ color: 'var(--accent-warning)' }}>⚡ Too fast — slow down</span>}
                            {pace === 'too_slow' && <span style={{ color: 'var(--text-muted)' }}>🐢 Too slow — speak up</span>}
                        </div>
                    )}
                    {/* Listening indicator */}
                    {state === 'listening' && (
                        <div style={styles.listeningBadge}>
                            <span style={styles.liveDot} />
                            <span style={{ fontSize: 10, color: 'var(--accent-success)', fontWeight: 600 }}>LIVE</span>
                        </div>
                    )}
                </div>

                {/* AI Avatar */}
                <div style={styles.avatarCard}>
                    {/* Glow blob when speaking */}
                    <div style={{
                        ...styles.avatarGlow,
                        opacity: aiSpeaking ? 1 : 0,
                        transition: 'opacity 0.7s ease',
                    }} />
                    <div style={styles.avatarContent}>
                        {/* Avatar circle */}
                        <div style={{
                            ...styles.avatarRing,
                            border: aiSpeaking ? '2px solid rgba(108,99,255,0.4)' : '2px solid transparent',
                            transform: aiSpeaking ? 'scale(1.08)' : 'scale(1)',
                            transition: 'all 0.5s ease',
                        }}>
                            <div style={styles.avatarCircle}>
                                🤖
                            </div>
                        </div>
                        {/* Waveform when speaking */}
                        {aiSpeaking && (
                            <div style={styles.waveform}>
                                {[...Array(7)].map((_, i) => (
                                    <span
                                        key={i}
                                        className="waveform-bar"
                                        style={{ animationDelay: `${i * 0.08}s`, height: `${8 + Math.floor(Math.random() * 14)}px` }}
                                    />
                                ))}
                            </div>
                        )}
                        {aiSpeaking && (
                            <div style={styles.speakingBadge}>
                                💬 <span style={{ fontSize: 10, color: 'var(--accent-primary)', fontWeight: 600 }}>Speaking</span>
                            </div>
                        )}
                    </div>
                    {/* AI name tag */}
                    <div style={styles.nameTag}>
                        <div style={{ ...styles.nameDot, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' }} />
                        <span style={styles.nameText}>MockMate AI</span>
                    </div>
                </div>
            </div>

            {/* ── Floating control bar ── */}
            <div style={styles.controlBar}>
                <div style={styles.controlInner}>
                    {/* Mic indicator with animation */}
                    <div style={styles.micIndicator}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 }}>
                            {/* Pulsing rings — only when listening */}
                            {state === 'listening' && (
                                <>
                                    <span style={styles.micRing1} />
                                    <span style={styles.micRing2} />
                                </>
                            )}
                            {/* Mic SVG icon */}
                            <svg
                                width="22" height="22" viewBox="0 0 24 24" fill="none"
                                stroke={state === 'listening' ? 'var(--accent-success)' : 'rgba(255,255,255,0.3)'}
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ position: 'relative', zIndex: 1, transition: 'stroke 0.3s ease' }}
                            >
                                <rect x="9" y="2" width="6" height="11" rx="3" />
                                <path d="M5 10a7 7 0 0 0 14 0" />
                                <line x1="12" y1="19" x2="12" y2="22" />
                                <line x1="8" y1="22" x2="16" y2="22" />
                            </svg>
                        </div>
                    </div>
                    <div style={styles.controlDivider} />
                    {/* End call — proper SVG phone-down icon */}
                    <button
                        style={styles.endCallBtn}
                        onClick={() => setShowEndDialog(true)}
                        title="End Interview"
                    >
                        <Phone color="white" fill="white" size={24} style={{ transform: 'rotate(135deg)' }} />
                    </button>
                </div>
            </div>

            {/* ── End call confirm dialog ── */}
            <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <DialogContent hideCloseButton className="sm:max-w-[600px] w-[95vw] bg-card/95 backdrop-blur-xl border-white/10 p-6 sm:p-8 shadow-2xl rounded-2xl">
                    <DialogHeader className="space-y-4 mb-8">
                        <DialogTitle className="flex flex-col items-center gap-4 text-destructive font-poppins text-xl text-center">
                            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            End this interview?
                        </DialogTitle>
                        <DialogDescription className="text-center text-[15px] text-muted-foreground/90 leading-relaxed px-4">
                            This action is final. Your interview cannot be resumed, but partial results will be evaluated and saved to your dashboard.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center gap-3">
                        <Button variant="outline" className="flex-1 border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500 transition-colors" onClick={() => setShowEndDialog(false)}>
                            Continue Interview
                        </Button>
                        <Button variant="destructive" className="flex-1 bg-red-700 hover:bg-red-800 shadow-lg shadow-red-900/20" onClick={handleEndInterview}>
                            Yes, End Interview
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>


            {/* ── Network lost overlay ── */}
            {networkLost && (
                <div style={styles.networkOverlay}>
                    <div style={styles.networkBox}>
                        <p style={{ fontSize: 32, marginBottom: 12 }}>📡</p>
                        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Connection Lost</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
                            Attempting to reconnect...
                        </p>
                        <p style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 12 }}>
                            {formatTime(reconnectSeconds)}
                        </p>
                        <div className="progress-track" style={{ width: 280 }}>
                            <div className="progress-fill" style={{ width: `${(reconnectSeconds / 180) * 100}%` }} />
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 12 }}>Your progress is being saved.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    layout: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
        position: 'relative',
    },
    blob: {
        position: 'absolute',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        filter: 'blur(80px)',
    },
    topBar: {
        padding: '12px 20px',
        zIndex: 10,
    },
    questionBox: {
        background: 'rgba(22,22,31,0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '12px 18px',
        minHeight: 52,
        display: 'flex',
        alignItems: 'center',
    },
    connectingRow: {
        display: 'flex', alignItems: 'center', gap: 8,
    },
    mutedSm: { fontSize: 13, color: 'var(--text-muted)' },
    questionRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%',
    },
    questionText: {
        fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500, flex: 1, textAlign: 'center',
    },
    timerChip: { flexShrink: 0 },
    videoArea: {
        flex: 1,
        display: 'flex',
        gap: 12,
        padding: '0 20px 80px',
        minHeight: 0,
    },
    videoCard: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        background: '#000',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
    },
    avatarCard: {
        flex: 1,
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(22,22,31,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    avatarGlow: {
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 200, height: 200,
        background: 'rgba(108,99,255,0.12)',
        borderRadius: '50%',
        filter: 'blur(40px)',
    },
    avatarContent: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, position: 'relative',
    },
    avatarRing: {
        width: 96, height: 96, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 4,
    },
    avatarCircle: {
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'var(--gradient-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 40,
        boxShadow: '0 8px 24px rgba(108,99,255,0.3)',
    },
    waveform: { display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 },
    speakingBadge: {
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(108,99,255,0.12)',
        padding: '3px 10px', borderRadius: 100,
    },
    nameTag: {
        position: 'absolute', bottom: 10, left: 10,
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        padding: '4px 10px', borderRadius: 8,
    },
    nameDot: { width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    nameText: { fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' },
    notRecording: {
        position: 'absolute', bottom: 10, right: 10,
        fontSize: 9, letterSpacing: '0.06em', fontWeight: 600,
        color: 'var(--text-muted)',
        background: 'rgba(0,0,0,0.5)',
        padding: '2px 8px', borderRadius: 4,
    },
    paceIndicator: {
        position: 'absolute', top: 10, left: 10,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        padding: '3px 10px', borderRadius: 100,
        fontSize: 11, fontWeight: 500,
    },
    listeningBadge: {
        position: 'absolute', top: 10, right: 10,
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'rgba(46,213,115,0.12)',
        padding: '3px 10px', borderRadius: 100,
    },
    liveDot: {
        width: 6, height: 6, borderRadius: '50%',
        background: 'var(--accent-success)',
        animation: 'pulse-glow 1s ease infinite alternate',
    },
    controlBar: {
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
    },
    controlInner: {
        display: 'flex', alignItems: 'center', gap: 20,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 100,
        padding: '12px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
    micIndicator: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 },
    micRing1: {
        position: 'absolute',
        width: 38, height: 38, borderRadius: '50%',
        border: '1.5px solid rgba(46,213,115,0.5)',
        animation: 'mic-pulse 1.4s ease-out infinite',
    },
    micRing2: {
        position: 'absolute',
        width: 52, height: 52, borderRadius: '50%',
        border: '1.5px solid rgba(46,213,115,0.25)',
        animation: 'mic-pulse 1.4s ease-out 0.5s infinite',
    },
    controlDivider: { width: 1, height: 32, background: 'rgba(255,255,255,0.1)' },
    endCallBtn: {
        width: 52, height: 52, borderRadius: '50%',
        background: '#ef4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        border: 'none',
    },
    dialogOverlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
    },
    dialog: {
        background: 'var(--bg-modal)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: 28, maxWidth: 360, width: '100%',
        boxShadow: 'var(--shadow-modal)',
    },
    dialogTitle: { fontSize: 17, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' },
    dialogBody: { fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 },
    dialogFooter: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
    networkOverlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, textAlign: 'center',
    },
    networkBox: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: 40,
    },
};
