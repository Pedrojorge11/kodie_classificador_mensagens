export type TicketStatus = "aberto" | "em_andamento" | "resolvido" | "fechado";

export interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
  criado_em: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario: User;
}

export interface Ticket {
  id: number;
  protocolo: string;
  user_id: number;
  canal: string;
  remetente: string | null;
  mensagem: string;
  categoria: string;
  prioridade: string;
  sentimento: string;
  resumo: string;
  acao_sugerida: string;
  confianca: number;
  setor_destino: string;
  fila_atendimento: string;
  status: TicketStatus;
  criado_em: string;
  atualizado_em: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface TicketCreatePayload {
  canal: string;
  mensagem: string;
}