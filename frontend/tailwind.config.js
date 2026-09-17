/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {},
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
