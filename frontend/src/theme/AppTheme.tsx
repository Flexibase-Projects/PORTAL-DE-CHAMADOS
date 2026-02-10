import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useTheme } from "@/hooks/useTheme";

const PRIMARY_BLUE = "#2563eb";
const LIGHT = {
  primary: { main: PRIMARY_BLUE, light: "#3b82f6", dark: "#1d4ed8", contrastText: "#fff" },
  secondary: { main: "#0ea5e9", light: "#38bdf8", dark: "#0284c7", contrastText: "#fff" },
  background: { default: "#f6f8fa", paper: "#ffffff" },
  divider: "rgba(0, 0, 0, 0.08)",
  action: {
    hover: "rgba(0, 0, 0, 0.04)",
    selected: "rgba(37, 99, 235, 0.08)",
    disabled: "rgba(0, 0, 0, 0.26)",
    disabledBackground: "rgba(0, 0, 0, 0.12)",
    focus: "rgba(37, 99, 235, 0.12)",
    activatedOpacity: 0.12,
  },
  text: {
    primary: "rgba(0, 0, 0, 0.87)",
    secondary: "rgba(0, 0, 0, 0.55)",
    disabled: "rgba(0, 0, 0, 0.38)",
  },
};

const DARK = {
  primary: { main: "#3b82f6", light: "#60a5fa", dark: "#2563eb", contrastText: "#fff" },
  secondary: { main: "#38bdf8", light: "#7dd3fc", dark: "#0ea5e9", contrastText: "#0c1222" },
  background: { default: "hsl(222, 18%, 11%)", paper: "hsl(222, 18%, 14%)" },
  divider: "rgba(255, 255, 255, 0.08)",
  action: {
    hover: "rgba(255, 255, 255, 0.05)",
    selected: "rgba(59, 130, 246, 0.15)",
    disabled: "rgba(255, 255, 255, 0.3)",
    disabledBackground: "rgba(255, 255, 255, 0.12)",
    focus: "rgba(59, 130, 246, 0.2)",
    activatedOpacity: 0.12,
  },
  text: {
    primary: "rgba(255, 255, 255, 0.95)",
    secondary: "rgba(255, 255, 255, 0.65)",
    disabled: "rgba(255, 255, 255, 0.5)",
  },
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const mode = theme === "dark" ? "dark" : "light";
  const tokens = mode === "dark" ? DARK : LIGHT;
  const isDark = mode === "dark";

  const muiTheme = createTheme({
    palette: {
      mode,
      primary: tokens.primary,
      secondary: tokens.secondary,
      background: tokens.background,
      divider: tokens.divider,
      action: tokens.action,
      text: tokens.text,
      success: { main: isDark ? "#66bb6a" : "#2e7d32", light: isDark ? "rgba(102,187,106,0.15)" : "rgba(46,125,50,0.1)" },
      warning: { main: isDark ? "#ffb74d" : "#ed6c02", light: isDark ? "rgba(255,183,77,0.15)" : "rgba(237,108,2,0.1)" },
      error: { main: isDark ? "#f44336" : "#d32f2f", light: isDark ? "rgba(244,67,54,0.15)" : "rgba(211,47,47,0.1)" },
      info: { main: isDark ? "#38bdf8" : "#0ea5e9", light: isDark ? "rgba(56,189,248,0.15)" : "rgba(14,165,233,0.1)" },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.3 },
      h5: { fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.35 },
      h6: { fontWeight: 600, fontSize: "1.1rem", lineHeight: 1.4 },
      subtitle1: { fontWeight: 600, fontSize: "0.9375rem" },
      subtitle2: { fontWeight: 600, fontSize: "0.875rem" },
      body1: { fontSize: "0.9375rem", lineHeight: 1.6 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.6 },
      caption: { fontSize: "0.75rem", lineHeight: 1.4 },
      button: { fontWeight: 600, fontSize: "0.8125rem" },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "@import": "url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap')",
          body: { backgroundColor: tokens.background.default },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          },
        },
      },
      MuiCard: {
        defaultProps: { variant: "outlined" },
        styleOverrides: {
          root: {
            border: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            boxShadow: "none",
            transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: { padding: "16px 16px 8px", borderBottom: "none" },
          title: { fontSize: "0.875rem", fontWeight: 600 },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 16, "&:last-child": { paddingBottom: 16 } },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 8,
            paddingInline: 16,
          },
          sizeSmall: { fontSize: "0.8125rem", paddingBlock: 4, paddingInline: 12 },
          contained: {
            "&:hover": {
              boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.35)" : "0 2px 8px rgba(0,0,0,0.12)",
            },
          },
          outlined: {
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: "small" },
      },
      MuiSelect: {
        defaultProps: { size: "small" },
      },
      MuiFormControl: {
        defaultProps: { size: "small" },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { fontSize: "0.875rem" },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)",
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: "0.875rem" },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: tokens.divider },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRightColor: tokens.divider,
            backgroundColor: isDark ? "hsl(222, 18%, 13%)" : "#f8f9fa",
            border: "none",
            borderRight: `1px solid ${tokens.divider}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: tokens.divider,
            fontSize: "0.8125rem",
            padding: "10px 14px",
          },
          head: {
            fontWeight: 600,
            fontSize: "0.75rem",
            textTransform: "uppercase" as const,
            letterSpacing: "0.04em",
            color: tokens.text.secondary,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.8125rem",
            minHeight: 40,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 40 },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, fontSize: "0.75rem" },
          sizeSmall: { height: 24 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${tokens.divider}`,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: { fontSize: "1rem", fontWeight: 700, padding: "16px 20px" },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: "8px 20px 16px" },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: { padding: "12px 20px" },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { fontSize: "0.8125rem", borderRadius: 8 },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: "0.75rem" },
        },
      },
    },
  });

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
