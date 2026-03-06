export const DUMMY_RESUME = {
    id: "res_001",
    filename: "John_Doe_Resume.pdf",
    uploaded_at: "2024-11-15T10:30:00Z",
    personal_info: {
        name: "John Doe",
        email: "john.doe@example.com",
        phone: "+1 (555) 123-4567",
        location: "San Francisco, CA",
    },
    education: [
        {
            degree: "M.S. Computer Science",
            institution: "Stanford University",
            year: "2022",
            gpa: "3.9",
        },
        {
            degree: "B.Tech Information Technology",
            institution: "MIT",
            year: "2020",
            gpa: "3.8",
        },
    ],
    experience: [
        {
            company: "Google",
            title: "Software Engineer II",
            duration: "2022 - Present",
            bullets: [
                "Led frontend architecture migration to React 18 with concurrent features",
                "Reduced page load time by 40% through code splitting and lazy loading",
                "Mentored 3 junior developers on TypeScript best practices",
            ],
        },
        {
            company: "Meta",
            title: "Software Engineering Intern",
            duration: "Summer 2021",
            bullets: [
                "Built real-time notification system handling 10K+ events/second",
                "Implemented A/B testing framework for news feed ranking",
            ],
        },
    ],
    projects: [
        {
            name: "AI Code Reviewer",
            description: "Automated code review tool using GPT-4 for pull request analysis",
            tech_stack: ["Python", "OpenAI API", "GitHub Actions", "FastAPI"],
        },
        {
            name: "Real-time Collaboration Editor",
            description: "Google Docs-like editor with CRDT-based conflict resolution",
            tech_stack: ["React", "TypeScript", "WebSocket", "Yjs"],
        },
        {
            name: "Cloud Cost Optimizer",
            description: "Dashboard for AWS cost analysis and optimization recommendations",
            tech_stack: ["Next.js", "D3.js", "AWS SDK", "PostgreSQL"],
        },
    ],
    certifications: [
        { name: "AWS Solutions Architect Associate", issuer: "Amazon", date: "2023" },
        { name: "Google Cloud Professional Developer", issuer: "Google", date: "2023" },
    ],
    skills: {
        Languages: ["JavaScript", "TypeScript", "Python", "Go", "Java"],
        Frameworks: ["React", "Next.js", "Node.js", "FastAPI", "Express"],
        Tools: ["Docker", "Kubernetes", "AWS", "GCP", "Terraform"],
        Databases: ["PostgreSQL", "MongoDB", "Redis", "DynamoDB"],
    },
};

export const DUMMY_SESSIONS = [
    {
        id: "sess_001",
        role: "Senior Frontend Developer",
        status: "completed",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        duration: 15,
        difficulty: "Hard",
        jd_quality: "high",
        scores: {
            overall: 85,
            fluency: 82,
            content_quality: 88,
            confidence: 79,
        },
        report: {
            summary:
                "You demonstrated strong technical knowledge and excellent communication skills. Your answers on React architecture and state management were particularly impressive. Areas for improvement include providing more structured responses to behavioral questions and showcasing leadership experience more effectively.",
            behavioral_suggestions: [
                "Use the STAR method (Situation, Task, Action, Result) for all behavioral questions",
                "Prepare 3-4 concrete examples of conflict resolution in team settings",
                "Practice articulating your decision-making process more clearly",
            ],
            technical_suggestions: [
                "Deep dive into system design patterns for large-scale applications",
                "Review advanced TypeScript patterns like conditional types and mapped types",
                "Practice explaining complex concepts in simple terms for non-technical stakeholders",
            ],
            questions: [
                {
                    number: 1,
                    section: "Technical",
                    questionText: "Explain the virtual DOM in React and how reconciliation works.",
                    userAnswer:
                        "The virtual DOM is an in-memory representation of the real DOM. When state changes, React creates a new virtual DOM tree and diffs it with the previous one using a reconciliation algorithm. It uses keys to track elements and batches DOM updates for performance. The fiber architecture allows React to pause and resume work...",
                    score: 9,
                    comment: "Excellent explanation covering key concepts including fiber architecture.",
                    suggestion: "Could mention the heuristic assumptions React makes during diffing.",
                    expectedAnswer:
                        "The Virtual DOM is a lightweight JavaScript representation of the actual DOM. React maintains two virtual DOM trees — one representing the current UI and one representing the next state. During reconciliation, React compares these trees using a diffing algorithm with O(n) complexity based on two heuristics: elements of different types produce different trees, and keys help identify stable elements.",
                },
                {
                    number: 2,
                    section: "Behavioral",
                    questionText: "Tell me about a time you had to deal with a difficult team member.",
                    userAnswer:
                        "I worked with a colleague who often dismissed others' code review feedback. I scheduled a 1-on-1 to understand their perspective and found they felt time pressure from management. We agreed on a review process with clear guidelines and time expectations. The relationship improved significantly.",
                    score: 7,
                    comment: "Good real example but could use more structure. The resolution was somewhat vague.",
                    suggestion: "Apply the STAR method — clearly separate Situation, Task, Action, and Result with measurable outcomes.",
                    expectedAnswer:
                        "A strong answer would follow STAR: Clearly state the situation (team dynamics, project context), the specific task (your responsibility), detailed actions taken (multiple steps, not just one conversation), and quantifiable results.",
                },
                {
                    number: 3,
                    section: "Technical",
                    questionText: "How would you design a real-time collaborative text editor?",
                    userAnswer:
                        "I'd use CRDTs like Yjs for conflict-free collaboration. The architecture would include a WebSocket server for real-time syncing, an operational transform layer as fallback, and a persistence layer with PostgreSQL. I'd implement cursor awareness and presence indicators for UX.",
                    score: 8,
                    comment: "Strong answer with practical experience showing through. Good mention of CRDTs.",
                    suggestion: "Discuss trade-offs between OT and CRDT approaches and scaling considerations.",
                    expectedAnswer:
                        "Key components: Conflict resolution strategy (OT vs CRDT with trade-offs), real-time communication (WebSocket with reconnection), data persistence (event sourcing or snapshots), presence/awareness, offline support, and scaling strategy.",
                },
            ],
            skill_scores: {
                technical_knowledge: 88,
                communication: 82,
                problem_solving: 85,
                leadership: 68,
                cultural_fit: 80,
            },
        },
    },
    {
        id: "sess_002",
        report: {
            summary: "Solid performance overall with strong fundamentals. Backend knowledge is good but could be deeper on distributed systems. Communication was clear but responses were sometimes too brief.",
            behavioral_suggestions: [
                "Provide more detailed examples with specific metrics and outcomes",
                "Practice longer-form storytelling for behavioral questions",
            ],
            technical_suggestions: [
                "Study distributed systems concepts — CAP theorem, consensus algorithms",
                "Practice database design and optimization questions",
            ],
            questions: [
                {
                    number: 1,
                    section: "Technical",
                    questionText: "Explain database indexing and when you would use composite indexes.",
                    userAnswer: "Indexes speed up queries by creating a data structure for quick lookups. Composite indexes are useful when queries filter on multiple columns.",
                    score: 6,
                    comment: "Correct but too brief. Missing key details about B-tree structure and index ordering.",
                    suggestion: "Discuss B-tree vs hash indexes, covering index, and the importance of column order in composite indexes.",
                    expectedAnswer: "Indexes are data structures (typically B-trees) that speed up data retrieval. Composite indexes cover multiple columns and are useful when queries filter/sort on those columns together.",
                },
            ],
            skill_scores: {
                technical_knowledge: 75,
                communication: 78,
                problem_solving: 70,
                leadership: 65,
                cultural_fit: 76,
            },
        },
    }
];
