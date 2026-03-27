-- Dashboard agregado via RPC para reduzir processamento em memória no backend.
create or replace function public.pdc_dashboard_stats(
  p_auth_user_id uuid,
  p_date_from date default null,
  p_date_to date default null
)
returns jsonb
language sql
stable
as $$
with user_dept as (
  select upper(trim(u.departamento)) as dept
  from public."PDC_users" u
  where u.auth_user_id = p_auth_user_id
  limit 1
),
base as (
  select
    t.id,
    t.status,
    t.area_destino,
    t.created_at::date as created_date,
    t.closed_at::date as closed_date,
    t.solicitante_id,
    su.nome as solicitante_nome,
    su.departamento as solicitante_departamento
  from public."PDC_tickets" t
  left join public."PDC_users" su on su.id = t.solicitante_id
  join user_dept ud on upper(trim(coalesce(t.area_destino, ''))) = ud.dept
  where (
    p_date_from is not null and p_date_to is not null and t.created_at::date between p_date_from and p_date_to
  ) or (
    (p_date_from is null or p_date_to is null) and t.created_at::date >= (current_date - 120)
  )
),
base_setor as (
  select
    b.*,
    case
      when upper(trim(coalesce(b.solicitante_departamento, b.area_destino, ''))) in (
        'ALMOXARIFADO','ENGENHARIA','EXPEDIÇÃO','GESTÃO INDUSTRIAL','MARCENARIA',
        'MANUTENÇÃO','NOVOS PRODUTOS','PCP','QUALIDADE','SEG. DO TRABALHO',
        'SERRALHERIA','TAPEÇARIA'
      ) then 'Industrial'
      else 'Administrativo'
    end as setor_dashboard
  from base b
),
day_series as (
  select d::date as dia
  from generate_series(
    coalesce(p_date_from, current_date - 6),
    coalesce(p_date_to, current_date),
    interval '1 day'
  ) d
),
month_raw as (
  select date_trunc('month', created_date::timestamp)::date as ym from base_setor
  union
  select date_trunc('month', closed_date::timestamp)::date as ym
  from base_setor
  where status = 'Concluído' and closed_date is not null
),
month_bounds as (
  select min(ym) as ym_min, max(ym) as ym_max from month_raw
),
month_series as (
  select m::date as ym
  from month_bounds,
  generate_series(
    coalesce(ym_min, date_trunc('month', current_date)::date),
    coalesce(ym_max, date_trunc('month', current_date)::date),
    interval '1 month'
  ) m
),
stats as (
  select
    count(*)::int as total,
    count(*) filter (where status = 'Aberto')::int as abertos,
    count(*) filter (where status = 'Em Andamento')::int as em_andamento,
    count(*) filter (where status = 'Pausado')::int as pausados,
    count(*) filter (where status = 'Concluído')::int as concluidos
  from base_setor
),
por_departamento as (
  select coalesce(nullif(trim(coalesce(solicitante_departamento, area_destino)), ''), '(sem área)') as area, count(*)::int as count
  from base_setor
  group by 1
  order by count desc
),
por_setor as (
  select setor_dashboard as setor, count(*)::int as count
  from base_setor
  group by 1
  order by count desc
),
top_solicitantes as (
  select
    solicitante_id::text as usuario_id,
    coalesce(nullif(trim(solicitante_nome), ''), 'Usuário') as nome,
    count(*)::int as count,
    coalesce(solicitante_departamento, '') as departamento_origem
  from base_setor
  where solicitante_id is not null
  group by solicitante_id, solicitante_nome, solicitante_departamento
  order by count desc
  limit 25
),
por_dia_geral as (
  select
    ds.dia,
    count(*) filter (
      where bs.created_date <= ds.dia
        and (bs.status <> 'Concluído' or bs.closed_date is null or bs.closed_date > ds.dia)
    )::int as abertos,
    count(*) filter (where bs.status = 'Concluído' and bs.closed_date = ds.dia)::int as fechados,
    count(*) filter (where bs.status = 'Pausado' and bs.created_date <= ds.dia)::int as pausados
  from day_series ds
  left join base_setor bs on true
  group by ds.dia
  order by ds.dia
),
por_dia_industria as (
  select
    ds.dia,
    count(*) filter (
      where bs.setor_dashboard = 'Industrial'
        and bs.created_date <= ds.dia
        and (bs.status <> 'Concluído' or bs.closed_date is null or bs.closed_date > ds.dia)
    )::int as abertos,
    count(*) filter (
      where bs.setor_dashboard = 'Industrial'
        and bs.status = 'Concluído'
        and bs.closed_date = ds.dia
    )::int as fechados,
    count(*) filter (
      where bs.setor_dashboard = 'Industrial'
        and bs.status = 'Pausado'
        and bs.created_date <= ds.dia
    )::int as pausados
  from day_series ds
  left join base_setor bs on true
  group by ds.dia
  order by ds.dia
),
por_dia_administrativo as (
  select
    ds.dia,
    count(*) filter (
      where bs.setor_dashboard = 'Administrativo'
        and bs.created_date <= ds.dia
        and (bs.status <> 'Concluído' or bs.closed_date is null or bs.closed_date > ds.dia)
    )::int as abertos,
    count(*) filter (
      where bs.setor_dashboard = 'Administrativo'
        and bs.status = 'Concluído'
        and bs.closed_date = ds.dia
    )::int as fechados,
    count(*) filter (
      where bs.setor_dashboard = 'Administrativo'
        and bs.status = 'Pausado'
        and bs.created_date <= ds.dia
    )::int as pausados
  from day_series ds
  left join base_setor bs on true
  group by ds.dia
  order by ds.dia
),
por_mes_geral as (
  select
    ms.ym,
    count(*) filter (
      where bs.created_date <= ((ms.ym + interval '1 month - 1 day')::date)
        and (bs.status <> 'Concluído' or bs.closed_date is null or bs.closed_date > ((ms.ym + interval '1 month - 1 day')::date))
    )::int as abertos,
    count(*) filter (
      where bs.status = 'Concluído'
        and bs.closed_date is not null
        and date_trunc('month', bs.closed_date::timestamp)::date = ms.ym
    )::int as fechados,
    count(*) filter (
      where bs.status = 'Pausado'
        and bs.created_date <= ((ms.ym + interval '1 month - 1 day')::date)
    )::int as pausados
  from month_series ms
  left join base_setor bs on true
  group by ms.ym
  order by ms.ym
),
por_mes_industria as (
  select
    ms.ym,
    count(*) filter (
      where bs.setor_dashboard = 'Industrial'
        and bs.created_date <= ((ms.ym + interval '1 month - 1 day')::date)
        and (bs.status <> 'Concluído' or bs.closed_date is null or bs.closed_date > ((ms.ym + interval '1 month - 1 day')::date))
    )::int as abertos,
    count(*) filter (
      where bs.setor_dashboard = 'Industrial'
        and bs.status = 'Concluído'
        and bs.closed_date is not null
        and date_trunc('month', bs.closed_date::timestamp)::date = ms.ym
    )::int as fechados,
    count(*) filter (
      where bs.setor_dashboard = 'Industrial'
        and bs.status = 'Pausado'
        and bs.created_date <= ((ms.ym + interval '1 month - 1 day')::date)
    )::int as pausados
  from month_series ms
  left join base_setor bs on true
  group by ms.ym
  order by ms.ym
),
por_mes_administrativo as (
  select
    ms.ym,
    count(*) filter (
      where bs.setor_dashboard = 'Administrativo'
        and bs.created_date <= ((ms.ym + interval '1 month - 1 day')::date)
        and (bs.status <> 'Concluído' or bs.closed_date is null or bs.closed_date > ((ms.ym + interval '1 month - 1 day')::date))
    )::int as abertos,
    count(*) filter (
      where bs.setor_dashboard = 'Administrativo'
        and bs.status = 'Concluído'
        and bs.closed_date is not null
        and date_trunc('month', bs.closed_date::timestamp)::date = ms.ym
    )::int as fechados,
    count(*) filter (
      where bs.setor_dashboard = 'Administrativo'
        and bs.status = 'Pausado'
        and bs.created_date <= ((ms.ym + interval '1 month - 1 day')::date)
    )::int as pausados
  from month_series ms
  left join base_setor bs on true
  group by ms.ym
  order by ms.ym
)
select jsonb_build_object(
  'total', coalesce((select total from stats), 0),
  'abertos', coalesce((select abertos from stats), 0),
  'em_andamento', coalesce((select em_andamento from stats), 0),
  'pausados', coalesce((select pausados from stats), 0),
  'concluidos', coalesce((select concluidos from stats), 0),
  'por_departamento', coalesce((select jsonb_agg(jsonb_build_object('area', area, 'count', count)) from por_departamento), '[]'::jsonb),
  'por_setor', coalesce((select jsonb_agg(jsonb_build_object('setor', setor, 'count', count)) from por_setor), '[]'::jsonb),
  'top_solicitantes', coalesce((select jsonb_agg(jsonb_build_object('usuario_id', usuario_id, 'nome', nome, 'count', count, 'departamento_origem', departamento_origem)) from top_solicitantes), '[]'::jsonb),
  'por_dia', coalesce((select jsonb_agg(jsonb_build_object('dateKey', to_char(dia, 'YYYY-MM-DD'), 'date', to_char(dia, 'DD/MM/YY'), 'abertos', abertos, 'fechados', fechados, 'pausados', pausados) order by dia) from por_dia_geral), '[]'::jsonb),
  'por_dia_industria', coalesce((select jsonb_agg(jsonb_build_object('dateKey', to_char(dia, 'YYYY-MM-DD'), 'date', to_char(dia, 'DD/MM/YY'), 'abertos', abertos, 'fechados', fechados, 'pausados', pausados) order by dia) from por_dia_industria), '[]'::jsonb),
  'por_dia_administrativo', coalesce((select jsonb_agg(jsonb_build_object('dateKey', to_char(dia, 'YYYY-MM-DD'), 'date', to_char(dia, 'DD/MM/YY'), 'abertos', abertos, 'fechados', fechados, 'pausados', pausados) order by dia) from por_dia_administrativo), '[]'::jsonb),
  'por_mes_geral', coalesce((select jsonb_agg(jsonb_build_object('mesKey', to_char(ym, 'YYYY-MM'), 'mes', to_char(ym, 'MM. Mon YYYY'), 'abertos', abertos, 'fechados', fechados, 'pausados', pausados) order by ym) from por_mes_geral), '[]'::jsonb),
  'por_mes_industria', coalesce((select jsonb_agg(jsonb_build_object('mesKey', to_char(ym, 'YYYY-MM'), 'mes', to_char(ym, 'MM. Mon YYYY'), 'abertos', abertos, 'fechados', fechados, 'pausados', pausados) order by ym) from por_mes_industria), '[]'::jsonb),
  'por_mes_administrativo', coalesce((select jsonb_agg(jsonb_build_object('mesKey', to_char(ym, 'YYYY-MM'), 'mes', to_char(ym, 'MM. Mon YYYY'), 'abertos', abertos, 'fechados', fechados, 'pausados', pausados) order by ym) from por_mes_administrativo), '[]'::jsonb)
);
$$;
