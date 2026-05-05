// tailwind.config.ts
import type { Config } from "tailwindcss"

const config = {
  // [修改] 将 ["class"] 改为字符串 "class"，解决 TypeScript 报错
  darkMode: "class",
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        /* Apple Design Language — Semantic Tokens */
        apple: {
          primary: 'var(--primary)',
          focus: 'var(--apple-primary-focus)',
          'on-dark': 'var(--apple-primary-on-dark)',
          ink: 'var(--apple-ink)',
          'ink-muted-80': 'var(--apple-ink-muted-80)',
          'ink-muted-48': 'var(--apple-ink-muted-48)',
          parchment: 'var(--apple-parchment)',
          pearl: 'var(--apple-pearl)',
          canvas: 'var(--apple-canvas)',
          'tile-1': 'var(--apple-tile-1)',
          'tile-2': 'var(--apple-tile-2)',
          'tile-3': 'var(--apple-tile-3)',
          'surface-black': 'var(--apple-surface-black)',
          chip: 'var(--apple-chip-translucent)',
          hairline: 'var(--apple-hairline)',
          'divider-soft': 'var(--apple-divider-soft)',
          'on-dark-text': 'var(--apple-on-dark)',
          'body-on-dark': 'var(--apple-body-on-dark)',
          'body-muted': 'var(--apple-body-muted)',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "11px",
        lg: "18px",
        xl: "22px",
        "2xl": "26px",
        pill: "9999px",
        /* Apple Radius Scale */
        'apple-xs': '5px',
        'apple-sm': '8px',
        'apple-md': '11px',
        'apple-lg': '18px',
        'apple-pill': '9999px',
        'apple-full': '9999px',
      },
      fontFamily: {
        'apple-display': ['SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        'apple-text': ['SF Pro Text', 'system-ui', '-apple-system', 'sans-serif'],
      },
      /* 扩展间距系统 */
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      /* 阴影系统 */
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        'inner': 'var(--shadow-inner)',
        'primary': 'var(--shadow-primary)',
        'destructive': 'var(--shadow-destructive)',
        /* Apple product shadow — ONLY for product imagery */
        'apple-product': 'rgba(0, 0, 0, 0.22) 3px 5px 30px',
      },
      /* Backdrop blur */
      backdropBlur: {
        'apple': '20px',
      },
      /* Apple Typography Scale */
      fontSize: {
        'headline-lg': ['48px', { lineHeight: '1.08', letterSpacing: '-0.003em', fontWeight: '600' }],
        'headline-md': ['32px', { lineHeight: '1.12', letterSpacing: '-0.022em', fontWeight: '600' }],
        'headline-sm': ['24px', { lineHeight: '1.21', letterSpacing: '-0.022em', fontWeight: '600' }],
        'body': ['17px', { lineHeight: '1.47', letterSpacing: '-0.374px', fontWeight: '400' }],
        'caption': ['14px', { lineHeight: '1.43', letterSpacing: '-0.224px', fontWeight: '400' }],
        'fine-print': ['12px', { lineHeight: '1.0', letterSpacing: '-0.12px', fontWeight: '400' }],
      },
      /* Apple Weight Ladder — no 500 */
      fontWeight: {
        'light': '300',
        'regular': '400',
        'semibold': '600',
        'bold': '700',
      },
      /* 动画时长 */
      transitionDuration: {
        'fast': '150ms',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
      },
      /* 缓动函数 */
      transitionTimingFunction: {
        'default': 'var(--ease-default)',
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        'spring': 'var(--ease-spring)',
      },
      /* 层级系统 */
      zIndex: {
        'dropdown': 'var(--z-dropdown)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
        'toast': 'var(--z-toast)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-out": {
          from: { transform: "scale(1)", opacity: "1" },
          to: { transform: "scale(0.95)", opacity: "0" },
        },
        "magic-orb-rotate": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "magic-orb-glow": {
          "0%, 100%": {
            boxShadow:
              "0 0 12px 2px var(--magic-orb-glow-1), 0 0 24px 4px var(--magic-orb-glow-2), 0 2px 8px rgba(0, 0, 0, 0.08)",
          },
          "50%": {
            boxShadow:
              "0 0 16px 4px var(--magic-orb-glow-1), 0 0 32px 8px var(--magic-orb-glow-2), 0 2px 8px rgba(0, 0, 0, 0.08)",
          },
        },
        "magic-orb-shimmer": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in var(--duration-normal) var(--ease-out)",
        "fade-out": "fade-out var(--duration-normal) var(--ease-in)",
        "slide-in-top": "slide-in-from-top var(--duration-normal) var(--ease-out)",
        "slide-in-bottom": "slide-in-from-bottom var(--duration-normal) var(--ease-out)",
        "slide-in-left": "slide-in-from-left var(--duration-normal) var(--ease-out)",
        "slide-in-right": "slide-in-from-right var(--duration-normal) var(--ease-out)",
        "scale-in": "scale-in 150ms var(--ease-spring)",
        "scale-out": "scale-out 150ms var(--ease-default)",
        "magic-orb-rotate": "magic-orb-rotate 10s linear infinite",
        "magic-orb-glow": "magic-orb-glow 4s ease-in-out infinite",
        "magic-orb-shimmer": "magic-orb-shimmer 5s ease-in-out infinite",
      },
    },
  },
  // 关键在这里：确保这两个插件都有
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config

export default config