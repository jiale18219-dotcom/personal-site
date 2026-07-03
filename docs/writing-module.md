# Writing Module

This personal-site writing module is a lightweight single-owner backend, not a CMS.

## Local development

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.
3. Start PostgreSQL.
4. Run `npm run db:migrate`.
5. Run `npm run db:seed`.
6. Run `npm run dev`.
7. Open `/admin/login`.

## Content rules

- `DRAFT`: admin only.
- `PUBLISHED + PUBLIC`: visible in `/writing`, readable by anyone, included in sitemap.
- `PUBLISHED + UNLISTED`: readable by direct slug, excluded from listing and sitemap, marked `noindex`.
- `PUBLISHED + PRIVATE`: admin only.
- `ARCHIVED`: admin only.

## Uploads

Image files are stored in `UPLOAD_DIR`. PostgreSQL stores file metadata and visibility. Back up both PostgreSQL and `UPLOAD_DIR`.

## Backup

Run a daily `pg_dump` for the database and archive `UPLOAD_DIR`. Keep at least 7 daily backups.

## Existing content

The existing static `src/content/thinking.ts` content remains static. Importing it into PostgreSQL is a separate migration step if the new module proves useful.
