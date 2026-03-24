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
import { useAuth } from "@/contexts/AuthContext";
import { getSetorByDepartamento, SETORES, type SetorMacro } from "@/constants/departamentos";
import { DepartmentPickerCards } from "./components/DepartmentPickerCards";
import {
  readCreateTicketDepartmentsDraft,
  saveCreateTicketDepartmentsDraft,
} from "./createTicketDepartmentsStorage";

type PickerTarget = "origem" | "destino";

export function CreateTicketSelectDepartmentsPage() {
  const navigate = useNavigate();
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
      setTarget(draft.area_origem && !draft.area_destino ? "destino" : "origem");
      return;
    }

    if (user?.id && userDepartamento?.trim()) {
      const a = userDepartamento.trim();
      const s = getSetorByDepartamento(a);
      if (s && (SETORES as readonly string[]).includes(s)) {
        setAreaOrigem(a);
        setSetorOrigem(s as SetorMacro);
        setTarget("destino");
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
      if (area.trim()) setTarget("destino");
      return;
    }
    pickDestino(area, setorMacro);
  };

  const selectedArea = target === "origem" ? areaOrigem : areaDestino;
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
          Escolha no topo se vai marcar origem ou destino e selecione nos quadros abaixo.
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
              aria-label="Selecionar se está preenchendo origem ou destino"
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600 } }}
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
                label={areaOrigem ? `Origem: ${areaOrigem}` : "Origem: n\u00E3o selecionada"}
              />
              <Chip
                size="small"
                variant={areaDestino ? "filled" : "outlined"}
                color={areaDestino ? "primary" : "default"}
                label={areaDestino ? `Destino: ${areaDestino}` : "Destino: n\u00E3o selecionado"}
              />
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
              <Button variant="contained" disabled={!canContinue} onClick={handleContinue}>
                Continuar para o formulário
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default CreateTicketSelectDepartmentsPage;
