export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#FFFFFF",
        surface: "#FFFFFF",
        border: "#E5EAF1",
        primary: "#17C6CF",
        primaryHover: "#0fa3ab",
        primaryLight: "#edfbfc",
        secondary: "#334155",
        text: "#8A7C57",
        textMuted: "#B8AE96",
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        info: "#0284C7",
        focus: "#22C55E",
      },
      boxShadow: {
        soft: "0 10px 26px rgba(15,23,42,0.06)",
        pop: "0 12px 28px rgba(23,198,207,0.25)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
