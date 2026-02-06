import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Reply, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { TicketCard } from "@/features/tickets/components/TicketCard";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";

interface Props {
  initialTicketId?: string;
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Concluído":
      return "default";
    case "Em Andamento":
      return "secondary";
    default:
      return "destructive";
  }
}

export function TicketManagement({ initialTicketId }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (initialTicketId && tickets.length > 0) {
      const found = tickets.find((t) => t.id === initialTicketId);
      if (found) setSelected(found);
    }
  }, [initialTicketId, tickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketService.getReceived();
      if (res.success) setTickets(res.tickets || []);
    } catch {
      setError("Erro ao carregar chamados.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!responseText.trim() || !selected) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await ticketService.addResponse(selected.id, {
        mensagem: responseText,
        autor_id: "admin",
      });
      if (res.success) {
        setSuccess("Resposta enviada!");
        setDialogOpen(false);
        setResponseText("");
        await loadTickets();
        if (selected) {
          const detail = await ticketService.getById(selected.id);
          if (detail.success) setSelected(detail.ticket);
        }
      }
    } catch {
      setError("Erro ao enviar resposta.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConclude = async () => {
    if (!selected || !confirm("Tem certeza que deseja concluir este chamado?"))
      return;
    setActionLoading(true);
    try {
      const res = await ticketService.updateStatus(selected.id, "Concluído");
      if (res.success) {
        setSuccess("Chamado concluído!");
        setSelected(null);
        await loadTickets();
      }
    } catch {
      setError("Erro ao concluir chamado.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* List */}
        <div className={selected ? "lg:col-span-4" : "lg:col-span-12"}>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-3 pr-2">
              <p className="text-sm font-medium text-muted-foreground">
                Chamados Recebidos ({tickets.length})
              </p>
              {tickets.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nenhum chamado recebido no momento.
                  </AlertDescription>
                </Alert>
              ) : (
                tickets.map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    onView={() => {
                      setSelected(t);
                      setError("");
                      setSuccess("");
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Detail */}
        {selected && (
          <div className="lg:col-span-8">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selected.assunto}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selected.numero_protocolo}
                    </p>
                  </div>
                  <Badge variant={statusVariant(selected.status)}>
                    {selected.status}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Solicitante</span>
                    <p>{selected.solicitante_nome || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email</span>
                    <p>{selected.solicitante_email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Setor</span>
                    <p>{selected.setor}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Departamento</span>
                    <p>{selected.area_destino}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data</span>
                    <p>{formatDate(selected.created_at)}</p>
                  </div>
                  {selected.prioridade && (
                    <div>
                      <span className="text-muted-foreground">Prioridade</span>
                      <p>{selected.prioridade}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-semibold mb-2">Mensagem</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selected.mensagem}
                  </p>
                </div>

                {selected.respostas && selected.respostas.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        Respostas ({selected.respostas.length})
                      </p>
                      <div className="space-y-2">
                        {selected.respostas.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-lg border bg-muted/50 p-3"
                          >
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-semibold">
                                {r.autor_nome || "Administrador"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(r.created_at)}
                              </span>
                            </div>
                            <p className="text-sm">{r.mensagem}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setDialogOpen(true)}
                    disabled={
                      actionLoading || selected.status === "Concluído"
                    }
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleConclude}
                    disabled={
                      actionLoading || selected.status === "Concluído"
                    }
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Concluir
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelected(null)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Chamado</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={6}
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Digite sua resposta..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendResponse}
              disabled={actionLoading || !responseText.trim()}
            >
              {actionLoading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
