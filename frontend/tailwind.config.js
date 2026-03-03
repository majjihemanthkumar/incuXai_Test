/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#0B1F3A',
                secondary: '#1E293B',
                accent: '#0D9488',
                background: '#F5F7FA',
                border: '#E2E8F0',
                success: '#15803D',
                error: '#B91C1C',
                warning: '#D97706'
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            spacing: {
                // Enforce 8px spacing system implicitly, standard tailwind handles this well (e.g. p-2 = 8px, p-4 = 16px)
            }
        },
    },
    plugins: [],
}
