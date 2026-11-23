import { useEffect, useState, type FormEvent } from "react";
import { AuthForm } from "./components/AuthForm";
import { TicketCard } from "./components/TicketCard";
import { api } from "./services/api";
import type { Ticket, TicketStatus, User } from "./types/helpdesk";

const TOKEN_STORAGE_KEY = "helpdesk_access_token";

const CANAIS = [
  { value: "web", label: "Portal Web" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "chat", label: "Chat" },
  { value: "telefone", label: "Telefone" },
];

const CATEGORIAS = [
  { value: "", label: "Todas as categorias" },
  { value: "financeiro", label: "Financeiro" },
  { value: "suporte_tecnico", label: "Suporte Técnico" },
  { value: "comercial", label: "Comercial" },
  { value: "reclamacao", label: "Reclamação" },
  { value: "elogio", label: "Elogio" },
  { value: "outros", label: "Outros" },
];

export default function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState<boolean>(() =>
    Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)),
  );

  // Novo chamado
  const [canal, setCanal] = useState("web");
  const [mensagem, setMensagem] = useState("");
  const [creating, setCreating] = useState(false);

  // Lista e filtros
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoriaFilter, setCategoriaFilter] = useState("");
  const [protocoloBusca, setProtocoloBusca] = useState("");
  const [updatingProtocolo, setUpdatingProtocolo] = useState<string | null>(
    null,
  );

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token || user) {
      return;
    }

    let active = true;

    api
      .getMe(token)
      .then((me) => {
        if (!active) return;
        setUser(me);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [token, user]);

  useEffect(() => {
    if (!token || !user) return;

    let active = true;

    api
      .listTickets(token, {
        status: statusFilter || undefined,
        categoria: categoriaFilter || undefined,
      })
      .then((data) => {
        if (!active) return;
        setTickets(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar o histórico de chamados.",
        );
      })
      .finally(() => {
        if (active) setLoadingTickets(false);
      });

    return () => {
      active = false;
    };
  }, [token, user, statusFilter, categoriaFilter]);

  function handleAuthSuccess(newToken: string, loggedUser: User) {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
    setUser(loggedUser);
    setCheckingSession(false);
    setLoadingTickets(true);
    setError(null);
    setSuccess(null);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setTickets([]);
    setProtocoloBusca("");
    setStatusFilter("");
    setCategoriaFilter("");
    setError(null);
    setSuccess(null);
  }

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const novoChamado = await api.createTicket(token, {
        canal,
        mensagem: mensagem.trim(),
      });

      setTickets((prev) => [novoChamado, ...prev]);
      setMensagem("");
      setProtocoloBusca("");
      setSuccess(
        `Chamado aberto com sucesso! Protocolo ${novoChamado.protocolo} encaminhado para ${novoChamado.setor_destino}.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível abrir o chamado.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSearchProtocolo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const termo = protocoloBusca.trim();
    setError(null);
    setSuccess(null);
    setLoadingTickets(true);

    try {
      if (!termo) {
        const list = await api.listTickets(token, {
          status: statusFilter || undefined,
          categoria: categoriaFilter || undefined,
        });
        setTickets(list);
      } else {
        const ticket = await api.getTicketByProtocolo(token, termo);
        setTickets([ticket]);
      }
    } catch (err) {
      setTickets([]);
      setError(
        err instanceof Error ? err.message : "Protocolo não encontrado.",
      );
    } finally {
      setLoadingTickets(false);
    }
  }

  async function handleClearFilters() {
    if (!token) return;
    setProtocoloBusca("");
    setStatusFilter("");
    setCategoriaFilter("");
    setError(null);
    setLoadingTickets(true);

    try {
      const list = await api.listTickets(token);
      setTickets(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao recarregar chamados.",
      );
    } finally {
      setLoadingTickets(false);
    }
  }

  async function handleStatusChange(
    protocolo: string,
    nextStatus: TicketStatus,
  ) {
    if (!token) return;
    setUpdatingProtocolo(protocolo);
    setError(null);
    setSuccess(null);

    try {
      const updated = await api.updateTicketStatus(token, protocolo, nextStatus);
      setTickets((prev) =>
        prev.map((item) =>
          item.protocolo === updated.protocolo ? updated : item,
        ),
      );
      setSuccess(
        `Status do protocolo ${updated.protocolo} atualizado para "${updated.status}".`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar o status.",
      );
    } finally {
      setUpdatingProtocolo(null);
    }
  }

  if (checkingSession) {
    return (
      <div className="auth-wrapper">
        <div className="card">Validando sessão...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  const totalAbertos = tickets.filter((t) => t.status === "aberto").length;
  const totalEmAndamento = tickets.filter(
    (t) => t.status === "em_andamento",
  ).length;
  const totalConcluidos = tickets.filter(
    (t) => t.status === "resolvido" || t.status === "fechado",
  ).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <h1>Central de Chamados com IA</h1>
          <p>Classificação automática via Gemini e acompanhamento por protocolo</p>
        </div>

        <div className="user-box">
          <div className="user-info">
            <strong>{user.nome}</strong>
            <span>{user.email}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <section className="stats-grid" aria-label="Resumo dos chamados">
        <div className="stat-card">
          <span>Chamados exibidos</span>
          <strong>{tickets.length}</strong>
        </div>
        <div className="stat-card">
          <span>Abertos</span>
          <strong>{totalAbertos}</strong>
        </div>
        <div className="stat-card">
          <span>Em andamento</span>
          <strong>{totalEmAndamento}</strong>
        </div>
        <div className="stat-card">
          <span>Resolvidos / Fechados</span>
          <strong>{totalConcluidos}</strong>
        </div>
      </section>

      <main className="dashboard-grid">
        <section className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
            Abrir novo chamado
          </h2>

          <form onSubmit={handleCreateTicket}>
            <div className="form-group">
              <label htmlFor="canal">Canal de origem</label>
              <select
                id="canal"
                className="select"
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
              >
                {CANAIS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="mensagem">Descreva sua solicitação</label>
              <textarea
                id="mensagem"
                className="textarea"
                placeholder="Ex.: Não consigo emitir a segunda via da minha fatura e ela vence hoje..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                minLength={5}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-full"
              disabled={creating || mensagem.trim().length < 5}
            >
              {creating ? "Classificando com IA..." : "Enviar e gerar protocolo"}
            </button>
          </form>
        </section>

        <section>
          <form className="filters-bar" onSubmit={handleSearchProtocolo}>
            <input
              className="input"
              type="text"
              placeholder="Buscar por protocolo (ex.: CHM-20261123-0E37)"
              value={protocoloBusca}
              onChange={(e) => setProtocoloBusca(e.target.value)}
            />

            <select
              className="select"
              aria-label="Filtrar por status"
              value={statusFilter}
              onChange={(e) => {
                setLoadingTickets(true);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="em_andamento">Em andamento</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>

            <select
              className="select"
              aria-label="Filtrar por categoria"
              value={categoriaFilter}
              onChange={(e) => {
                setLoadingTickets(true);
                setCategoriaFilter(e.target.value);
              }}
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <button type="submit" className="btn">
              Buscar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearFilters}
            >
              Limpar
            </button>
          </form>

          {loadingTickets ? (
            <div className="card empty-state">Carregando chamados...</div>
          ) : tickets.length === 0 ? (
            <div className="card empty-state">
              Nenhum chamado encontrado. Envie uma mensagem ao lado para gerar
              seu primeiro protocolo.
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket.protocolo}
                  ticket={ticket}
                  updating={updatingProtocolo === ticket.protocolo}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}