export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary blue palette
        primary: "#284ED5",
        primaryDark: "#2441BB",
        primaryDeeper: "#223DB6",
        primaryLight: "#4F6FD9",
        tint2: "#6D8CE3",
        tint3: "#93ABE9",
        tint4: "#B3C6F0",
        onPrimary: "#F8FAFD",

        // Neutrals
        base: "#F8FAFD",
        surface: "#FFFFFF",
        border: "#B3C6F0",
        text: "#343636",
        textMuted: "#9EA6B2",
        secondary: "#343636",

        // Semantic colors (kept for alerts/status)
        success: "#16A34A",
        warning: "#F59E0B",
        danger: "#DC2626",
        info: "#284ED5",
      },
      boxShadow: {
        soft: "0 10px 26px rgba(40,78,213,0.08)",
        pop: "0 12px 28px rgba(40,78,213,0.20)",
      },
      borderRadius: {
        card: "12px",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(180deg, #284ED5 0%, #2441BB 100%)",
      },
    },
  },
  plugins: [],
};
