# Ghost Writing Product Operations

Ghost is the standalone writing/blog product for personalSite. It should run on an independent subdomain such as `blog.yorick.dev`; personalSite links to it instead of maintaining a custom writing workbench.

## Architecture

```txt
Internet
  -> blog.yorick.dev
  -> Caddy or Nginx HTTPS reverse proxy
  -> 127.0.0.1:2368
  -> Ghost container
  -> MySQL container
```

Ghost is intentionally separate from the Next.js personalSite app.

## First deployment

1. Point DNS for `blog.yorick.dev` to the server.
2. Copy `.env.example` to `.env`.
3. Replace every password and SMTP value in `.env`.
4. Start Ghost:

```bash
docker compose up -d
```

5. Check container health:

```bash
docker compose ps
docker compose logs --tail=100 ghost
```

6. Configure the reverse proxy using `Caddyfile.example` or equivalent Nginx config.
7. Open `https://blog.yorick.dev/ghost` and create the owner account.
8. Configure Ghost site title, timezone, publication language, design, and navigation.

## Required production settings

- `GHOST_URL` must be the final HTTPS URL, for example `https://blog.yorick.dev`.
- SMTP must be configured before enabling member emails or newsletters.
- Ghost content lives in the `personal_ghost_content` Docker volume.
- MySQL data lives in the `personal_ghost_mysql` Docker volume.
- Back up both volumes; a database dump alone is not enough because images live in Ghost content.

## Visibility model

- Public blog posts: publish normally in Ghost.
- Drafts/private notes: keep as Ghost drafts and do not publish.
- Scheduled posts: use Ghost scheduling.
- Members-only posts: use Ghost members only when the content is meant for authenticated readers, not as a private diary vault.

Ghost is a publishing product, not an encrypted private diary. Truly private notes should remain unpublished drafts or live in a separate private notes system.

## Backups

Run:

```bash
infra/ghost/scripts/backup.sh
```

The script creates:

```txt
infra/ghost/backups/db/ghost-<timestamp>.sql
infra/ghost/backups/content/ghost-content-<timestamp>.tgz
```

Recommended production schedule:

- Daily database dump.
- Daily content volume archive.
- Keep at least 7 daily backups and 4 weekly backups.
- Copy backups off-server to object storage or another machine.

## Restore drill

Stop Ghost before restoring:

```bash
docker compose down
docker compose up -d mysql
```

Restore the database dump:

```bash
docker compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < backups/db/ghost-YYYYMMDDTHHMMSSZ.sql
```

Restore content into the Docker volume:

```bash
docker run --rm \
  -v personal_ghost_content:/content \
  -v "$PWD/backups/content:/backup:ro" \
  alpine:3.20 \
  sh -c 'rm -rf /content/* && tar -xzf /backup/ghost-content-YYYYMMDDTHHMMSSZ.tgz -C /content'
```

Start Ghost again:

```bash
docker compose up -d
```

## Upgrade procedure

1. Read the Ghost release notes for breaking changes.
2. Run `infra/ghost/scripts/backup.sh`.
3. Pull images:

```bash
docker compose pull
```

4. Recreate containers:

```bash
docker compose up -d
```

5. Verify:

```bash
docker compose ps
docker compose logs --tail=100 ghost
```

6. Open `/ghost` and publish a test draft only if the admin is healthy.

## Acceptance checklist

- `https://blog.yorick.dev` loads over HTTPS.
- `https://blog.yorick.dev/ghost` loads the admin UI.
- Owner account can log in.
- A draft can be created and saved.
- A post can be published.
- The published post is visible publicly.
- Uploaded image renders in the published post.
- SMTP test email succeeds if newsletters/members are enabled.
- `infra/ghost/scripts/backup.sh` creates both database and content backups.
