import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useTheme } from "@/hooks/useTheme";

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const mode = theme === "dark" ? "dark" : "light";

  const muiTheme = createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#5b7cff" : "#1e3a5f" },
      secondary: { main: mode === "dark" ? "#64b5f6" : "#1976d2" },
      background: {
        default: mode === "dark" ? "hsl(230, 12%, 14%)" : "#fff",
        paper: mode === "dark" ? "hsl(230, 11%, 18%)" : "#fff",
      },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  });

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
