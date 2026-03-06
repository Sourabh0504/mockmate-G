/**
 * InterviewPage.jsx — Full-screen AI interview with webcam, AI avatar, and question flow.
 * Adapted from Lovable's Interview.tsx. WebSocket integration is stubbed — real WS
 * is handled by useInterviewWS.js (future task). UI is fully functional for demos.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sessionApi } from '../services/api';
import Footer from '../components/layout/Footer';

const DUMMY_QUESTIONS = [
    'Please introduce yourself and walk me through your background.',
    'How would you approach designing a scalable API architecture?',
    'Describe a challenging technical problem you solved recently.',
    'How do you handle disagreements with team members on technical decisions?',
    "What's your approach to testing and code quality in a React application?",
];

/** Interview state machine */
// 'connecting' → 'greeting' → 'waiting' → 'listening' → 'transitioning' → 'ended'

export default function InterviewPage() {
    const { session_id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [state, setState] = useState('connecting');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [countdown, setCountdown] = useState(10);
    const [elapsed, setElapsed] = useState(0);
    const [aiSpeaking, setAiSpeaking] = useState(false);
    const [pace, setPace] = useState('good'); // good | too_fast | too_slow
    const [showEndDialog, setShowEndDialog] = useState(false);
    const [networkLost, setNetworkLost] = useState(false);
    const [reconnectSeconds, setReconnectSeconds] = useState(180);

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const timersRef = useRef([]);

    /* ── Timer helpers ── */
    const addTimer = useCallback((fn, delay) => {
        const id = window.setTimeout(fn, delay);
        timersRef.current.push(id);
        return id;
    }, []);

    const clearTimers = useCallback(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }, []);

    /* ── Camera/mic setup ── */
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then(stream => {
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(() => { });
        return () => {
            streamRef.current?.getTracks().forEach(t => t.stop());
            clearTimers();
        };
    }, [clearTimers]);

    /* ── Interview state machine ── */
    useEffect(() => {
        if (state === 'connecting') {
            addTimer(() => {
                setState('greeting');
                setCurrentQuestion(DUMMY_QUESTIONS[0]);
                setAiSpeaking(true);
            }, 2000);
        }
        if (state === 'greeting') {
            addTimer(() => {
                setAiSpeaking(false);
                setState('waiting');
                setCountdown(10);
            }, 3000);
        }
        if (state === 'waiting') {
            const interval = window.setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) { clearInterval(interval); setState('listening'); setElapsed(0); return 0; }
                    return prev - 1;
                });
            }, 1000);
            timersRef.current.push(interval);
        }
        if (state === 'listening') {
            addTimer(() => setPace('too_fast'), 5000);
            addTimer(() => setPace('good'), 10000);
            addTimer(() => setPace('too_slow'), 18000);
            addTimer(() => setState('transitioning'), 22000);
            const interval = window.setInterval(() => setElapsed(e => e + 1), 1000);
            timersRef.current.push(interval);
        }
        if (state === 'transitioning') {
            setAiSpeaking(true);
            addTimer(() => {
                setAiSpeaking(false);
                const nextIdx = questionIndex + 1;
                if (nextIdx >= DUMMY_QUESTIONS.length) {
                    setState('ended');
                } else {
                    setQuestionIndex(nextIdx);
                    setCurrentQuestion(DUMMY_QUESTIONS[nextIdx]);
                    setAiSpeaking(true);
                    setState('greeting');
                }
            }, 2000);
        }
        if (state === 'ended') {
            streamRef.current?.getTracks().forEach(t => t.stop());
            addTimer(() => navigate('/dashboard'), 2000);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, questionIndex]);

    const handleEndInterview = () => {
        clearTimers();
        streamRef.current?.getTracks().forEach(t => t.stop());
        setState('ended');
        setShowEndDialog(false);
        // In production: WS sends { type: 'end_interview' }
        navigate('/dashboard');
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
                <div style={styles.videoCard}>
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
                    {/* Mic indicator */}
                    <div style={styles.micIndicator}>
                        {state === 'listening'
                            ? <span style={{ fontSize: 20 }}>🎤</span>
                            : <span style={{ fontSize: 20, opacity: 0.4 }}>🔇</span>
                        }
                    </div>
                    <div style={styles.controlDivider} />
                    {/* End call */}
                    <button
                        style={styles.endCallBtn}
                        onClick={() => setShowEndDialog(true)}
                        title="End Interview"
                    >
                        📵
                    </button>
                </div>
            </div>

            {/* ── End call confirm dialog ── */}
            {showEndDialog && (
                <div style={styles.dialogOverlay}>
                    <div style={styles.dialog}>
                        <h3 style={styles.dialogTitle}>End this interview?</h3>
                        <p style={styles.dialogBody}>
                            This action is final. Your interview cannot be resumed, but partial results will be evaluated.
                        </p>
                        <div style={styles.dialogFooter}>
                            <button className="btn btn-ghost" onClick={() => setShowEndDialog(false)} style={{ fontSize: 13 }}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={handleEndInterview} style={{ fontSize: 13 }}>
                                Yes, End Interview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />

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
        borderRadius: 'var(--radius-lg)',
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
        fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500, flex: 1,
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
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: '#000',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
    },
    avatarCard: {
        flex: 1,
        borderRadius: 'var(--radius-lg)',
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
        background: 'rgba(22,22,31,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 'var(--radius-xl)',
        padding: '12px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    },
    micIndicator: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44 },
    controlDivider: { width: 1, height: 32, background: 'rgba(255,255,255,0.1)' },
    endCallBtn: {
        width: 52, height: 52, borderRadius: '50%',
        background: 'var(--accent-danger)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        boxShadow: '0 4px 16px rgba(255,71,87,0.4)',
        transition: 'var(--transition)',
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
