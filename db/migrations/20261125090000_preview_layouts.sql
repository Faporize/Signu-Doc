-- The Preview tab: where a sender places fields on a sample document and
-- tries signing it, to see what their clients see. Nothing here is a real
-- envelope, and nothing is ever sent. Each sender keeps one layout, stored
-- whole as JSON because it is only read and written together.
--   fields: placed fields, as on an envelope, all for the sample signer

create table if not exists public.preview_layouts (
  user_id text primary key references public."user"(id) on delete cascade,
  fields jsonb not null default '[]'::jsonb,
  revision integer not null default 0 check (revision >= 0),
  updated_at bigint not null default (extract(epoch from now())::bigint),
  constraint preview_layouts_fields_check check (jsonb_typeof(fields) = 'array')
);
