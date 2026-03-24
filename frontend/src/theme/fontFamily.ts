/**
 * Fonte principal do app. Century Gothic vem com Windows; em outros SOs usamos fallbacks geométricos próximos.
 * Sincronize com `src/index.css` e `index.html` (loader inicial) se alterar.
 */
export const APP_FONT_FAMILY =
  '"Century Gothic", CenturyGothic, "AppleGothic", "Trebuchet MS", "Arial Narrow", Arial, sans-serif';

/** Pilha sem Century Gothic: o `%` na principal pode aparecer “quebrado”; use só no símbolo de porcentagem. */
export const FONT_STACK_PERCENT_SYMBOL =
  'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
