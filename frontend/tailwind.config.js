/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "background": "#faf8ff",
        "on-background": "#1a1b21",
        "surface": "#faf8ff",
        "surface-bright": "#faf8ff",
        "surface-dim": "#dad9e1",
        "surface-variant": "#e2e2e9",
        "on-surface": "#1a1b21",
        "on-surface-variant": "#464555",
        
        // Surface Containers - Layering System
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f3fb",
        "surface-container": "#eeedf5",
        "surface-container-high": "#e8e7ef",
        "surface-container-highest": "#e2e2e9",
        
        // Primary Color System (Indigo)
        "primary": "#3525cd",
        "primary-container": "#4f46e5",
        "primary-fixed": "#e2dfff",
        "primary-fixed-dim": "#c3c0ff",
        "on-primary": "#ffffff",
        "on-primary-fixed": "#0f0069",
        "on-primary-fixed-variant": "#3323cc",
        "on-primary-container": "#dad7ff",
        "inverse-primary": "#c3c0ff",
        
        // Secondary Color System (Purple)
        "secondary": "#58579b",
        "secondary-container": "#b6b4ff",
        "secondary-fixed": "#e2dfff",
        "secondary-fixed-dim": "#c3c0ff",
        "on-secondary": "#ffffff",
        "on-secondary-fixed": "#140f54",
        "on-secondary-fixed-variant": "#413f82",
        "on-secondary-container": "#454386",
        
        // Tertiary Color System
        "tertiary": "#474751",
        "tertiary-container": "#5f5f69",
        "tertiary-fixed": "#e3e1ed",
        "tertiary-fixed-dim": "#c7c5d1",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#1a1b23",
        "on-tertiary-fixed-variant": "#46464f",
        "on-tertiary-container": "#dbdae5",
        
        // Error States
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        
        // Semantic/Outline
        "outline": "#777587",
        "outline-variant": "#c7c4d8",
        
        // Inverse
        "inverse-surface": "#2f3036",
        "inverse-on-surface": "#f1f0f8",
        
        // Surface Tint
        "surface-tint": "#4d44e3",
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "sm": "0.375rem",
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "full": "9999px",
      },
      fontFamily: {
        "headline": ["Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
        "sans": ["Inter", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "headline-md": ["1.75rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }],
        "headline-sm": ["1.375rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        "title-lg": ["1.375rem", { lineHeight: "1.4", letterSpacing: "0em", fontWeight: "600" }],
        "title-md": ["1rem", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "600" }],
        "title-sm": ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.01em", fontWeight: "600" }],
        "body-lg": ["1rem", { lineHeight: "1.6", letterSpacing: "0.015em" }],
        "body-md": ["0.875rem", { lineHeight: "1.6", letterSpacing: "0.025em" }],
        "body-sm": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.04em" }],
        "label-lg": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.1em", fontWeight: "600" }],
        "label-md": ["0.6875rem", { lineHeight: "1.333", letterSpacing: "0.1em", fontWeight: "600" }],
        "label-sm": ["0.6875rem", { lineHeight: "1.333", letterSpacing: "0.05em", fontWeight: "700" }],
      },
      spacing: {
        "xs": "0.25rem",
        "sm": "0.5rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "3rem",
        "4xl": "4rem",
      },
      boxShadow: {
        "clinical": "0 16px 32px -12px rgba(53, 37, 205, 0.06)",
        "clinical-sm": "0 4px 8px -4px rgba(53, 37, 205, 0.04)",
        "clinical-md": "0 8px 16px -6px rgba(53, 37, 205, 0.05)",
        "clinical-lg": "0 32px 64px -12px rgba(53, 37, 205, 0.06)",
      },
      backdropBlur: {
        "xs": "2px",
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
      },
    },
  },
  plugins: [],
}

