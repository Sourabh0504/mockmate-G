/** @type {import('tailwindcss').Config} */
// Exact Lovable design tokens — converted from tailwind.config.ts
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,jsx}'],
    prefix: '',
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: { '2xl': '1400px' },
        },
        extend: {
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                poppins: ['Poppins', 'sans-serif'],
                montserrat: ['Montserrat', 'sans-serif'],
            },
            colors: {
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                    glow: 'hsl(var(--primary-glow))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                    glow: 'hsl(var(--secondary-glow))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                    glow: 'hsl(var(--accent-glow))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' },
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 20px hsl(var(--primary) / 0.4)' },
                    '50%': { boxShadow: '0 0 40px hsl(var(--primary) / 0.8)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'bounce-subtle': {
                    '0%, 100%': { transform: 'translateY(0px)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
                    '50%': { transform: 'translateY(-5px)', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
                },
                'morph-blob': {
                    '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', transform: 'scale(1) rotate(0deg)' },
                    '50%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%', transform: 'scale(1.1) rotate(180deg)' },
                },
                'morph-blob-reverse': {
                    '0%, 100%': { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%', transform: 'scale(1) rotate(0deg)' },
                    '50%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', transform: 'scale(0.9) rotate(-180deg)' },
                },
                'morph-blob-slow': {
                    '0%, 100%': { borderRadius: '40% 60% 60% 40% / 60% 40% 40% 60%', transform: 'scale(1) rotate(0deg)' },
                    '33%': { borderRadius: '70% 30% 50% 50% / 30% 70% 70% 30%', transform: 'scale(1.05) rotate(120deg)' },
                    '66%': { borderRadius: '50% 50% 30% 70% / 50% 50% 30% 70%', transform: 'scale(0.95) rotate(240deg)' },
                },
                'scroll-left': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                'scroll-right': {
                    '0%': { transform: 'translateX(-50%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                'pulse-ring': {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.2)', opacity: '0.7' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            animation: {
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
                'fade-in': 'fade-in 0.6s ease-out',
                'slide-up': 'slide-up 0.5s ease-out',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                float: 'float 3s ease-in-out infinite',
                'bounce-subtle': 'bounce-subtle 2s infinite',
                'spin-slow': 'spin 8s linear infinite',
                'morph-blob': 'morph-blob 8s ease-in-out infinite',
                'morph-blob-reverse': 'morph-blob-reverse 10s ease-in-out infinite',
                'morph-blob-slow': 'morph-blob-slow 12s ease-in-out infinite',
                'scroll-left': 'scroll-left 24s linear infinite',
                'scroll-right': 'scroll-right 24s linear infinite',
                'scroll-left-slow': 'scroll-left 32s linear infinite',
                'pulse-ring': 'pulse-ring 4s ease-in-out infinite',
                shimmer: 'shimmer 3s ease-in-out infinite',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};
