import type { Ticket, TicketStatus } from "../types/helpdesk";

interface TicketCardProps {
  ticket: Ticket;
  updating: boolean;
  onStatusChange: (protocolo: string, status: TicketStatus) => void;
}

const STATUS_OPTIONS: Array<{ value: TicketStatus; label: string }> = [
  { value: "aberto", label: "Aberto" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "resolvido", label: "Resolvido" },
  { value: "fechado", label: "Fechado" },
];

function getPriorityBadgeClass(prioridade: string): string {
  const normalized = prioridade.toLowerCase();
  if (normalized === "alta" || normalized === "urgente") return "badge-alta";
  if (normalized === "media" || normalized === "média") return "badge-media";
  return "badge-baixa";
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function TicketCard({
  ticket,
  updating,
  onStatusChange,
}: TicketCardProps) {
  const confiancaPercent = Math.round(ticket.confianca * 100);

  return (
    <article className="ticket-card">
      <div className="ticket-header">
        <div>
          <span className="protocolo-code">{ticket.protocolo}</span>
          <span className="ticket-date">
            Aberto em {formatDate(ticket.criado_em)} • Canal: {ticket.canal}
          </span>
        </div>

        <select
          className="select"
          aria-label={`Status do chamado ${ticket.protocolo}`}
          value={ticket.status}
          disabled={updating}
          style={{ width: "auto", minWidth: "155px" }}
          onChange={(e) =>
            onStatusChange(ticket.protocolo, e.target.value as TicketStatus)
          }
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="badges-row">
        <span className={`badge ${getPriorityBadgeClass(ticket.prioridade)}`}>
          Prioridade: {ticket.prioridade}
        </span>
        <span className="badge badge-setor">{ticket.setor_destino}</span>
        <span className="badge badge-neutral">Categoria: {ticket.categoria}</span>
        <span className="badge badge-neutral">
          Sentimento: {ticket.sentimento}
        </span>
        <span className="badge badge-neutral">
          Confiança IA: {confiancaPercent}%
        </span>
      </div>

      <p className="ticket-message">{ticket.mensagem}</p>

      <div className="ai-box">
        <p>
          <strong>Resumo da IA:</strong> {ticket.resumo}
        </p>
        <p>
          <strong>Ação sugerida:</strong> {ticket.acao_sugerida}
        </p>
        <p>
          <strong>Fila de roteamento:</strong> {ticket.fila_atendimento}
        </p>
      </div>
    </article>
  );
}