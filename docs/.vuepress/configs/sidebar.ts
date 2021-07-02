import type { SidebarConfig } from '@vuepress/theme-default'

export const en: SidebarConfig = {
  '/': [
    {
      isGroup: true,
      text: 'Guide',
      children: [
        '/guide/README.md',
        '/guide/drivers.md',
        '/guide/models.md',
        '/guide/queries.md',
        '/guide/placeholders.md',
        '/guide/relations.md',
        '/guide/transactions.md',
        '/guide/soft-deletes.md',
        '/guide/hooks.md',
        '/guide/fixtures.md',
        '/guide/migrations.md',
        '/guide/starter-kit.md',
        '/guide/tracing.md',
        '/guide/pg-migration.md',
      ],
    },
    {
      isGroup: true,
      text: 'PostgreSQL',
      children: [
        '/postgres/uuid.md',
        '/postgres/installing-zfs-ubuntu.md',
        '/postgres/zfs-aws-ebs.md',
        '/postgres/zero-downtime-migrations.md',
      ],
    },
  ],
}
