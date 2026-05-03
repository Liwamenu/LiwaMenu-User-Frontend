// react-hot-toast global defaults.
// Goals:
//  • Top-center placement so notifications are read without scanning.
//  • Theme-aware via CSS variables — looks correct in both light and dark mode.
//  • A coloured 4px accent bar on the left of each toast type for instant
//    recognition (success / error / loading) without relying on icon alone.

// React's inline-style merging drops the `border` shorthand when a longhand
// like `borderLeft` is also present, so we set each side explicitly.
const baseStyle = {
  background: "var(--white-1)",
  color: "var(--black-1)",
  borderTop: "1px solid var(--border-1)",
  borderRight: "1px solid var(--border-1)",
  borderBottom: "1px solid var(--border-1)",
  borderLeft: "1px solid var(--border-1)",
  borderRadius: "0.875rem",
  padding: "0.875rem 1.125rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  lineHeight: 1.45,
  letterSpacing: "0.01em",
  boxShadow: "var(--toast-shadow)",
  maxWidth: "32rem",
  minWidth: "16rem",
};

const accent = (color) => ({
  ...baseStyle,
  borderLeft: `4px solid ${color}`,
});

const toastOptions = {
  position: "top-center",
  duration: 4500,
  gutter: 10,
  containerStyle: {
    top: 16,
  },
  style: baseStyle,
  success: {
    duration: 4500,
    style: accent("var(--green-1)"),
    iconTheme: {
      primary: "var(--green-1)",
      secondary: "var(--white-1)",
    },
  },
  error: {
    duration: 5500,
    style: accent("var(--red-1)"),
    iconTheme: {
      primary: "var(--red-1)",
      secondary: "var(--white-1)",
    },
  },
  loading: {
    style: accent("var(--primary-1)"),
    iconTheme: {
      primary: "var(--primary-1)",
      secondary: "var(--white-1)",
    },
  },
};

export default toastOptions;
