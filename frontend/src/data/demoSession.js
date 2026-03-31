/**
 * demoSession.js — Static data payload for Demo Mode.
 * Contains both the simulated interview flow and the final report.
 */

// ── Final Report Data (Used in Dashboard & ReportModal) ──
export const demoSessionReport = {
    id: "demo-session",
    created_at: new Date().toISOString(),
    status: "completed",
    role: "Senior Frontend Developer",
    company: "TechNova Solutions",
    jd_type: "technical",
    duration_selected: 15,
    duration_actual: 14.2,
    jd_text: "We are looking for a Senior Frontend Developer with expertise in React, Next.js, and modern CSS frameworks. You should have experience with web performance optimization, accessibility, and state management libraries like Redux or Zustand. The ideal candidate will also have excellent communication skills.",
    user_id: "demo-user",
    
    scores: {
        overall: 86,
        fluency: 90,
        content_quality: 84,
        confidence: 85,
        skills: {
            "Technological Knowledge": 88,
            "Problem Solving": 85,
            "Communication": 92,
            "System Design": 80
        }
    },

    transcript: [
        {
            question_text: "Tell me about a complex frontend architecture you designed and how you handled state management.",
            raw_answer: "In my previous role, I led the redesign of our core e-commerce platform. We had a lot of shared state between the cart, user profile, and product pages. Initially, it was a mess of prop drilling. I introduced Zustand because it's lightweight and doesn't have the boilerplate of Redux. I split our stores into distinct domains like cartStore and userStore.",
            corrected_answer: "In my previous role, I led the redesign of our core e-commerce platform. We had a lot of shared state between the cart, user profile, and product pages. Initially, it was a mess of prop drilling. I introduced Zustand because it's lightweight and doesn't have the boilerplate of Redux. I split our stores into distinct domains like cartStore and userStore.",
            ai_score: 88,
            expected_answer: "The candidate should discuss a specific project, identify the challenges with state management, and explain their chosen solution (e.g., Redux, Context API, Zustand) with a solid rationale.",
            feedback: "Great answer! You clearly outlined the problem (prop drilling) and justified your choice of Zustand over Redux. Splitting stores by domain is a solid architectural decision."
        },
        {
            question_text: "How do you approach optimizing a React application for better performance?",
            raw_answer: "Well, I usually start by looking at bundle sizes using tools like webpack-bundle-analyzer. I implement code splitting with React.lazy to defer loading components that aren't immediately needed. I also use useMemo and useCallback to prevent unnecessary re-renders, though I try not to overuse them.",
            corrected_answer: "Well, I usually start by looking at bundle sizes using tools like webpack-bundle-analyzer. I implement code splitting with React.lazy to defer loading components that aren't immediately needed. I also use useMemo and useCallback to prevent unnecessary re-renders, though I try not to overuse them.",
            ai_score: 85,
            expected_answer: "Candidate should mention techniques like lazy loading, code splitting, memoization (useMemo, useCallback), virtualized lists, and analyzing bundle size.",
            feedback: "Solid technical approach. Mentioning `React.lazy` and being cautious about overusing memoization shows practical experience. You could also mention tools like Lighthouse or the React Profiler for a more comprehensive answer."
        },
        {
            question_text: "Can you describe a time when you had to advocate for web accessibility in a project?",
            raw_answer: "On a recent dashboard project, the designers used very light gray text that was hard to read. I ran a contrast checker and showed them it failed WCAG AA standards. I advocated for darkening the text and adding proper ARIA labels to our custom dropdowns so screen readers could navigate them.",
            corrected_answer: "On a recent dashboard project, the designers used very light gray text that was hard to read. I ran a contrast checker and showed them it failed WCAG AA standards. I advocated for darkening the text and adding proper ARIA labels to our custom dropdowns so screen readers could navigate them.",
            ai_score: 90,
            expected_answer: "Candidate provides a specific scenario, explains the accessibility issue (e.g., contrast, ARIA labels, keyboard navigation), and details the actions taken to resolve it.",
            feedback: "Excellent behavioral answer. You provided a specific situational example (contrast issues) and demonstrated knowledge of WCAG standards and ARIA labels."
        }
    ],

    ai_suggestions_behavioral: [
        "Use the STAR method more consistently to structure your behavioral examples.",
        "Maintain your confident tone; your communication style is very clear."
    ],
    ai_suggestions_technical: [
        "When discussing React performance, explicitly mention the React Profiler tool.",
        "Consider discussing Server-Side Rendering (SSR) benefits for performance if applicable."
    ],
    summary_text: "You performed very well in this interview. Your technical knowledge of React and state management is solid, and you provided excellent, concrete examples for accessibility. A slightly deeper dive into advanced performance profiling tools would make your answers even stronger."
};

// ── Simulated Interview Flow (Used in useDemoInterview.js) ──
export const demoInterviewFlow = [
    {
        type: "greeting",
        text: "Hello! I am MockMate AI, and I'll be conducting your interview for the Senior Frontend Developer role. First, tell me about a complex frontend architecture you designed and how you handled state management."
    },
    {
        type: "question",
        text: "That makes sense. Zustand is a solid choice. Moving on, how do you approach optimizing a React application for better performance?"
    },
    {
        type: "question",
        text: "Great points on code splitting. For our last question today, can you describe a time when you had to advocate for web accessibility in a project?"
    },
    {
        type: "end",
        text: "Thank you for sharing that. It looks like we're out of time. Your interview is complete, and I'm finalizing your report now."
    }
];
