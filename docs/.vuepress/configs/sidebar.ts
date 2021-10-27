import type { SidebarConfig } from '@vuepress/theme-default'

export const en: SidebarConfig = {
  '/': [
    {
      isGroup: true,
      text: 'Guide',
      children: [
        '/guide/README.md',
        '/guide/getting-started.md',
        '/guide/drivers.md',
        '/guide/models.md',
      ],
    },
    {
      isGroup: true,
      text: 'Querying',
      children: [
        '/guide/queries.md',
        '/guide/query-select.md',
        '/guide/query-insert.md',
        '/guide/query-update.md',
        '/guide/query-delete.md',
        '/guide/query-where.md',
        '/guide/query-common-table-expressions.md',
        '/guide/query-create-table.md',
        '/guide/relations.md',
        '/guide/placeholders.md',
      ],
    },
    {
      isGroup: true,
      text: 'Tutorials',
      children: [
        '/guide/starter-kit.md',
        '/guide/debugging.md',
        '/guide/running-bun-in-production.md',
        '/guide/tracing.md',
        '/guide/transactions.md',
        '/guide/soft-deletes.md',
        '/guide/hooks.md',
        '/guide/fixtures.md',
        '/guide/migrations.md',
        '/guide/pg-migration.md',
      ],
    },
  ],
  '/postgres': [
    {
      isGroup: true,
      text: 'PostgreSQL',
      children: [
        '/postgres/README.md',
        '/postgres/data-types.md',
        '/postgres/uuid.md',
        '/postgres/arrays.md',
        '/postgres/zero-downtime-migrations.md',
        '/postgres/tuning-zfs-aws-ebs.md',
        '/postgres/faceted-full-text-search-tsvector.md',
      ],
    },
  ],
}
