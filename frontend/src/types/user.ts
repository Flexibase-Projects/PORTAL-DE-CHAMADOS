export interface Role {
  id: string;
  nome: string;
  descricao: string;
  nivel: number;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  setor: string;
  departamento: string;
  ramal?: string;
  role_id: string;
  role?: Role;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
