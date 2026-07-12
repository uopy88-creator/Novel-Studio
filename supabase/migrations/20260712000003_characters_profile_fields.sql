-- Character profile fields for @mention autocomplete / cards
alter table public.characters add column if not exists nickname text not null default '';
alter table public.characters add column if not exists status text not null default '';
alter table public.characters add column if not exists intro text not null default '';
