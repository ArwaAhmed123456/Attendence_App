/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#2b4594', // Corporate Blue
                secondary: '#1e293b', // Dark Navy
                accent: '#60a5fa', // Soft Blue
            }
        },
    },
    plugins: [],
}
