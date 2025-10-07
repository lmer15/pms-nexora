export const colors = {
  background: "#F8FAFC",
  cardBg: "#FFFFFF",
  primary: "#1E40AF",
  success: "#15803D",
  warning: "#D97706",
  danger: "#DC2626",
  neutralText: "#334155",
  mutedText: "#6B7280",
  border: "#E5E7EB",
  // Additional colors for charts and status
  chart: {
    primary: "#1E40AF",
    secondary: "#3B82F6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    gradient: {
      primary: "linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)",
      success: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      warning: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
      danger: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)"
    }
  },
  status: {
    balanced: "#10B981",
    caution: "#F59E0B",
    overloaded: "#EF4444"
  }
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
  xxl: 64
};

export const radius = {
  base: 12,
  sm: 8,
  lg: 16
};

export const shadow = {
  sm: "0 1px 3px rgba(15, 23, 42, 0.1)",
  base: "0 6px 18px rgba(15, 23, 42, 0.06)",
  lg: "0 10px 25px rgba(15, 23, 42, 0.1)"
};

export const transitions = {
  fast: "150ms ease-in-out",
  normal: "200ms ease-in-out",
  slow: "300ms ease-in-out"
};

export const fonts = {
  primary: "Inter, system-ui, sans-serif",
  mono: "JetBrains Mono, Consolas, monospace"
};

export const typography = {
  h1: {
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: 1.2
  },
  h2: {
    fontSize: "2rem",
    fontWeight: 600,
    lineHeight: 1.3
  },
  h3: {
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.4
  },
  h4: {
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1.4
  },
  body: {
    fontSize: "1rem",
    fontWeight: 400,
    lineHeight: 1.5
  },
  small: {
    fontSize: "0.875rem",
    fontWeight: 400,
    lineHeight: 1.4
  },
  caption: {
    fontSize: "0.75rem",
    fontWeight: 500,
    lineHeight: 1.3,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em"
  }
};

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px"
};
