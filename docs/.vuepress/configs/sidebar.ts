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
        '/postgres/data-types.md',
        '/postgres/uuid.md',
        '/postgres/arrays.md',
        '/postgres/running-bun-in-production.md',
        '/postgres/zero-downtime-migrations.md',
      ],
    },
  ],
}
