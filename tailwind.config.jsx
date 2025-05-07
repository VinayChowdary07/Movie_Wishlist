module.exports = {
    content: [
      "./src/**/*.{html,js,jsx,ts,tsx}",
      "./public/index.html",
    ],
    theme: {
      extend: {},
    },
    plugins: [
      require("tailwind-scrollbar-hide"), // ⬅️ Add this line
    ],
  };
  