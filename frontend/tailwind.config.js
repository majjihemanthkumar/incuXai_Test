/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#F5F6FA',
                'clay-blue': '#A7C7E7',
                'clay-pink': '#F6C1CC',
                'clay-mint': '#BEE3DB',
                'clay-purple': '#C7CEEA',
                'text-dark': '#2F2F2F',
            },
            borderRadius: {
                'clay': '30px',
            },
            boxShadow: {
                'clay-light': '8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.8)',
                'clay-medium': '12px 12px 24px rgba(0,0,0,0.12), -12px -12px 24px rgba(255,255,255,0.9)',
                'clay-pressed': 'inset 6px 6px 12px rgba(0,0,0,0.08), inset -6px -6px 12px rgba(255,255,255,0.8)',
            },
            fontFamily: {
                sans: ['Poppins', 'Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
