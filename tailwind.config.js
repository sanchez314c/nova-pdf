/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{html,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Neo Noir Glass Monitor Color Palette
        noir: {
          // Background Colors
          950: '#0a0b0e',   // Void Black - Deepest background
          900: '#111214',   // Surface - Primary background
          850: '#141518',   // Card - Card backgrounds
          800: '#1a1b1f',   // Card Hover - Card hover state
          750: '#0d0e10',   // Sidebar - Sidebar background
          700: '#18191c',   // Tertiary - Input fields

          // Border & Divider Colors
          border: '#1e1e24',
          'border-light': '#2a2a30',
          divider: 'rgba(255, 255, 255, 0.05)',

          // Text Colors
          text: {
            primary: '#e8e8ec',
            secondary: '#9a9aa6',
            muted: '#5c5c6a',
            dim: '#44444e',
            heading: '#f4f4f7',
            inverse: '#0a0b0e',
          },

          // Accent Colors - Teal Primary (#14b8a6)
          accent: {
            DEFAULT: '#14b8a6',      // Teal 500
            hover: '#0d9488',        // Teal 600
            active: '#0a8878',       // Teal 700
            dim: 'rgba(20, 184, 166, 0.12)',
            glow: 'rgba(20, 184, 166, 0.25)',
          },

          // Secondary Accent - Cyan
          cyan: {
            DEFAULT: '#06b6d4',
            hover: '#22d3ee',
            dim: 'rgba(6, 182, 212, 0.15)',
          },

          // Purple Accent - Decorative
          purple: {
            DEFAULT: '#8b5cf6',
            dim: 'rgba(139, 92, 246, 0.15)',
          },

          // Semantic Colors
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#06b6d4',

          // Semantic Light Variants
          'success-light': 'rgba(16, 185, 129, 0.15)',
          'warning-light': 'rgba(245, 158, 11, 0.15)',
          'error-light': 'rgba(239, 68, 68, 0.15)',
          'info-light': 'rgba(6, 182, 212, 0.15)',

          // Glass Colors
          glass: {
            DEFAULT: 'rgba(255, 255, 255, 0.03)',
            medium: 'rgba(255, 255, 255, 0.05)',
            strong: 'rgba(255, 255, 255, 0.08)',
            border: 'rgba(255, 255, 255, 0.05)',
            highlight: 'rgba(255, 255, 255, 0.06)',
          },

          // Interactive States
          hover: 'rgba(255, 255, 255, 0.05)',
          active: 'rgba(20, 184, 166, 0.15)',
          selected: 'rgba(20, 184, 166, 0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',    // 12px
        'sm': '0.875rem',   // 14px
        'base': '1rem',     // 16px
        'md': '1.125rem',   // 18px
        'lg': '1.25rem',    // 20px
        'xl': '1.5rem',     // 24px
        '2xl': '1.875rem',  // 30px
        '3xl': '2rem',      // 32px
        '4xl': '3rem',      // 48px
        'display': '4.5rem', // 72px
      },
      fontWeight: {
        'thin': '100',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'tight': '-0.025em',
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      lineHeight: {
        'none': '1',
        'tight': '1.25',
        'snug': '1.375',
        'relaxed': '1.625',
        'loose': '2',
      },
      borderRadius: {
        'window': '20px',
        'card': '14px',
        'button': '10px',
        'input': '10px',
      },
      boxShadow: {
        // Layered Shadow System
        'sm': '0 1px 2px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.15)',
        'lg': '0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.2), 0 16px 32px rgba(0, 0, 0, 0.2)',
        'xl': '0 4px 8px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.15), 0 16px 32px rgba(0, 0, 0, 0.2), 0 32px 64px rgba(0, 0, 0, 0.25)',
        // Card shadows
        'card': '0 2px 4px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15)',
        'card-hover': '0 4px 8px rgba(0, 0, 0, 0.2), 0 8px 24px rgba(0, 0, 0, 0.25), 0 16px 44px rgba(0, 0, 0, 0.2)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
        // Glow effects
        'glow': '0 0 16px rgba(20, 184, 166, 0.15)',
        'glow-strong': '0 0 24px rgba(20, 184, 166, 0.25)',
        'glow-accent': '0 0 30px rgba(20, 184, 166, 0.4), 0 0 60px rgba(20, 184, 166, 0.2)',
        'glow-secondary': '0 0 16px rgba(6, 182, 212, 0.15)',
        // Focus ring
        'focus': '0 0 0 3px rgba(20, 184, 166, 0.15), 0 0 0 1px rgba(20, 184, 166, 0.5)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #14b8a6, #06b6d4)',
        'gradient-accent': 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
        'gradient-card': 'linear-gradient(145deg, #141518, #18191c)',
        'gradient-sidebar': 'linear-gradient(180deg, #0d0e10, #0a0b0e)',
        'gradient-bg': 'linear-gradient(160deg, #0a0b0e, #0f1012)',
        'gradient-button': 'linear-gradient(135deg, #14b8a6, #0d9488)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};
