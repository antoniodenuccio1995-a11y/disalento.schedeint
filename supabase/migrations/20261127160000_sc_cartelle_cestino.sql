-- Archivio con cartelle e cestino.
-- Ogni scheda può stare in una cartella (sc_schede.cartella) dell'archivio a cui appartiene.
-- Le cartelle vuote restano in sc_cartelle. Eliminare una scheda la mette nel cestino (sc_schede.eliminata):
-- il link smette di funzionare, la scheda si può ripristinare e dopo 30 giorni si cancella da sola.

alter table public.sc_schede add column if not exists cartella text check (cartella is null or length(cartella) between 1 and 60);
alter table public.sc_schede add column if not exists eliminata timestamptz;

create table if not exists public.sc_cartelle (
  archivio text not null,
  nome     text not null check (length(nome) between 1 and 60),
  creata   timestamptz not null default now(),
  primary key (archivio, nome)
);
comment on table public.sc_cartelle is 'Cartelle dell''archivio delle schede (anche vuote). Accesso solo dalle funzioni sc_cartella_*.';
alter table public.sc_cartelle enable row level security;

-- nome di cartella pulito: spazi tolti, al massimo 60 caratteri, vuoto = nessuna cartella
create or replace function public.sc_nome_cartella(p_nome text)
returns text
language sql immutable set search_path = ''
as $$
  select nullif(left(regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g'), 60), '');
$$;
revoke all on function public.sc_nome_cartella(text) from public;

-- le schede nel cestino non si leggono più dal link
create or replace function public.sc_leggi(p_id uuid)
returns table (dati jsonb, versione integer, aggiornata timestamptz)
language sql stable security definer set search_path = ''
as $$
  select s.dati, s.versione, s.aggiornata from public.sc_schede s where s.id = p_id and s.eliminata is null;
$$;

create or replace function public.sc_versione(p_id uuid)
returns integer
language sql stable security definer set search_path = ''
as $$
  select s.versione from public.sc_schede s where s.id = p_id and s.eliminata is null;
$$;

create or replace function public.sc_salva(p_id uuid, p_chiave text, p_dati jsonb, p_versione integer default null, p_codice text default null)
returns integer
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_ver integer;
begin
  if p_dati is null or jsonb_typeof(p_dati) <> 'object' then
    raise exception 'Dati della scheda non validi.' using errcode = '22023';
  end if;
  select s.versione into v_ver from public.sc_schede s where s.id = p_id and s.eliminata is null for update;
  if not found then
    raise exception 'Scheda non trovata.' using errcode = 'P0002';
  end if;
  if not public.sc_verifica(p_id, p_chiave, p_codice) then
    raise exception 'Chiave di modifica non valida.' using errcode = '42501';
  end if;
  if p_versione is not null and p_versione <> v_ver then
    raise exception 'La scheda è stata modificata da un altro dispositivo.' using errcode = '40001';
  end if;
  update public.sc_schede s set dati = p_dati, versione = v_ver + 1, aggiornata = now() where s.id = p_id;
  return v_ver + 1;
end;
$$;

-- elenco dell'archivio, con cartella e data di eliminazione (le schede nel cestino compaiono con eliminata valorizzata)
drop function if exists public.sc_elenco(text);
create or replace function public.sc_elenco(p_codice text)
returns table (id uuid, nome text, titolo text, destinatario text, creata timestamptz, aggiornata timestamptz, cartella text, eliminata timestamptz)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.dati->>'nome', s.dati->>'titolo', s.dati->>'destinatario', s.creata, s.aggiornata, s.cartella, s.eliminata
  from public.sc_schede s
  where public.sc_impronta(p_codice) is not null and s.archivio = public.sc_impronta(p_codice)
  order by s.aggiornata desc
  limit 1000;
$$;

-- cartelle dell'archivio con il numero di schede (non eliminate) in ognuna
create or replace function public.sc_cartelle_elenco(p_codice text)
returns table (nome text, schede integer)
language sql stable security definer set search_path = ''
as $$
  with a as (select public.sc_impronta(p_codice) as h)
  select n.nome,
         (select count(*)::integer from public.sc_schede s, a
           where s.archivio = a.h and s.cartella = n.nome and s.eliminata is null)
  from (
    select c.nome from public.sc_cartelle c, a where a.h is not null and c.archivio = a.h
    union
    select s.cartella from public.sc_schede s, a where a.h is not null and s.archivio = a.h and s.cartella is not null
  ) n
  order by lower(n.nome);
$$;

create or replace function public.sc_cartella_crea(p_codice text, p_nome text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_h text := public.sc_impronta(p_codice);
  v_nome text := public.sc_nome_cartella(p_nome);
begin
  if v_h is null then
    raise exception 'Codice dell’archivio non valido.' using errcode = '42501';
  end if;
  if v_nome is null then
    raise exception 'Scrivi il nome della cartella.' using errcode = '22023';
  end if;
  if (select count(*) from public.sc_cartelle c where c.archivio = v_h) >= 200 then
    raise exception 'Troppe cartelle in questo archivio.' using errcode = '53400';
  end if;
  insert into public.sc_cartelle (archivio, nome) values (v_h, v_nome) on conflict do nothing;
  return v_nome;
end;
$$;

-- rinomina (se il nuovo nome esiste già, le due cartelle si uniscono)
create or replace function public.sc_cartella_rinomina(p_codice text, p_vecchio text, p_nuovo text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_h text := public.sc_impronta(p_codice);
  v_nuovo text := public.sc_nome_cartella(p_nuovo);
begin
  if v_h is null then
    raise exception 'Codice dell’archivio non valido.' using errcode = '42501';
  end if;
  if v_nuovo is null then
    raise exception 'Scrivi il nome della cartella.' using errcode = '22023';
  end if;
  insert into public.sc_cartelle (archivio, nome) values (v_h, v_nuovo) on conflict do nothing;
  update public.sc_schede s set cartella = v_nuovo where s.archivio = v_h and s.cartella = p_vecchio;
  if p_vecchio is distinct from v_nuovo then
    delete from public.sc_cartelle c where c.archivio = v_h and c.nome = p_vecchio;
  end if;
  return v_nuovo;
end;
$$;

-- elimina la cartella: le schede restano, senza cartella
create or replace function public.sc_cartella_elimina(p_codice text, p_nome text)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_h text := public.sc_impronta(p_codice);
begin
  if v_h is null then
    raise exception 'Codice dell’archivio non valido.' using errcode = '42501';
  end if;
  update public.sc_schede s set cartella = null where s.archivio = v_h and s.cartella = p_nome;
  delete from public.sc_cartelle c where c.archivio = v_h and c.nome = p_nome;
  return true;
end;
$$;

-- sposta una scheda dell'archivio in una cartella (vuoto = senza cartella)
create or replace function public.sc_sposta(p_id uuid, p_codice text, p_cartella text)
returns text
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_h text := public.sc_impronta(p_codice);
  v_nome text := public.sc_nome_cartella(p_cartella);
begin
  if v_h is null or not exists (select 1 from public.sc_schede s where s.id = p_id and s.archivio = v_h) then
    raise exception 'Questa scheda non è nel tuo archivio.' using errcode = '42501';
  end if;
  if v_nome is not null then
    insert into public.sc_cartelle (archivio, nome) values (v_h, v_nome) on conflict do nothing;
  end if;
  update public.sc_schede s set cartella = v_nome where s.id = p_id;
  return v_nome;
end;
$$;

-- nel cestino (serve il codice dell'archivio o la chiave della scheda); intanto svuota il cestino più vecchio di 30 giorni
create or replace function public.sc_elimina(p_id uuid, p_codice text default null, p_chiave text default null)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_h text := public.sc_impronta(p_codice);
begin
  if not public.sc_verifica(p_id, p_chiave, p_codice) then
    raise exception 'Non puoi eliminare questa scheda.' using errcode = '42501';
  end if;
  update public.sc_schede s set eliminata = now() where s.id = p_id and s.eliminata is null;
  if v_h is not null then
    delete from public.sc_schede s where s.archivio = v_h and s.eliminata < now() - interval '30 days';
  end if;
  return true;
end;
$$;

create or replace function public.sc_ripristina(p_id uuid, p_codice text)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_h text := public.sc_impronta(p_codice);
begin
  if v_h is null or not exists (select 1 from public.sc_schede s where s.id = p_id and s.archivio = v_h) then
    raise exception 'Questa scheda non è nel tuo archivio.' using errcode = '42501';
  end if;
  update public.sc_schede s set eliminata = null where s.id = p_id;
  return true;
end;
$$;

-- cancellazione definitiva: solo per le schede già nel cestino
create or replace function public.sc_elimina_def(p_id uuid, p_codice text)
returns boolean
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_h text := public.sc_impronta(p_codice);
begin
  if v_h is null or not exists (select 1 from public.sc_schede s where s.id = p_id and s.archivio = v_h and s.eliminata is not null) then
    raise exception 'Si eliminano per sempre solo le schede del tuo archivio già nel cestino.' using errcode = '42501';
  end if;
  delete from public.sc_schede s where s.id = p_id;
  return true;
end;
$$;

revoke all on function public.sc_leggi(uuid) from public;
revoke all on function public.sc_versione(uuid) from public;
revoke all on function public.sc_salva(uuid, text, jsonb, integer, text) from public;
revoke all on function public.sc_elenco(text) from public;
revoke all on function public.sc_cartelle_elenco(text) from public;
revoke all on function public.sc_cartella_crea(text, text) from public;
revoke all on function public.sc_cartella_rinomina(text, text, text) from public;
revoke all on function public.sc_cartella_elimina(text, text) from public;
revoke all on function public.sc_sposta(uuid, text, text) from public;
revoke all on function public.sc_elimina(uuid, text, text) from public;
revoke all on function public.sc_ripristina(uuid, text) from public;
revoke all on function public.sc_elimina_def(uuid, text) from public;
grant execute on function public.sc_leggi(uuid) to anon, authenticated;
grant execute on function public.sc_versione(uuid) to anon, authenticated;
grant execute on function public.sc_salva(uuid, text, jsonb, integer, text) to anon, authenticated;
grant execute on function public.sc_elenco(text) to anon, authenticated;
grant execute on function public.sc_cartelle_elenco(text) to anon, authenticated;
grant execute on function public.sc_cartella_crea(text, text) to anon, authenticated;
grant execute on function public.sc_cartella_rinomina(text, text, text) to anon, authenticated;
grant execute on function public.sc_cartella_elimina(text, text) to anon, authenticated;
grant execute on function public.sc_sposta(uuid, text, text) to anon, authenticated;
grant execute on function public.sc_elimina(uuid, text, text) to anon, authenticated;
grant execute on function public.sc_ripristina(uuid, text) to anon, authenticated;
grant execute on function public.sc_elimina_def(uuid, text) to anon, authenticated;
