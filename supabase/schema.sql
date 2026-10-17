-- Cole tudo no Supabase: SQL Editor > New query > Run
create table settings(
  id int primary key default 1 check (id=1),
  pix_key text default '', pix_name text default '', sinal numeric default 30,
  hours text[] default '{09:00,10:00,11:00,13:00,14:00,15:00,16:00,17:00}',
  closed_days int[] default '{0}', blocked date[] default '{}');
insert into settings(id) values(1);

create table services(
  id uuid primary key default gen_random_uuid(),
  name text not null, description text default '', price numeric not null,
  active boolean default true, sort int default 0);
insert into services(name,description,price,sort) values
 ('Esmaltação em gel','Mãos ou pés',70,1),('Manutenção','Alongamento existente',120,2),
 ('Alongamento em gel','Aplicação completa',180,3),('Blindagem','Reforço das unhas naturais',110,4),
 ('Pé e mão','Esmaltação completa',90,5),('Remoção','Remoção segura',40,6);

create table bookings(
  id uuid primary key default gen_random_uuid(),
  date date not null, time text not null,
  client_name text not null, phone text not null,
  service_id uuid references services(id),
  service_name text, price numeric, deposit numeric,
  status text default 'Aguardando sinal' check (status in ('Aguardando sinal','Agendado','Realizado','Cancelado')),
  created_at timestamptz default now());
-- impede dois clientes no mesmo horário
create unique index one_per_slot on bookings(date,time) where status<>'Cancelado';

-- o servidor define preço, sinal e status (o cliente não consegue alterar)
create function bk_fill() returns trigger language plpgsql security definer set search_path=public as $$
declare p numeric; n text; s numeric;
begin
  select price,name into p,n from services where id=new.service_id and active;
  if p is null then raise exception 'servico invalido'; end if;
  select sinal into s from settings where id=1;
  new.service_name:=n; new.price:=p; new.deposit:=round(p*s/100,2); new.status:='Aguardando sinal';
  return new;
end $$;
create trigger bk_fill_t before insert on bookings for each row execute function bk_fill();

-- horários ocupados (sem expor dados dos clientes)
create function taken_slots(d date) returns text[] language sql security definer set search_path=public as $$
  select coalesce(array_agg(time),'{}') from bookings where date=d and status<>'Cancelado' $$;
grant execute on function taken_slots(date) to anon,authenticated;

alter table settings enable row level security;
alter table services enable row level security;
alter table bookings enable row level security;
create policy "publico le" on settings for select using (true);
create policy "publico le" on services for select using (true);
create policy "admin" on settings for all to authenticated using (true) with check (true);
create policy "admin" on services for all to authenticated using (true) with check (true);
create policy "cliente agenda" on bookings for insert to anon,authenticated with check (true);
create policy "admin" on bookings for all to authenticated using (true) with check (true);
alter table settings
  add column whatsapp text default '',
  add column address text default '',
  add column maps_url text default '';

create table gallery(
  id uuid primary key default gen_random_uuid(),
  path text not null, url text not null,
  created_at timestamptz default now());
alter table gallery enable row level security;
create policy "publico le" on gallery for select using (true);
create policy "admin" on gallery for all to authenticated using (true) with check (true);

insert into storage.buckets(id,name,public) values('galeria','galeria',true) on conflict do nothing;
create policy "galeria leitura" on storage.objects for select using (bucket_id='galeria');
create policy "galeria envio" on storage.objects for insert to authenticated with check (bucket_id='galeria');
create policy "galeria exclusao" on storage.objects for delete to authenticated using (bucket_id='galeria');