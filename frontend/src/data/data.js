/**
 * data.js — Static UI Content File
 * Single source of truth for ALL visible static text in MockMate AI.
 *
 * HOW TO USE:
 *   import { home, login, navigation } from '../data/data.js';
 *
 * WHAT GOES HERE:
 *   ✅ Page headings, descriptions, button labels, feature text
 *   ✅ Form labels, placeholders, toast messages
 *   ✅ Marketing stats (e.g. "10K+"), FAQ, team names
 *
 * WHAT DOES NOT GO HERE:
 *   ❌ User data, session scores, reports (those come from the API)
 *   ❌ Anything rendered inside a useEffect / API call
 */

// ── NAVIGATION BAR ─────────────────────────────────────────────────────────────
// publicLinks = shown before login  |  authLinks = shown after login
export const navigation = {
    publicLinks: [
        { name: "Home", path: "/" },
        { name: "How It Works", path: "/how-it-works" },
        { name: "About", path: "/about" },
        { name: "Contact", path: "/contact" },
    ],
    authLinks: [
        { name: "Dashboard", path: "/dashboard" },
        { name: "How It Works", path: "/how-it-works" },
    ],
    tryNowButton: "Try Now",      // CTA button shown to guests (→ /register)
    loginButton: "Login",
    signOutButton: "Sign Out",
};

// ── FOOTER ─────────────────────────────────────────────────────────────────────
export const footer = {
    brandDescription: "Master your interviews with AI-powered voice coaching and real-time feedback.",
    quickLinksHeading: "Quick Links",
    quickLinks: [
        { name: "Home", path: "/" },
        { name: "How It Works", path: "/how-it-works" },
        { name: "Dashboard", path: "/dashboard" },
    ],
    companyHeading: "Company",
    companyLinks: [
        { name: "About", path: "/about" },
        { name: "Contact", path: "/contact" },
    ],
    copyright: `© ${new Date().getFullYear()} MockMate AI. All rights reserved. Built with ❤️ for better interviews.`,
};

// ── HOME PAGE (/') ──────────────────────────────────────────────────────────────
export const home = {
    // Hero section — main banner at the top of the landing page
    hero: {
        badge: "AI-Powered Interview Revolution",  // pill badge above title
        titleBrand1: "Mock",                        // colored (neon-blue) part of title
        titleBrand2: "Mate",                        // white part
        subtitle: "The Next-Gen AI Interviewer",
        description: "Transform your career with",
        descriptionHighlight: "intelligent voice coaching",  // neon-green
        descriptionEnd: "and real-time feedback powered by cutting-edge AI technology",
        ctaPrimary: "Start Your Journey",    // → /register
        ctaSecondary: "Watch Magic Happen",  // → /how-it-works
        trustBadges: [
            "No Credit Card Required",
            "Trusted by 10K+ Users",
        ],
    },

    // Stats bar — 4 number cards shown below the hero
    // NOTE: These are marketing numbers, NOT pulled from the database
    stats: [
        { number: "10K+", label: "Interviews Conducted" },
        { number: "95%", label: "User Satisfaction" },
        { number: "50+", label: "Interview Types" },
        { number: "24/7", label: "Available Practice" },
    ],

    // Company logos section — 3 auto-scrolling marquee rows
    companies: {
        badge: "Trusted by Top Companies",
        heading1: "Get Ready for",      // gradient text
        heading2: "Top MNC Interviews", // white text
        description: "Practice with AI that understands the interview patterns of",
        descriptionHighlight: "Fortune 500 companies",  // neon-blue
        // Each row: array of company names matching filenames in /assets/logos/
        logoRow1: ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Netflix", "Barclays", "Dentsu"],
        logoRow2: ["LinkedIn", "Salesforce", "Oracle", "IBM", "Cisco", "Amdocs", "Deloitte", "Mastercard"],
        logoRow3: ["Citi", "TCS", "Infosys", "Tesla", "Spotify", "Apple", "Meta", "Netflix"],
    },

    // Features grid — 6 cards (icons assigned in the component)
    features: {
        badge: "Revolutionary Features",
        heading: "Why Choose",
        headingHighlight: "AI Interviewer",  // gradient text
        description: "Experience the future of interview preparation with",
        descriptionHighlight: "cutting-edge AI technology",  // neon-green
        items: [
            { title: "Voice Recognition", description: "Advanced speech processing with real-time analysis and natural conversation flow." },
            { title: "AI-Powered Questions", description: "Intelligent question generation based on your resume and target role." },
            { title: "Performance Analytics", description: "Detailed insights on fluency, confidence, and content quality." },
            { title: "Secure & Private", description: "Your data is encrypted and secure. Practice with confidence." },
            { title: "Instant Feedback", description: "Get immediate analysis and suggestions to improve your performance." },
            { title: "Personalized", description: "Tailored questions based on your industry and experience level." },
        ],
    },

    // CTA section — bottom call-to-action glass card
    cta: {
        heading: "Ready to",
        headingHighlight: "Ace Your Next Interview",  // gradient text
        descriptionHighlight: "AI-powered interview coaching",  // neon-green
        checkpoints: [
            "No credit card required",
            "Start practicing immediately",
            "Real-time AI feedback",
        ],
        ctaPrimary: "Start Practicing",  // → /register
        ctaSecondary: "How It Works",    // → /how-it-works
    },
};

// ── HOW IT WORKS PAGE (/how-it-works) ──────────────────────────────────────────
export const howItWorks = {
    badge: "Simple 4-Step Process",
    heading: "How It",
    headingHighlight: "Works",
    description: "From resume upload to detailed feedback — transform your interview skills in minutes.",

    // 4 timeline steps
    steps: [
        {
            num: "01",
            title: "Upload Your Resume",
            description: "Upload your resume and select your target role. Our AI analyzes your background to create personalized questions.",
            details: ["PDF, DOC, TXT supported", "Automatic skill extraction", "Role-specific questions"],
        },
        {
            num: "02",
            title: "Start Voice Interview",
            description: "Begin your mock interview with real-time voice interaction and natural conversation flow.",
            details: ["Advanced speech recognition", "Natural language processing", "Real-time conversation"],
        },
        {
            num: "03",
            title: "AI Analysis",
            description: "Our system analyzes your responses for content quality, fluency, confidence, and tone.",
            details: ["Content quality assessment", "Fluency & pacing analysis", "Confidence detection"],
        },
        {
            num: "04",
            title: "Get Feedback",
            description: "Receive detailed performance insights with actionable recommendations to improve.",
            details: ["Score breakdown", "Improvement suggestions", "Practice recommendations"],
        },
    ],

    benefits: [
        { title: "Instant Results", description: "Get immediate feedback after each session" },
        { title: "Industry-Specific", description: "Questions tailored to your role and industry" },
        { title: "Proven Method", description: "Based on successful interview patterns" },
    ],

    cta: {
        heading: "Ready to Start?",
        description: "Begin your first practice session and experience AI-powered interview feedback.",
        ctaPrimary: "Start Practicing",   // → /register
        ctaSecondary: "Learn More",       // → /about
    },
};

// ── ABOUT PAGE (/about) ────────────────────────────────────────────────────────
export const about = {
    hero: {
        heading: "About",
        headingHighlight: "MockMate AI",
        description: "A cutting-edge student project that combines artificial intelligence with voice processing to revolutionize interview preparation.",
    },

    mission: {
        heading: "Our",
        headingHighlight: "Mission",
        paragraphs: [
            "This project represents the culmination of our computer science studies, combining theoretical knowledge with practical application.",
            "MockMate AI leverages advanced speech processing and generative AI to create an intelligent mock interview system with personalized feedback.",
            "Our team integrates NLP, machine learning, and modern web frameworks to deliver a comprehensive interview preparation platform.",
        ],
    },

    vision: {
        heading: "Our Vision",
        description: "To demonstrate the potential of AI in education and career development, creating practical solutions that help people improve their interview skills.",
    },

    // Project impact numbers (static, not from DB)
    stats: {
        heading: "Project",
        headingHighlight: "Impact",
        items: [
            { number: "100+", label: "Hours Developed" },
            { number: "50+", label: "Features Built" },
            { number: "3", label: "Team Members" },
            { number: "1", label: "Innovative Project" },
        ],
    },

    values: {
        heading: "Our",
        headingHighlight: "Development Values",
        items: [
            { title: "Mission-Driven", description: "Democratizing interview preparation and helping everyone succeed." },
            { title: "Innovation First", description: "Leveraging cutting-edge AI to create personalized learning." },
            { title: "User-Centric", description: "Building products that truly serve our users' needs." },
            { title: "Excellence", description: "Maintaining the highest standards in everything we do." },
        ],
    },

    // Team member info — update names/roles/bios here
    team: {
        heading: "Meet Our",
        headingHighlight: "Development Team",
        description: "The student developers behind this innovative AI project",
        badgeLabel: "Student Developer",
        members: [
            {
                name: "Darshana Bedse",
                role: "UI/UX Designer & Frontend Developer",
                bio: "Specializes in user interface design and modern web development. Passionate about creating intuitive user experiences.",
            },
            {
                name: "Chetan Bava",
                role: "AI Engineer & Backend Developer",
                bio: "Expert in machine learning algorithms and backend architecture. Focuses on speech processing and AI model integration.",
            },
            {
                name: "Sourabh Chaudhari",
                role: "Project Lead & Full Stack Developer",
                bio: "Leads project development and system architecture. Experienced in both frontend and backend technologies.",
            },
        ],
    },

    technology: {
        heading: "Powered by",
        headingHighlight: "Advanced AI",
        items: [
            { title: "Speech Processing", description: "Advanced speech recognition and NLP to analyze responses in real-time." },
            { title: "Machine Learning", description: "Intelligent algorithms that adapt to your learning style with personalized feedback." },
            { title: "Modern Web Tech", description: "Built with React, JavaScript, and modern web technologies for a seamless experience." },
        ],
    },

    cta: {
        heading: "Ready to Transform Your Interview Skills?",
        description: "Join thousands of successful candidates who've improved with MockMate AI.",
        ctaPrimary: "Start Practicing",  // → /register
        ctaSecondary: "Contact Us",      // → /contact
    },
};

// ── CONTACT PAGE (/contact) ────────────────────────────────────────────────────
export const contact = {
    heading: "Get in",
    headingHighlight: "Touch",
    description: "Have questions, feedback, or need support? We're here to help you succeed.",

    form: {
        heading: "Send us a Message",
        description: "Fill out the form and we'll get back to you.",
        nameLabel: "Name *",
        namePlaceholder: "Your full name",
        emailLabel: "Email *",
        emailPlaceholder: "your.email@example.com",
        subjectLabel: "Subject",
        subjectPlaceholder: "Choose a topic...",
        subjectOptions: [
            { value: "general", label: "General Inquiry" },
            { value: "technical", label: "Technical Support" },
            { value: "feedback", label: "Product Feedback" },
            { value: "partnership", label: "Partnership" },
            { value: "bug", label: "Bug Report" },
        ],
        messageLabel: "Message *",
        messagePlaceholder: "Tell us how we can help...",
        ratingLabel: "Rate Your Experience (Optional)",
        ratingOptions: [
            { value: "5", label: "⭐⭐⭐⭐⭐ Excellent" },
            { value: "4", label: "⭐⭐⭐⭐ Good" },
            { value: "3", label: "⭐⭐⭐ Average" },
            { value: "2", label: "⭐⭐ Poor" },
            { value: "1", label: "⭐ Very Poor" },
        ],
        submitButton: "Send Message",
    },

    contactInfo: {
        heading: "Contact Information",
        description: "Multiple ways to reach us",
        items: [
            { title: "Email", info: "hello@mockmate.ai", description: "Send us an email anytime" },
            { title: "Live Chat", info: "Available 24/7", description: "Chat with our support team" },
            { title: "Response Time", info: "Within 24 hours", description: "We respond quickly" },
        ],
    },

    // FAQ accordion — 3 items shown on contact page
    faq: {
        heading: "Quick FAQ",
        items: [
            { question: "How does the AI analysis work?", answer: "Our AI analyzes speech patterns, content quality, fluency, and confidence using NLP and ML algorithms." },
            { question: "Is my data secure?", answer: "We use enterprise-grade encryption and never share your data. Sessions can be deleted at any time." },
            { question: "Can I practice for specific companies?", answer: "Yes! Our AI generates questions tailored to specific companies based on interview patterns." },
        ],
    },

    // Testimonials shown on contact page (static, not from DB)
    testimonials: {
        heading: "What Our Users Say",
        description: "Real feedback from real users",
        items: [
            { name: "Sarah Chen", role: "Software Engineer", rating: 5, comment: "MockMate AI helped me land my dream job at Google. The feedback was incredibly detailed." },
            { name: "Michael Rodriguez", role: "Product Manager", rating: 5, comment: "The AI questions were so realistic. I felt completely prepared for my actual interviews." },
            { name: "Emily Watson", role: "Data Scientist", rating: 5, comment: "Best interview prep tool I've ever used. The speech analysis is remarkably accurate." },
        ],
    },

    toasts: {
        missingInfo: { title: "Missing Information", description: "Please fill in all required fields." },
        messageSent: { title: "Message Sent!", description: "We'll get back to you within 24 hours." },
    },
};

// ── LOGIN PAGE (/login) ────────────────────────────────────────────────────────
export const login = {
    // Left panel branding
    branding: {
        heading: "Master Your",
        headingHighlight: "Interview Skills",  // neon-green
        description: "Join thousands of successful candidates who improved with AI-powered coaching.",
        featuresHeading: "What you'll get:",
        features: [
            "Unlimited practice sessions",
            "AI-powered feedback",
            "Performance analytics",
            "Resume-based questions",
            "Multiple interview domains",
        ],
    },
    // Right panel form
    form: {
        heading: "Welcome Back",
        description: "Sign in to continue practicing",
        githubButton: "GitHub",      // disabled — see toasts
        googleButton: "Google",      // disabled — see toasts
        separator: "Or continue with email",
        emailLabel: "Email",
        emailPlaceholder: "Enter your email",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter your password",
        submitButton: "Sign In",
        noAccount: "Don't have an account?",
        signUpLink: "Sign up",       // → /register
    },
    toasts: {
        missingInfo: { title: "Missing Information", description: "Please fill in all required fields." },
        welcome: { title: "Welcome back!", description: "You've been successfully logged in." },
        invalidCredentials: { title: "Login failed", description: "Invalid email or password." },
        githubComingSoon: { title: "Coming Soon", description: "GitHub login will be available soon." },
        googleComingSoon: { title: "Coming Soon", description: "Google login will be available soon." },
    },
};

// ── REGISTER PAGE (/register) ──────────────────────────────────────────────────
export const register = {
    branding: {
        heading: "Start Your",
        headingHighlight: "Journey Today",  // neon-green
        description: "Create an account and begin mastering your interview skills with AI-powered coaching.",
        features: [
            "Unlimited practice sessions",
            "AI-powered feedback",
            "Performance analytics",
            "Resume-based questions",
        ],
    },
    form: {
        heading: "Create Account",
        description: "Start your interview preparation journey",
        githubButton: "GitHub",
        googleButton: "Google",
        separator: "Or continue with email",
        nameLabel: "Full Name",
        namePlaceholder: "Enter your full name",
        emailLabel: "Email",
        emailPlaceholder: "Enter your email",
        passwordLabel: "Password",
        passwordPlaceholder: "Create a password",
        submitButton: "Create Account",
        hasAccount: "Already have an account?",
        signInLink: "Sign in",   // → /login
    },
    toasts: {
        missingInfo: { title: "Missing Information", description: "Please fill in all required fields." },
        created: { title: "Account created!", description: "Your account has been created successfully." },
        emailTaken: { title: "Email already in use", description: "An account with this email already exists." },
        githubComingSoon: { title: "Coming Soon", description: "GitHub signup will be available soon." },
        googleComingSoon: { title: "Coming Soon", description: "Google signup will be available soon." },
    },
};

// ── DASHBOARD PAGE (/dashboard) ────────────────────────────────────────────────
// NOTE: All numbers (scores, session counts, etc.) come from the API.
// Only static labels go here.
export const dashboard = {
    newPracticeButton: "New Practice",
    quickStats: {
        completedLabel: "Completed",
        avgScoreLabel: "Avg Score",
        totalTimeLabel: "Total Time",
    },
    scoreCards: {
        overallTitle: "Overall Score",
        fluencyTitle: "Fluency",
        contentTitle: "Content Quality",
        confidenceTitle: "Confidence",
    },
    sessions: {
        heading: "Interview Sessions",
        totalSuffix: "total",
        emptyState: {
            heading: "No sessions yet",
            description: "Start your first mock interview to get AI-powered feedback and improve your skills.",
            button: "Create First Session",
        },
    },
    sidebar: {
        skillBreakdown: "Skill Breakdown",
        skillLabels: {
            technical_knowledge: "Technical",
            communication: "Communication",
            problem_solving: "Problem Solving",
            leadership: "Leadership",
            cultural_fit: "Cultural Fit",
        },
        achievements: {
            heading: "Achievements",
            items: [
                { title: "First Interview", desc: "Complete your first session" },
                { title: "High Scorer", desc: "Score above 80" },
                { title: "Consistent", desc: "Complete 5 sessions" },
            ],
        },
        recommendations: {
            heading: "AI Recommendations",
            // Shown only when no report data is available
            empty: "Complete an interview to get personalized recommendations.",
        },
    },
};

// ── RULES MODAL ────────────────────────────────────────────────────────────────
export const rulesModal = {
    title: "Interview Rules & Guidelines",
    description: "Please read carefully before proceeding",
    rulesHeading: "Rules:",
    // {duration} is replaced at runtime with the session's duration_selected value
    rules: [
        "The interview duration is {duration} minutes.",
        "You have 10 seconds to start responding after each question.",
        "Pausing for more than 7 seconds during a response will be treated as answer completion.",
        "Maximum response time per question: 120 seconds.",
        'Say "Could you repeat that?" to hear the question again (max 1 repeat per question).',
        'Say "I\'d like to end the interview" to finish early.',
    ],
    networkWarning: "If disconnected, you have <strong>180 seconds</strong> to reconnect. After that, the session will be marked as interrupted.",
    agreeCheckbox: "I have read and agree to the interview rules",
    micCheck: {
        idle: "Check Microphone",
        success: "✓ Microphone Ready",
        error: "Microphone Failed — Try Again",
        errorMessage: "Microphone access denied. Please allow microphone access to proceed.",
    },
    cancelButton: "Cancel",
    startButton: "Start Interview",
};

// ── CREATE SESSION MODAL ────────────────────────────────────────────────────────
export const createSessionModal = {
    title: "Create New Session",
    description: "Set up your mock interview session",
    roleLabel: "Role Title *",
    rolePlaceholder: "e.g. Senior Frontend Developer",
    companyLabel: "Company Name",
    companyPlaceholder: "e.g. Google, Amazon, Meta",
    jdLabel: "Job Description *",
    jdPlaceholder: "Paste the full job description here (min 50 characters)",
    resumeLabel: "Resume",
    uploadButton: "Upload",
    difficultyLabel: "Difficulty",
    difficulties: ["Easy", "Moderate", "Hard"],
    durationLabel: "Duration:",
    durationSuffix: "minutes",
    cancelButton: "Cancel",
    createButton: "Create Session",
};

// ── INTERVIEW PAGE (/interview/:id) ────────────────────────────────────────────
export const interview = {
    connecting: "Connecting to interview...",
    ended: "Interview complete — redirecting...",
    processing: "Processing...",
    live: "Live",
    paceGood: "Good pace",
    paceTooFast: "Slow down",
    paceTooSlow: "Speed up",
    speaking: "Speaking...",
    aiLabel: "MockMate AI",
    endDialog: {
        title: "End this interview?",
        description: "This action is final. Your interview cannot be resumed.",
        cancelButton: "Cancel",
        confirmButton: "Yes, End Interview",
    },
};

// ── 404 NOT FOUND PAGE ────────────────────────────────────────────────────────
export const notFound = {
    heading: "AI System",
    headingHighlight: "Error",               // gradient text
    description: "Oops! Our AI couldn't find the page you're looking for.",
    errorCode: "ERROR_CODE: PAGE_NOT_FOUND",
    returnHome: "Return to Home",
    goBack: "Go Back",
    lookingFor: "Maybe you were looking for:",
    helpfulLinks: [
        { name: "Dashboard", path: "/dashboard" },
        { name: "How It Works", path: "/how-it-works" },
        { name: "About Us", path: "/about" },
        { name: "Contact", path: "/contact" },
    ],
};
