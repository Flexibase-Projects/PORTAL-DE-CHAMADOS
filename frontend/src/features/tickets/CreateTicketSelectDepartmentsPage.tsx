import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { useAuth } from "@/contexts/AuthContext";
import { getSetorByDepartamento, SETORES, type SetorMacro } from "@/constants/departamentos";
import { DepartmentPickerCards } from "./components/DepartmentPickerCards";
import {
  readCreateTicketDepartmentsDraft,
  saveCreateTicketDepartmentsDraft,
} from "./createTicketDepartmentsStorage";

export function CreateTicketSelectDepartmentsPage() {
  const navigate = useNavigate();
  const { user, departamento: userDepartamento } = useAuth();
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

  const canContinue =
    Boolean(areaOrigem?.trim() && setorOrigem && areaDestino?.trim() && setorDestino);

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
          Marque o departamento de origem e o de destino. Na próxima tela você preenche os dados do chamado.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 1 }}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Departamento de origem
              </Typography>
              <DepartmentPickerCards
                idPrefix="origem"
                ariaGroupLabel="Selecionar departamento de origem"
                selectedArea={areaOrigem}
                onSelect={pickOrigem}
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                Departamento de destino
              </Typography>
              <DepartmentPickerCards
                idPrefix="destino"
                ariaGroupLabel="Selecionar departamento de destino"
                selectedArea={areaDestino}
                onSelect={pickDestino}
              />
            </Box>

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
