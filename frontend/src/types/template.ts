export interface TemplateField {
  id: string;
  type: string;
  key: string;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: string | null;
  options: string[];
  size?: string;
  order: number;
  rows?: number;
}

export interface Template {
  id: string;
  departamento: string;
  fields: TemplateField[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
}
