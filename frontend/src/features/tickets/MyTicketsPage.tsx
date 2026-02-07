import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search } from "lucide-react";
import { ticketService } from "@/services/ticketService";
import { TicketCard } from "./components/TicketCard";
import type { Ticket } from "@/types/ticket";

export function MyTicketsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [enviados, setEnviados] = useState<Ticket[]>([]);
  const [recebidos, setRecebidos] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!nome?.trim()) {
      setError("Por favor, insira seu nome");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await ticketService.getByName(nome.trim());
      if (response.success) {
        setEnviados(response.enviados || []);
        setRecebidos(response.recebidos || []);
        setSearched(true);
      }
    } catch {
      setError("Erro ao buscar chamados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket: Ticket) => {
    navigate("/painel-administrativo", { state: { ticketId: ticket.id } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Chamados</h1>
        <p className="text-muted-foreground">
          Digite seu nome para visualizar seus chamados enviados e recebidos.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading || !nome?.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {!loading && "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {searched && (enviados.length > 0 || recebidos.length > 0) ? (
        <Tabs defaultValue="enviados">
          <TabsList>
            <TabsTrigger value="enviados">
              Enviados ({enviados.length})
            </TabsTrigger>
            <TabsTrigger value="recebidos">
              Recebidos ({recebidos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enviados" className="mt-4">
            {enviados.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Você não possui chamados enviados.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {enviados.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onView={handleViewTicket}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recebidos" className="mt-4">
            {recebidos.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Você não possui chamados recebidos.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {recebidos.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onView={handleViewTicket}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        searched &&
        !loading && (
          <Alert>
            <AlertDescription>
              Nenhum chamado encontrado para este nome.
            </AlertDescription>
          </Alert>
        )
      )}
    </div>
  );
}
