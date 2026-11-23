import { useState, type FormEvent } from "react";
import { api } from "../services/api";
import type { User } from "../types/helpdesk";

interface AuthFormProps {
  onAuthSuccess: (token: string, user: User) => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        await api.register({
          nome: nome.trim(),
          email: email.trim(),
          senha,
        });
      }

      const authData = await api.login({
        email: email.trim(),
        senha,
      });

      onAuthSuccess(authData.access_token, authData.usuario);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a autenticação.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-1" aria-hidden="true" />
      <div className="auth-glow auth-glow-2" aria-hidden="true" />

      <div className="auth-layout">
        <section className="auth-hero">
          <div className="auth-badge">
            <span className="auth-badge-dot" aria-hidden="true" />
            Powered by Google Gemini &amp; FastAPI
          </div>

          <div className="auth-logo-row">
            <div className="auth-logo-mark" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
              </svg>
            </div>
            <span className="auth-logo-name">Anubis Helpdesk</span>
          </div>

          <h1 className="auth-hero-title">
            Triagem inteligente de chamados com <span>IA em tempo real</span>
          </h1>

          <p className="auth-hero-subtitle">
            Classifique solicitações automaticamente por categoria, prioridade e
            sentimento, com geração imediata de protocolo e roteamento para a
            fila correta.
          </p>

          <ul className="auth-features">
            <li>
              <div className="auth-feature-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <strong>Classificação instantânea</strong>
                <span>
                  Resumo executivo, nível de confiança e ação sugerida pelo
                  Gemini.
                </span>
              </div>
            </li>

            <li>
              <div className="auth-feature-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <strong>Protocolo único (CHM)</strong>
                <span>
                  Acompanhamento de status, filtros e roteamento automático por
                  setor.
                </span>
              </div>
            </li>

            <li>
              <div className="auth-feature-icon" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <strong>Acesso seguro por JWT</strong>
                <span>
                  Credenciais protegidas com bcrypt e histórico persistente em
                  banco de dados.
                </span>
              </div>
            </li>
          </ul>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p>
              {mode === "login"
                ? "Entre com suas credenciais para acessar o painel de chamados."
                : "Cadastre-se em segundos para abrir e acompanhar protocolos."}
            </p>
          </div>

          <div className="auth-segmented" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`auth-segmented-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={`auth-segmented-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Criar conta
            </button>
          </div>

          {error && (
            <div className="alert alert-error auth-alert" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" && (
              <div className="auth-field">
                <label htmlFor="nome">Nome completo</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="nome"
                    className="auth-input"
                    type="text"
                    placeholder="Ex.: Tutankamon da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    minLength={2}
                    required
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email">E-mail</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="senha">Senha</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon" aria-hidden="true">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="senha"
                  className="auth-input auth-input-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder={
                    mode === "register" ? "Mínimo de 6 caracteres" : "Sua senha"
                  }
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  minLength={mode === "register" ? 6 : 1}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {mode === "register" && (
                <span className="auth-hint">
                  Use pelo menos 6 caracteres para proteger sua conta.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading && <span className="auth-spinner" aria-hidden="true" />}
              {loading
                ? "Processando..."
                : mode === "login"
                  ? "Entrar no sistema"
                  : "Cadastrar e entrar"}
            </button>
          </form>

          <footer className="auth-panel-footer">
            <span>Central de Chamados com IA</span>
            <span>•</span>
            <span>Autenticação JWT</span>
          </footer>
        </section>
      </div>
    </div>
  );
}