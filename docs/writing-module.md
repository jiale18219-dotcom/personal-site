# Writing Module

The custom PostgreSQL/MDXEditor writing module is deprecated.

The selected writing product for personalSite is Ghost, running independently on a subdomain such as `https://blog.yorick.dev`.

## Current direction

- Ghost owns writing, editing, publishing, media, RSS, SEO, and the admin experience.
- personalSite remains the portfolio/homepage and links to Ghost.
- `/writing` redirects to Ghost.
- The old `/admin/posts` workbench should not receive further product investment.

## Ghost operations

See `infra/ghost/README.md` for deployment, backup, restore, and upgrade instructions.

## Decommission policy

Do not remove the old custom writing code until Ghost is confirmed working in production and the user approves cleanup.
