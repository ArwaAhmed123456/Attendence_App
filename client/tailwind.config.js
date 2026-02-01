/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#00afca', // Brand Teal
                secondary: '#008ba3', // Dark Teal
                accent: '#4dd0e1', // Light Teal
            }
        },
    },
    plugins: [],
}
