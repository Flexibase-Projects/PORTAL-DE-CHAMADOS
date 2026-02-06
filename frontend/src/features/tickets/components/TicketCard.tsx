import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Building2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Ticket } from "@/types/ticket";

interface TicketCardProps {
  ticket: Ticket;
  onView?: (ticket: Ticket) => void;
  showActions?: boolean;
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

export function TicketCard({
  ticket,
  onView,
  showActions = true,
}: TicketCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate">{ticket.assunto}</h3>
            <p className="text-xs text-muted-foreground font-mono">
              {ticket.numero_protocolo}
            </p>
          </div>
          <Badge variant={statusVariant(ticket.status)} className="shrink-0">
            {ticket.status}
          </Badge>
        </div>

        <div className="space-y-1 mb-3">
          {ticket.solicitante_email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{ticket.solicitante_email}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <span>
              {ticket.area_destino} - {ticket.setor}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(ticket.created_at)}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {ticket.mensagem}
        </p>

        {ticket.respostas && ticket.respostas.length > 0 && (
          <p className="text-xs text-primary mb-3">
            {ticket.respostas.length} resposta(s)
          </p>
        )}

        {showActions && onView && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onView(ticket)}
          >
            Ver Detalhes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
