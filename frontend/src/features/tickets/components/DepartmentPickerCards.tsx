/** Picker de departamentos por macro-setor na criação de chamado. */
import { useMemo } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import { alpha, useTheme } from "@mui/material/styles";
import { Building2, Factory, Shield } from "lucide-react";
import {
  DEPARTAMENTOS_POR_SETOR,
  SETORES,
  SETOR_ACCENT_PICKER,
  SETOR_LABEL_PICKER,
  type SetorMacro,
} from "@/constants/departamentos";

const ICONS = {
  Comercial: Building2,
  Administrativo: Shield,
  Industrial: Factory,
} as const;

function areaMatchesSelected(dept: string, selected: string): boolean {
  if (!selected?.trim()) return false;
  return dept.toUpperCase() === selected.trim().toUpperCase();
}

function deptDomId(prefix: string, setorKey: SetorMacro, dept: string): string {
  const safe = dept.replace(/[^\w\u00C0-\u024F]/g, "-").replace(/-+/g, "-");
  return `dept-${prefix}-${setorKey}-${safe}`.slice(0, 120);
}

export interface DepartmentPickerCardsProps {
  /** Nome do departamento como em `DEPARTAMENTOS_POR_SETOR` (ex.: "TI"). */
  selectedArea: string;
  /** Inclui o macro-setor do card (evita ambiguidade, ex.: RH em Admin e Industrial). */
  onSelect: (area: string, setorMacro: SetorMacro) => void;
  /** Prefixo único por grupo (origem vs destino) para ids de checkbox / acessibilidade. */
  idPrefix: string;
  /** Rótulo do grupo para leitores de tela. */
  ariaGroupLabel: string;
  /** Se definido, exibe só estes departamentos (ex.: permissão de template). `undefined` = todos. */
  allowedDepartamentos?: string[];
}

export function DepartmentPickerCards({
  selectedArea,
  onSelect,
  idPrefix,
  ariaGroupLabel,
  allowedDepartamentos,
}: DepartmentPickerCardsProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const allowedSet = useMemo(() => {
    if (allowedDepartamentos === undefined) return null;
    return new Set(
      allowedDepartamentos.map((d) => (d || "").trim().toUpperCase()).filter(Boolean)
    );
  }, [allowedDepartamentos]);

  return (
    <Box
      role="group"
      aria-label={ariaGroupLabel}
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        alignItems: "stretch",
        width: "100%",
        minWidth: 0,
      }}
    >
      {SETORES.map((setorKey) => {
        const accent = SETOR_ACCENT_PICKER[setorKey];
        const title = SETOR_LABEL_PICKER[setorKey];
        const Icon = ICONS[setorKey];
        const rawDepts = DEPARTAMENTOS_POR_SETOR[setorKey] ?? [];
        const depts = allowedSet
          ? rawDepts.filter((d) => allowedSet.has(d.trim().toUpperCase()))
          : rawDepts;
        if (depts.length === 0) return null;
        const count = depts.length;
        const accentSoft = isDark ? alpha(accent, 0.22) : alpha(accent, 0.1);
        const borderSoft = isDark ? alpha(accent, 0.45) : alpha(accent, 0.35);
        // Idle: contorno + fundo clarinho; selecionado: sombra estilo item ativo da sidebar.
        const deptRowIdleBorder = isDark ? alpha(accent, 0.26) : alpha(accent, 0.2);
        const deptRowIdleBg = isDark ? alpha(accent, 0.065) : alpha(accent, 0.05);
        const deptRowSelectedShadow = isDark
          ? "0 1px 4px rgba(0, 0, 0, 0.28), 0 0 1px rgba(255, 255, 255, 0.06)"
          : `0 1px 4px ${alpha(accent, 0.12)}, 0 1px 2px rgba(15, 23, 42, 0.04)`;

        return (
          <Card
            key={setorKey}
            variant="outlined"
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 1,
              overflow: "hidden",
              width: { xs: "100%", md: "0" },
              flex: { xs: "none", md: "1 1 0%" },
              minWidth: 0,
              borderColor: "divider",
              boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 4px rgba(15, 23, 42, 0.06)",
              // Só translateY (sem scale): scale + will-change em card com texto borra em subpixel no Chrome.
              transform: "translateY(0)",
              transition: (t) =>
                t.transitions.create(["transform", "box-shadow", "border-color"], {
                  duration: 260,
                  easing: t.transitions.easing.easeOut,
                }),
              "&:hover": {
                transform: "translateY(-6px)",
                borderColor: alpha(accent, isDark ? 0.42 : 0.3),
                boxShadow: isDark
                  ? `0 16px 36px rgba(0,0,0,0.5), 0 0 0 1px ${alpha(accent, 0.24)}, 0 0 40px ${alpha(accent, 0.14)}`
                  : `0 16px 40px rgba(15, 23, 42, 0.12), 0 0 0 1px ${alpha(accent, 0.2)}, 0 0 36px ${alpha(accent, 0.11)}`,
              },
              "@media (prefers-reduced-motion: reduce)": {
                transition: (t) =>
                  t.transitions.create(["box-shadow", "border-color"], { duration: 150 }),
                "&:hover": {
                  transform: "translateY(0)",
                },
              },
            }}
          >
            <Box
              sx={{
                height: 4,
                width: "100%",
                bgcolor: accent,
                flexShrink: 0,
              }}
            />
            <CardContent
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                pt: 1.75,
                pb: 1.5,
                px: 1.75,
                minWidth: 0,
                WebkitFontSmoothing: "subpixel-antialiased",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    bgcolor: accentSoft,
                    color: accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} strokeWidth={2} aria-hidden />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.25 }}>
                    {title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                    {count === 0 ? "Nenhum departamento" : `${count} departamento${count === 1 ? "" : "s"}`}
                  </Typography>
                </Box>
              </Box>

              {count === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center", px: 1 }}>
                  Nenhum departamento cadastrado neste setor.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                    columnGap: 0.75,
                    rowGap: 0.75,
                    mt: 0.5,
                    width: "100%",
                    minWidth: 0,
                    alignItems: "stretch",
                  }}
                >
                  {depts.map((dept) => {
                    const active = areaMatchesSelected(dept, selectedArea);
                    const rowId = deptDomId(idPrefix, setorKey, dept);
                    return (
                      <Box
                        key={dept}
                        component="label"
                        htmlFor={rowId}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          gap: 0.5,
                          width: "100%",
                          minWidth: 0,
                          minHeight: { xs: 44, sm: 52 },
                          alignSelf: "stretch",
                          boxSizing: "border-box",
                          py: 0.65,
                          px: 0.75,
                          borderRadius: 1,
                          textAlign: "left",
                          border: "1px solid",
                          borderColor: active ? borderSoft : deptRowIdleBorder,
                          bgcolor: active
                            ? isDark
                              ? alpha(accent, 0.2)
                              : alpha(accent, 0.11)
                            : deptRowIdleBg,
                          color: active ? accent : "text.primary",
                          boxShadow: active ? deptRowSelectedShadow : "none",
                          cursor: "pointer",
                          transition:
                            "background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease",
                          "&:hover": {
                            bgcolor: active
                              ? isDark
                                ? alpha(accent, 0.26)
                                : alpha(accent, 0.14)
                              : isDark
                                ? alpha(accent, 0.1)
                                : alpha(accent, 0.08),
                            borderColor: active ? borderSoft : isDark ? alpha(accent, 0.34) : alpha(accent, 0.28),
                            boxShadow: active ? deptRowSelectedShadow : "none",
                          },
                        }}
                      >
                        <Checkbox
                          id={rowId}
                          size="small"
                          checked={active}
                          onChange={(_, checked) => {
                            if (checked) onSelect(dept, setorKey);
                            else if (active) onSelect("", setorKey);
                          }}
                          sx={{
                            p: 0.5,
                            flexShrink: 0,
                            color: alpha(accent, 0.55),
                            "&.Mui-checked": { color: accent },
                          }}
                        />
                        <Typography
                          variant="body2"
                          component="span"
                          fontWeight={active ? 600 : 500}
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            color: active ? accent : "text.primary",
                            fontSize: "0.8125rem",
                            lineHeight: 1.35,
                            whiteSpace: "normal",
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                        >
                          {dept}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
