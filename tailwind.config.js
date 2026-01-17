import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Montserrat", "sans-serif"],
        body: ["Outfit", "sans-serif"],
      },
      fontSize: {
        // Apple HIG Typography Scale
        "hig-xs": "var(--font-size-xs)",
        "hig-sm": "var(--font-size-sm)",
        "hig-base": "var(--font-size-base)",
        "hig-lg": "var(--font-size-lg)",
        "hig-xl": "var(--font-size-xl)",
        "hig-2xl": "var(--font-size-2xl)",
        "hig-3xl": "var(--font-size-3xl)",
        "hig-4xl": "var(--font-size-4xl)",
        "hig-5xl": "var(--font-size-5xl)",
        "hig-6xl": "var(--font-size-6xl)",
        "hig-7xl": "var(--font-size-7xl)",
      },
      spacing: {
        // Apple HIG Spacing Scale
        "hig-1": "var(--space-1)",
        "hig-2": "var(--space-2)",
        "hig-4": "var(--space-4)",
        "hig-6": "var(--space-6)",
        "hig-8": "var(--space-8)",
        "hig-10": "var(--space-10)",
        "hig-12": "var(--space-12)",
        "hig-14": "var(--space-14)",
        "hig-16": "var(--space-16)",
        "hig-18": "var(--space-18)",
        "hig-20": "var(--space-20)",
        "hig-24": "var(--space-24)",
        "hig-28": "var(--space-28)",
        "hig-32": "var(--space-32)",
        "hig-36": "var(--space-36)",
        "hig-40": "var(--space-40)",
        "hig-44": "var(--space-44)",
        "hig-48": "var(--space-48)",
        "hig-56": "var(--space-56)",
        "hig-64": "var(--space-64)",
        "hig-72": "var(--space-72)",
        "hig-80": "var(--space-80)",
        "hig-96": "var(--space-96)",
      },
      animation: {
        // Apple HIG Animations
        "fade-in": "fadeIn var(--duration-normal) var(--ease-out)",
        "slide-up": "slideUp var(--duration-normal) var(--ease-spring)",
        "scale-in": "scaleIn var(--duration-fast) var(--ease-spring)",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        scaleIn: {
          from: {
            opacity: "0",
            transform: "scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
      },
      transitionTimingFunction: {
        // Apple HIG Easing Curves
        "hig-in": "var(--ease-in)",
        "hig-out": "var(--ease-out)",
        "hig-in-out": "var(--ease-in-out)",
        "hig-spring": "var(--ease-spring)",
      },
      transitionDuration: {
        // Apple HIG Durations
        "hig-fast": "var(--duration-fast)",
        "hig-normal": "var(--duration-normal)",
        "hig-slow": "var(--duration-slow)",
      },
      boxShadow: {
        // Apple HIG Shadows
        "hig-sm": "var(--shadow-sm)",
        "hig-base": "var(--shadow-base)",
        "hig-md": "var(--shadow-md)",
        "hig-lg": "var(--shadow-lg)",
        "hig-xl": "var(--shadow-xl)",
        "hig-2xl": "var(--shadow-2xl)",
      },
      backdropBlur: {
        "hig-glass": "20px",
      },
    },
  },
  plugins: [typography],
};

export default config;
