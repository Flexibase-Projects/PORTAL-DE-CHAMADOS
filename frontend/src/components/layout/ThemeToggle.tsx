import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip title={theme === "light" ? "Modo escuro" : "Modo claro"}>
      <IconButton onClick={toggleTheme} size="small" aria-label="Alternar tema">
        {theme === "light" ? (
          <Moon style={{ width: 20, height: 20 }} />
        ) : (
          <Sun style={{ width: 20, height: 20 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
