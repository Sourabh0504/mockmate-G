/**
 * ProfilePage.jsx — Exact port of Lovable's Profile.tsx
 * User info card, stats strip, editable skills + experience.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import Footer from '../components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { sessionApi, authApi } from '../services/api';
import {
    ArrowLeft, User, Mail, Calendar, BarChart3, Award,
    Zap, FileText, Briefcase, Pencil, Check, X, Plus, Trash2, Download, AlertTriangle
} from 'lucide-react';
import { useEffect } from 'react';

const statGradients = [
    'from-primary to-primary-glow',
    'from-secondary to-secondary-glow',
    'from-accent to-accent-glow',
    'from-primary to-accent',
];
const statIcons = [BarChart3, Award, Zap, FileText];

// Simple Badge component
function Badge({ children, variant = 'secondary', className = '', onClick }) {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors';
    const variants = {
        default: 'bg-primary/15 text-primary border border-primary/30',
        secondary: 'bg-muted text-muted-foreground',
    };
    return (
        <span className={`${base} ${variants[variant]} ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
            {children}
        </span>
    );
}

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [isEditingSkills, setIsEditingSkills] = useState(false);
    const [skills, setSkills] = useState({
        Languages: ['JavaScript', 'Python', 'TypeScript'],
        Frameworks: ['React', 'Node.js', 'FastAPI'],
        Tools: ['Git', 'Docker', 'AWS'],
    });
    const [newSkill, setNewSkill] = useState('');
    const [activeCategory, setActiveCategory] = useState('Languages');
    const [isEditingExp, setIsEditingExp] = useState(false);
    const [experience, setExperience] = useState([
        { title: 'Frontend Developer', company: 'Tech Corp', duration: '2022–Present' },
        { title: 'Junior Web Developer', company: 'Startup XYZ', duration: '2020–2022' },
    ]);

    useEffect(() => {
        sessionApi.list().then(r => setSessions(r.data || [])).catch(() => { });
    }, []);

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const bestScore = completedSessions.reduce((best, s) => Math.max(best, s.scores?.overall || 0), 0);
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'January 2024';

    const handleAddSkill = () => {
        if (!newSkill.trim()) return;
        setSkills(prev => ({ ...prev, [activeCategory]: [...(prev[activeCategory] || []), newSkill.trim()] }));
        setNewSkill('');
    };
    const handleRemoveSkill = (cat, skill) =>
        setSkills(prev => ({ ...prev, [cat]: prev[cat].filter(s => s !== skill) }));
    const handleExpChange = (i, field, value) =>
        setExperience(prev => prev.map((exp, idx) => idx === i ? { ...exp, [field]: value } : exp));
    const handleRemoveExp = i =>
        setExperience(prev => prev.filter((_, idx) => idx !== i));
    const handleAddExp = () =>
        setExperience(prev => [...prev, { title: '', company: '', duration: '' }]);

    return (
        <div className="min-h-screen bg-background font-poppins">
            <Navigation />
            <div className="relative pt-14 sm:pt-16 overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute top-20 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute top-60 -right-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
                    {/* Back link */}
                    <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors mb-6 no-underline">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>

                    {/* User Info Card */}
                    <Card className="mb-6 animate-fade-in">
                        <CardContent className="p-5 sm:p-6 lg:p-8">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                                {/* Avatar */}
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center shrink-0">
                                    <User className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                </div>

                                {/* Name / email */}
                                <div className="space-y-1 min-w-0 flex-1">
                                    {isEditingProfile ? (
                                        <div className="space-y-2">
                                            <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name" className="text-sm" />
                                            <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email" className="text-sm" />
                                        </div>
                                    ) : (
                                        <>
                                            <h1 className="text-lg sm:text-xl lg:text-2xl font-poppins font-bold truncate">
                                                {editName || user?.name}
                                            </h1>
                                            <p className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
                                                <Mail className="w-3.5 h-3.5" /> {editEmail || user?.email}
                                            </p>
                                        </>
                                    )}
                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5" /> Member since {memberSince}
                                    </p>
                                </div>

                                {/* Edit / Save buttons */}
                                <div className="flex gap-2 self-start">
                                    {isEditingProfile ? (
                                        <>
                                            <Button size="sm" variant="ghost" onClick={() => { setIsEditingProfile(false); setEditName(user?.name || ''); setEditEmail(user?.email || ''); }}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" onClick={() => setIsEditingProfile(false)}>
                                                <Check className="w-4 h-4 mr-1" /> Save
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => setIsEditingProfile(true)}>
                                            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        {[
                            { label: 'Total Sessions', value: sessions.length },
                            { label: 'Best Score', value: bestScore || '—' },
                            { label: 'Streak', value: '3 days' },
                            { label: 'Resumes', value: 1 },
                        ].map((stat, i) => {
                            const Icon = statIcons[i];
                            return (
                                <Card key={i} className="animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                                    <CardContent className="p-4 text-center">
                                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${statGradients[i]} flex items-center justify-center mx-auto mb-2`}>
                                            <Icon className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="text-lg sm:text-xl font-bold font-poppins">{stat.value}</div>
                                        <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Skills & Experience */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Skills Card */}
                        <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" /> Skills
                                </CardTitle>
                                {isEditingSkills ? (
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditingSkills(false)}>
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" onClick={() => setIsEditingSkills(false)}>
                                            <Check className="w-3.5 h-3.5 mr-1" /> Save
                                        </Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingSkills(true)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Category tabs when editing */}
                                {isEditingSkills && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {Object.keys(skills).map(cat => (
                                            <Badge
                                                key={cat}
                                                variant={activeCategory === cat ? 'default' : 'secondary'}
                                                onClick={() => setActiveCategory(cat)}
                                            >
                                                {cat}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {Object.entries(skills).map(([category, items]) => (
                                    <div key={category}>
                                        <p className="text-xs text-muted-foreground mb-1.5">{category}:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {items.map(skill => (
                                                <Badge key={skill} variant="secondary" className="group">
                                                    {skill}
                                                    {isEditingSkills && (
                                                        <button onClick={() => handleRemoveSkill(category, skill)} className="ml-1 opacity-60 hover:opacity-100 bg-transparent border-none cursor-pointer p-0">
                                                            <X className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {isEditingSkills && (
                                    <div className="flex gap-2 pt-1">
                                        <Input
                                            value={newSkill}
                                            onChange={e => setNewSkill(e.target.value)}
                                            placeholder={`Add to ${activeCategory}...`}
                                            className="text-xs h-8"
                                            onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                        />
                                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={handleAddSkill}>
                                            <Plus className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Experience Card */}
                        <Card className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-secondary" /> Experience
                                </CardTitle>
                                {isEditingExp ? (
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" onClick={() => setIsEditingExp(false)}>
                                            <X className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" onClick={() => setIsEditingExp(false)}>
                                            <Check className="w-3.5 h-3.5 mr-1" /> Save
                                        </Button>
                                    </div>
                                ) : (
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditingExp(true)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {experience.map((exp, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 shrink-0" />
                                        {isEditingExp ? (
                                            <div className="flex-1 space-y-1.5">
                                                <Input value={exp.title} onChange={e => handleExpChange(i, 'title', e.target.value)} placeholder="Title" className="text-xs h-8" />
                                                <div className="flex gap-2">
                                                    <Input value={exp.company} onChange={e => handleExpChange(i, 'company', e.target.value)} placeholder="Company" className="text-xs h-8" />
                                                    <Input value={exp.duration} onChange={e => handleExpChange(i, 'duration', e.target.value)} placeholder="Duration" className="text-xs h-8" />
                                                </div>
                                                <Button size="sm" variant="ghost" className="text-destructive h-6 text-[10px] px-1" onClick={() => handleRemoveExp(i)}>
                                                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                                                </Button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-medium text-xs sm:text-sm">{exp.title}</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground">{exp.company} · {exp.duration}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isEditingExp && (
                                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={handleAddExp}>
                                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Experience
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Account Management ── */}
                    <Card className="mt-6 animate-slide-up border-destructive/20" style={{ animationDelay: '0.5s' }}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-destructive" /> Account Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Export All Data */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                <div>
                                    <p className="font-medium text-sm">Export All Data</p>
                                    <p className="text-xs text-muted-foreground">Download all your sessions, reports, and resumes as JSON</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0"
                                    onClick={async () => {
                                        try {
                                            const res = await sessionApi.list();
                                            const data = { user: { name: user?.name, email: user?.email }, sessions: res.data, exported_at: new Date().toISOString() };
                                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `mockmate_export_${new Date().toISOString().split('T')[0]}.json`;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error('Export failed:', err);
                                            alert('Failed to export data.');
                                        }
                                    }}
                                >
                                    <Download className="w-3.5 h-3.5 mr-1" /> Export
                                </Button>
                            </div>

                            {/* Delete Account */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                                <div>
                                    <p className="font-medium text-sm text-destructive">Delete Account</p>
                                    <p className="text-xs text-muted-foreground">Permanently delete all data including sessions, reports, and resumes</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0 border-destructive/30 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete your account? This will permanently delete ALL your data including sessions, reports, and resumes. This action cannot be undone.')) {
                                            authApi.deleteAccount()
                                                .then(() => {
                                                    logout();
                                                    navigate('/');
                                                })
                                                .catch(err => {
                                                    console.error('Delete failed:', err);
                                                    alert('Failed to delete account.');
                                                });
                                        }
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </div>
    );
}
