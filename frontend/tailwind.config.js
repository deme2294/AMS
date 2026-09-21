/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['"Outfit"', 'sans-serif'],
                heading: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
                surface: {
                    light: '#ffffff',
                    subtle: '#f8fafc',
                    dark: '#0f172a',
                    darker: '#090d16',
                }
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
                'glass-lg': '0 12px 40px 0 rgba(0, 0, 0, 0.10)',
                'soft-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
                'soft-md': '0 6px 20px -2px rgba(0, 0, 0, 0.06), 0 3px 8px -2px rgba(0, 0, 0, 0.04)',
                'soft-xl': '0 20px 45px -8px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.04)',
                'glow-indigo': '0 0 25px -3px rgba(99, 102, 241, 0.35)',
                'glow-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.35)',
                'glow-purple': '0 0 25px -3px rgba(168, 85, 247, 0.35)',
            },
            animation: {
                'fade-in': 'fadeIn 0.35s ease-out forwards',
                'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                'pulse-glow': 'pulseGlow 2.5s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGlow: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.65' },
                },
            },
        },
    },
    safelist: [
        {
            pattern: /bg-(blue|emerald|amber|indigo|orange|pink|cyan|green|red|purple|teal|rose|violet|lime|sky|fuchsia|slate)-(50|500|900\/20)/,
        },
        {
            pattern: /text-(blue|emerald|amber|indigo|orange|pink|cyan|green|red|purple|teal|rose|violet|lime|sky|fuchsia|slate)-(400|500|600)/,
        },
        {
            pattern: /shadow-(blue|emerald|amber|indigo|orange|pink|cyan|green|red|purple|teal|rose|violet|lime|sky|fuchsia|slate)-500\/30/,
        },
    ],
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
    ],
}
