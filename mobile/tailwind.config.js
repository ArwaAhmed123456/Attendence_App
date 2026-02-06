module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: '#00afca', // Brand Teal
                secondary: '#008ba3', // Dark Teal
                accent: '#4dd0e1', // Light Teal
            }
        },
    },
    plugins: ["nativewind/babel"],
};
