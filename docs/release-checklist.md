# Release Checklist

- Auth: endpoints sensíveis exigem Bearer token válido (`401` sem token, `403` sem permissão).
- Permissões: validar fluxo por recurso (tickets/templates/users) com conta sem acesso e com acesso.
- Migrations: aplicar migrations pendentes antes do deploy e confirmar função `pdc_dashboard_stats`.
- CI: `npm run ci` deve passar sem exceções.
- Build: validar `npm run build` e smoke test de login, dashboard e atualização de ticket.
- Rollback: confirmar versão anterior disponível e plano de rollback em caso de erro pós-deploy.
