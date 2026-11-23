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
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div className="brand">
          <h1>Central de Chamados com IA</h1>
          <p>Triagem inteligente e acompanhamento por protocolo</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`tab-btn ${mode === "login" ? "active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`tab-btn ${mode === "register" ? "active" : ""}`}
            onClick={() => switchMode("register")}
          >
            Criar conta
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                className="input"
                type="text"
                placeholder="Ex.: Pedro Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                minLength={2}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              className="input"
              type="password"
              placeholder={
                mode === "register" ? "Mínimo de 6 caracteres" : "Sua senha"
              }
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={mode === "register" ? 6 : 1}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-full"
            disabled={loading}
          >
            {loading
              ? "Processando..."
              : mode === "login"
                ? "Entrar no sistema"
                : "Cadastrar e entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}