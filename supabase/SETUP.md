# Supabase setup

LifeOS uses two migrations:

1. `migrations/20260907155430_0001_lifeos_core_schema.sql` creates the application tables and row-level security policies.
2. `migrations/20260911112000_0002_profile_avatars_storage.sql` creates the public `avatars` bucket and restricts writes to each user's own folder.

## Configure the app

Copy `.env.example` to `.env` and replace both values with the URL and anon/public key from **Supabase Dashboard -> Project Settings -> API**:

```bash
cp .env.example .env
```

Never put a `service_role` key in `.env`, browser code, or source control.

## Apply the schema

### Supabase CLI

Install and authenticate the Supabase CLI, then run from the project root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The project ref is the subdomain in `https://YOUR_PROJECT_REF.supabase.co`.

### SQL Editor

If the CLI is not available, open **Supabase Dashboard -> SQL Editor**, create a new query, paste the contents of both migration files in filename order, and run them. Run the avatar migration after the core schema migration.

## Verify profile pictures

After applying both migrations:

- **Storage -> Buckets** contains a public bucket named `avatars`.
- Its file size limit is 5 MB.
- Allowed types are JPEG, PNG, WebP, and GIF.
- Uploaded files are stored under `<user-id>/avatar.<extension>`.
- The app stores the resulting public URL in `profiles.avatar_url`.

Restart Vite after changing `.env`:

```bash
npm run dev
```
