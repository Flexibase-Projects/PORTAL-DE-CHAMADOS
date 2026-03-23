import { useEffect, useId, useMemo, useState } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { Medal, Maximize2 } from "lucide-react";
import { ChartFullscreenDialog } from "./ChartFullscreenDialog";

export type TopSolicitanteRow = {
  usuario_id: string;
  nome: string;
  count: number;
  departamento_origem?: string;
};

const ITEMS_PER_PAGE = 5;

/** Ouro: distinto da prata (2º) e do bronze (3º). */
const MEDAL_GOLD = "#d4af37";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <Medal
        size={18}
        strokeWidth={2}
        aria-hidden
        style={{
          color: MEDAL_GOLD,
          flexShrink: 0,
          filter: "drop-shadow(0 0 1.5px rgba(212, 175, 55, 0.65))",
        }}
      />
    );
  }
  if (rank === 2) {
    return <Medal size={18} strokeWidth={2} aria-hidden style={{ color: "#94a3b8", flexShrink: 0 }} />;
  }
  if (rank === 3) {
    return <Medal size={18} strokeWidth={2} aria-hidden style={{ color: "#b45309", flexShrink: 0 }} />;
  }
  return (
    <Typography
      component="span"
      sx={{
        width: 22,
        flexShrink: 0,
        fontWeight: 600,
        fontSize: "0.875rem",
        color: "text.secondary",
        textAlign: "left",
      }}
    >
      {rank}.
    </Typography>
  );
}

function TopListRows({
  rows,
  startRank,
  dense,
}: {
  rows: TopSolicitanteRow[];
  startRank: number;
  dense?: boolean;
}) {
  const titleColor = "#64748b";
  return (
    <Stack spacing={dense ? 0.75 : 1.1}>
      {rows.map((row, i) => {
        const rank = startRank + i;
        return (
          <Box
            key={row.usuario_id}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              minWidth: 0,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <RankBadge rank={rank} />
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ color: titleColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {row.nome}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
              {row.count}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

export function TopTicketCreatorsCard({
  data,
  filterSetor,
  getSetor,
}: {
  data: TopSolicitanteRow[];
  filterSetor: string | null;
  getSetor: (departamento: string) => string | null;
}) {
  const theme = useTheme();
  const secondaryColor = theme.palette.secondary.main;
  const dialogTitleId = useId().replace(/:/g, "");
  const [page, setPage] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!filterSetor) return data;
    return data.filter((row) => getSetor((row.departamento_origem ?? "").trim()) === filterSetor);
  }, [data, filterSetor, getSetor]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const slice = filtered.slice(safePage * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE + ITEMS_PER_PAGE);

  useEffect(() => {
    setPage(0);
  }, [filterSetor, data]);

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  return (
    <Card
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        "&:hover": {
          boxShadow: `0 0 24px ${alpha(secondaryColor, 0.28)}, 0 0 48px ${alpha(secondaryColor, 0.12)}`,
        },
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#64748b" }}>
            Top usuários que mais abrem chamado
          </Typography>
        }
        action={
          <IconButton
            size="small"
            onClick={() => setFullscreenOpen(true)}
            aria-label="Abrir ranking ampliado"
            disabled={filtered.length === 0}
            sx={{ color: "text.secondary", "&:hover": { color: "primary.main", bgcolor: "action.hover" } }}
          >
            <Maximize2 size={18} />
          </IconButton>
        }
        sx={{ flexShrink: 0, "& .MuiCardHeader-action": { m: 0, alignSelf: "center" } }}
      />
      <CardContent sx={{ pt: 0, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {filtered.length === 0 ? (
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: { xs: 220, sm: 250 } }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Sem dados no período.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: { xs: 220, sm: 250 } }}>
            <TopListRows rows={slice} startRank={safePage * ITEMS_PER_PAGE + 1} />
            <Box sx={{ flex: 1, minHeight: 0 }} />
            {pageCount > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75, pt: 2, flexShrink: 0 }}>
                {Array.from({ length: pageCount }, (_, i) => (
                  <Box
                    key={i}
                    component="button"
                    type="button"
                    onClick={() => setPage(i)}
                    aria-label={`Página ${i + 1} do ranking`}
                    sx={{
                      p: 0,
                      border: "none",
                      cursor: "pointer",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: i === safePage ? "primary.main" : alpha(theme.palette.text.disabled, 0.45),
                      transition: "transform 0.15s ease, background-color 0.15s ease",
                      "&:hover": { transform: "scale(1.15)" },
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </CardContent>
      <ChartFullscreenDialog
        open={fullscreenOpen && filtered.length > 0}
        onClose={() => setFullscreenOpen(false)}
        title="Top usuários que mais abrem chamado"
        titleId={dialogTitleId}
      >
        <Box sx={{ flex: 1, minHeight: 320, width: "100%", overflow: "auto", py: 0.5 }}>
          <TopListRows rows={filtered} startRank={1} dense />
        </Box>
      </ChartFullscreenDialog>
    </Card>
  );
}
