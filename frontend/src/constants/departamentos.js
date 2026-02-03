export const SETORES = ['Administrativo', 'Industrial'];

export const DEPARTAMENTOS_POR_SETOR = {
  Administrativo: [
    'ASSESSORIA COMERCIAL',
    'ASSESSORIA PRIVADO',
    'CASAS DAS ATAS',
    'COMPRAS',
    'FINANCEIRO',
    'GESTÃO COMERCIAL',
    'LICITAÇÃO',
    'MAP',
    'MARKETING',
    'RECEPÇÃO',
    'REPRESENTANTES',
    'RH',
    'TI',
  ].sort(),
  Industrial: [
    'ALMOXARIFADO',
    'ENGENHARIA',
    'EXPEDIÇÃO',
    'GESTÃO INDUSTRIAL',
    'MARCENARIA',
    'MANUTENÇÃO',
    'NOVOS PRODUTOS',
    'PCP',
    'QUALIDADE',
    'RH',
    'SEG. DO TRABALHO',
    'SERRALHERIA',
    'TAPEÇARIA',
  ].sort(),
};

export function getAllDepartamentos() {
  const admin = DEPARTAMENTOS_POR_SETOR.Administrativo || [];
  const ind = DEPARTAMENTOS_POR_SETOR.Industrial || [];
  return [...new Set([...admin, ...ind])].sort();
}
