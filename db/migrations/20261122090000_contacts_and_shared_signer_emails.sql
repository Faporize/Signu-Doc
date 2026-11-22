-- Saved contacts: people a sender sends to often, kept so their name and
-- email are chosen from a list instead of typed again.
--
-- One person may be saved under one email address more than once with
-- different names, the same way an envelope may have two signers on one
-- address.

create table if not exists public.contacts (
  id text primary key,
  user_id text not null references public."user"(id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  email text not null check (length(btrim(email)) between 3 and 320),
  created_at bigint not null default (extract(epoch from now())::bigint),
  updated_at bigint not null default (extract(epoch from now())::bigint)
);

create unique index if not exists idx_contacts_user_email_name
  on public.contacts (
    user_id,
    lower(btrim(email)),
    lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
  );

create index if not exists idx_contacts_user_name
  on public.contacts (user_id, lower(name), id);

-- Two signers of one envelope may share an email address when their names
-- differ. The same name and address twice is still refused: it is almost
-- always a mistake, and the sender would be asking one person to sign twice.
drop index if exists public.idx_signers_envelope_email;

create unique index if not exists idx_signers_envelope_email_name
  on public.signers (
    envelope_id,
    lower(email),
    lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))
  );
