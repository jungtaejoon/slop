-- Let a post carry up to 400 KB of code (was 200 KB): bigger single-file games such as Slopfall v5 need it.
alter table public.posts drop constraint posts_code_check;
alter table public.posts add constraint posts_code_check check (octet_length(code) <= 409600);
