import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary Colours
        primaryBlue: "var(--color-blue-ntu)",
        primaryRed: "var(--color-red-ntu)",

        // Greyscale
        white: "var(--color-white)",
        grey05: "var(--color-grey-05)",
        grey10: "var(--color-grey-10)",
        grey25: "var(--color-grey-25)",
        grey55: "var(--color-grey-55)",
        grey80: "var(--color-grey-80)",
        black: "var(--color-black)",

        // Red Range
        redM1: "var(--color-red-m1)",
        red: "var(--color-red-ntu)",
        redP1: "var(--color-red-p1)",
        redP2: "var(--color-red-p2)",

        // Purple Range
        purple: "var(--color-purple)",
        purpleP1: "var(--color-purple-p1)",

        // Blue Range
        blueM3: "var(--color-blue-m3)",
        blueM2: "var(--color-blue-m2)",
        blueM1: "var(--color-blue-m1)",
        blue: "var(--color-blue-ntu)",

        // Teal & Yellow
        teal: "var(--color-teal)",
        yellow: "var(--color-yellow)",
      
        // Green Range
        greenM1: "var(--color-green-m1)",
        green: "var(--color-green)",
        greenP1: "var(--color-green-p1)"
      },
      backgroundImage: {
        "gradient-background": "linear-gradient(90deg, var(--gradient-bg-start), var(--gradient-bg-end))"
      },

      borderRadius: {
        card: '16px',
        button: '8px',
        label: '16px',
        tabHighlight: '8px',
      },
      boxShadow: {
        card: '0px 0px 24px rgba(0,0,0,0.25)'
      },

      /*
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      */
    },
  },
} satisfies Config;
