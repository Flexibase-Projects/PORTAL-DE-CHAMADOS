import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { FileEdit } from "lucide-react";

interface Props {
  departamentos: string[];
  value: string;
  onChange: (departamento: string) => void;
  hint?: string;
}

export function TemplateDepartmentCarousel({ departamentos, value, onChange, hint }: Props) {
  if (departamentos.length === 0) return null;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pausedRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const departamentosKey = useMemo(() => departamentos.join("|"), [departamentos]);
  const activeIndex = Math.max(0, departamentos.findIndex((d) => d === value));

  const scrollToIndex = (idx: number, behavior: ScrollBehavior = "smooth") => {
    const node = cardRefs.current[idx];
    const container = trackRef.current;
    if (!node || !container) return;
    const targetLeft = node.offsetLeft - (container.clientWidth - node.clientWidth) / 2;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior });
  };

  useEffect(() => {
    // Centraliza o card ativo quando o valor muda por clique externo.
    scrollToIndex(activeIndex, "smooth");
  }, [activeIndex, departamentosKey]);

  useEffect(() => {
    if (departamentos.length <= 1) return;
    let raf = 0;
    let last = performance.now();
    const speedPxPerSecond = 28; // movimento contínuo e suave

    const tick = (now: number) => {
      const container = trackRef.current;
      if (container) {
        const dt = Math.max(0, (now - last) / 1000);
        last = now;
        if (!pausedRef.current && !dragging && autoScrollEnabled) {
          container.scrollLeft += speedPxPerSecond * dt;
          const max = Math.max(0, container.scrollWidth - container.clientWidth);
          if (container.scrollLeft >= max) {
            container.scrollLeft = max;
            setAutoScrollEnabled(false);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [departamentosKey, dragging, autoScrollEnabled]);

  return (
    <Box sx={{ width: "100%" }}>
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
          {hint}
        </Typography>
      )}
      <Box
        ref={trackRef}
        role="listbox"
        aria-label="Departamentos com permissão de template"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
        onFocusCapture={() => {
          pausedRef.current = true;
        }}
        onBlurCapture={() => {
          pausedRef.current = false;
        }}
        onPointerDown={(e) => {
          const container = trackRef.current;
          if (!container) return;
          setDragging(true);
          pausedRef.current = true;
          setAutoScrollEnabled(false);
          movedRef.current = false;
          suppressClickRef.current = false;
          dragStartXRef.current = e.clientX;
          dragStartScrollRef.current = container.scrollLeft;
        }}
        onPointerMove={(e) => {
          const container = trackRef.current;
          if (!container || !dragging) return;
          const dx = e.clientX - dragStartXRef.current;
          if (Math.abs(dx) > 8) {
            movedRef.current = true;
            suppressClickRef.current = true;
          }
          container.scrollLeft = dragStartScrollRef.current - dx;
        }}
        onPointerUp={(e) => {
          setDragging(false);
          pausedRef.current = false;
          if (!movedRef.current) {
            suppressClickRef.current = false;
          } else {
            // mantém o bloqueio apenas para o click sintetizado após drag
            window.setTimeout(() => {
              suppressClickRef.current = false;
            }, 0);
          }
        }}
        onPointerCancel={() => {
          setDragging(false);
          pausedRef.current = false;
          suppressClickRef.current = false;
        }}
        sx={{
          display: "flex",
          gap: 1.5,
          overflowX: "auto",
          overflowY: "hidden",
          py: 0.5, // evita corte visual no topo/borda
          mx: { xs: -0.5, sm: 0 },
          px: { xs: 0.5, sm: 0 },
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {departamentos.map((d, idx) => {
          const selected = value === d && idx === activeIndex;
          return (
            <Card
              key={d}
              ref={(el: HTMLDivElement | null) => {
                cardRefs.current[idx] = el;
              }}
              variant="outlined"
              sx={{
                flex: "0 0 auto",
                width: { xs: 200, sm: 220 },
                borderColor: selected ? "primary.main" : "divider",
                borderWidth: selected ? 2 : 1,
                bgcolor: selected ? "action.selected" : "background.paper",
                boxShadow: selected ? 2 : 0,
                transition: "border-color 0.2s, box-shadow 0.2s, background-color 0.2s",
              }}
            >
              <CardActionArea
                onClick={() => {
                  if (suppressClickRef.current) return;
                  onChange(departamentos[idx]);
                }}
                selected={selected}
                sx={{ alignItems: "stretch", height: "100%" }}
              >
                <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Box
                      sx={{
                        color: selected ? "primary.main" : "text.secondary",
                        display: "flex",
                        mt: 0.25,
                      }}
                      aria-hidden
                    >
                      <FileEdit style={{ width: 20, height: 20 }} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                        {d}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
