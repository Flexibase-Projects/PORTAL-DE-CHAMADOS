import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { alpha, useTheme } from "@mui/material/styles";
import { useAuth } from "@/contexts/AuthContext";
import { getSetorByDepartamento, SETORES, type SetorMacro } from "@/constants/departamentos";
import { DepartmentPickerCards } from "./components/DepartmentPickerCards";
import {
  readCreateTicketDepartmentsDraft,
  saveCreateTicketDepartmentsDraft,
} from "./createTicketDepartmentsStorage";

/** UI strings use \\uXXXX escapes so accents stay correct even if the file is not saved as UTF-8. */
const LABEL_CRIAR_CHAMADO = {
  nextDestino: "Pr\u00F3ximo: departamento de destino",
  continueForm: "Continuar para o formul\u00E1rio",
  chipOrigemEmpty: "Origem: n\u00E3o selecionada",
  chipDestinoEmpty: "Destino: n\u00E3o selecionado",
  subtitleAbas:
    "Use as abas Origem e Destino para escolher de onde parte o pedido e para qual \u00E1rea ele vai.",
  ariaAbasOrigemDestino: "Selecionar se est\u00E1 preenchendo origem ou destino",
} as const;

type PickerTarget = "origem" | "destino";

function ChamadoIntroText({
  areaOrigem,
  areaDestino,
}: {
  areaOrigem: string;
  areaDestino: string;
}) {
  const hasO = Boolean(areaOrigem?.trim());
  const hasD = Boolean(areaDestino?.trim());

  if (!hasO) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        Primeiro, indique{" "}
        <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
          de qual departamento
        </Box>{" "}
        {"voc\u00EA est\u00E1 falando; depois, "}
        <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
          para onde
        </Box>{" "}
        o chamado deve ir.
      </Typography>
    );
  }
  if (!hasD) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {"Voc\u00EA est\u00E1 abrindo um chamado "}
        <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
          a partir de {areaOrigem.trim()}
        </Box>
        {". No pr\u00F3ximo passo, escolha para qual departamento ele deve ser encaminhado."}
      </Typography>
    );
  }
  return (
    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
      Estou abrindo um chamado do{" "}
      <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
        {areaOrigem.trim()}
      </Box>{" "}
      para o{" "}
      <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
        {areaDestino.trim()}
      </Box>
      .
    </Typography>
  );
}

export function CreateTicketSelectDepartmentsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, departamento: userDepartamento } = useAuth();
  const [target, setTarget] = useState<PickerTarget>("origem");
  const [areaOrigem, setAreaOrigem] = useState("");
  const [setorOrigem, setSetorOrigem] = useState<SetorMacro | "">("");
  const [areaDestino, setAreaDestino] = useState("");
  const [setorDestino, setSetorDestino] = useState<SetorMacro | "">("");
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const draft = readCreateTicketDepartmentsDraft();
    if (draft) {
      setAreaOrigem(draft.area_origem);
      setSetorOrigem(draft.setor_origem);
      setAreaDestino(draft.area_destino);
      setSetorDestino(draft.setor_destino);
      setTarget("origem");
      return;
    }

    if (user?.id && userDepartamento?.trim()) {
      const a = userDepartamento.trim();
      const s = getSetorByDepartamento(a);
      if (s && (SETORES as readonly string[]).includes(s)) {
        setAreaOrigem(a);
        setSetorOrigem(s as SetorMacro);
      }
    }
  }, [user?.id, userDepartamento]);

  const pickOrigem = (area: string, setorMacro: SetorMacro) => {
    const trimmed = area.trim();
    setAreaOrigem(trimmed);
    setSetorOrigem(trimmed ? setorMacro : "");
  };

  const pickDestino = (area: string, setorMacro: SetorMacro) => {
    const trimmed = area.trim();
    setAreaDestino(trimmed);
    setSetorDestino(trimmed ? setorMacro : "");
  };

  const handlePick = (area: string, setorMacro: SetorMacro) => {
    if (target === "origem") {
      pickOrigem(area, setorMacro);
      return;
    }
    pickDestino(area, setorMacro);
  };

  const selectedArea = target === "origem" ? areaOrigem : areaDestino;
  const canGoToDestino = Boolean(areaOrigem?.trim() && setorOrigem);
  const canContinue = Boolean(areaOrigem?.trim() && setorOrigem && areaDestino?.trim() && setorDestino);

  const handleContinue = () => {
    if (!canContinue || !setorOrigem || !setorDestino) return;
    saveCreateTicketDepartmentsDraft({
      area_origem: areaOrigem.trim(),
      setor_origem: setorOrigem,
      area_destino: areaDestino.trim(),
      setor_destino: setorDestino,
    });
    navigate("/criar-chamado/formulario");
  };

  const toggleGroupSx = {
    p: 0.5,
    gap: 0.5,
    borderRadius: 2,
    border: "none",
    bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.08),
    "& .MuiToggleButtonGroup-grouped": {
      border: 0,
      borderRadius: `${Number(theme.shape.borderRadius) * 1.5}px !important`,
      mx: 0,
      transition: theme.transitions.create(["background-color", "color", "box-shadow"], {
        duration: theme.transitions.duration.short,
      }),
    },
    "& .MuiToggleButton-root": {
      textTransform: "none",
      fontWeight: 600,
      flex: 1,
      color: "text.secondary",
      "&:hover": {
        bgcolor: alpha(theme.palette.primary.main, 0.12),
        color: "text.primary",
      },
      "&.Mui-selected": {
        bgcolor: "primary.main",
        color: "primary.contrastText",
        boxShadow: `0 1px 4px ${alpha(theme.palette.primary.main, 0.35)}`,
        "&:hover": {
          bgcolor: "primary.dark",
          color: "primary.contrastText",
        },
      },
      "&:focus-visible": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
    },
  } as const;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2, md: 2.5 },
        maxWidth: { xs: "100%", md: 1040 },
        mx: "auto",
        width: "100%",
      }}
    >
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 0.25 }}>
          Enviar um Chamado
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {LABEL_CRIAR_CHAMADO.subtitleAbas}
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 1 }}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <ToggleButtonGroup
              value={target}
              exclusive
              fullWidth
              size="small"
              onChange={(_, v: PickerTarget | null) => {
                if (v) setTarget(v);
              }}
              aria-label={LABEL_CRIAR_CHAMADO.ariaAbasOrigemDestino}
              sx={toggleGroupSx}
            >
              <ToggleButton value="origem" aria-label="Selecionar departamento de origem">
                Origem
              </ToggleButton>
              <ToggleButton value="destino" aria-label="Selecionar departamento de destino">
                Destino
              </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                variant={areaOrigem ? "filled" : "outlined"}
                color={areaOrigem ? "primary" : "default"}
                label={areaOrigem ? `Origem: ${areaOrigem}` : LABEL_CRIAR_CHAMADO.chipOrigemEmpty}
              />
              <Chip
                size="small"
                variant={areaDestino ? "filled" : "outlined"}
                color={areaDestino ? "primary" : "default"}
                label={areaDestino ? `Destino: ${areaDestino}` : LABEL_CRIAR_CHAMADO.chipDestinoEmpty}
              />
            </Box>

            <Box
              sx={{
                px: { xs: 0, sm: 0.5 },
                py: 1,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette.primary.main, t.palette.mode === "dark" ? 0.08 : 0.04),
                border: 1,
                borderColor: "divider",
              }}
            >
              <ChamadoIntroText areaOrigem={areaOrigem} areaDestino={areaDestino} />
            </Box>

            <DepartmentPickerCards
              idPrefix={target}
              ariaGroupLabel={
                target === "origem"
                  ? "Selecionar departamento de origem"
                  : "Selecionar departamento de destino"
              }
              selectedArea={selectedArea}
              onSelect={handlePick}
            />

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, justifyContent: "flex-end", pt: 1 }}>
              <Button variant="outlined" onClick={() => navigate("/")}>
                Cancelar
              </Button>
              {target === "origem" ? (
                <Button
                  variant="contained"
                  disabled={!canGoToDestino}
                  onClick={() => setTarget("destino")}
                >
                  {LABEL_CRIAR_CHAMADO.nextDestino}
                </Button>
              ) : (
                <Button variant="contained" disabled={!canContinue} onClick={handleContinue}>
                  {LABEL_CRIAR_CHAMADO.continueForm}
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateTicketSelectDepartmentsPage;
