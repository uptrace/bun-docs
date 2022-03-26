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
        '/guide/placeholders.md',
        '/guide/query-select.md',
        '/guide/query-where.md',
        '/guide/query-common-table-expressions.md',
        '/guide/query-insert.md',
        '/guide/query-update.md',
        '/guide/query-delete.md',
        '/guide/query-create-table.md',
        '/guide/query-drop-table.md',
        '/guide/query-truncate-table.md',
        '/guide/relations.md',
      ],
    },
    {
      isGroup: true,
      text: 'Essentials',
      children: [
        '/guide/starter-kit.md',
        '/guide/migrations.md',
        '/guide/fixtures.md',
        '/guide/debugging.md',
      ],
    },
    {
      isGroup: true,
      text: 'Tutorials',
      children: [
        '/guide/running-bun-in-production.md',
        '/guide/tracing.md',
        '/guide/transactions.md',
        '/guide/soft-deletes.md',
        '/guide/hooks.md',
        '/guide/custom-types.md',
        '/guide/cursor-pagination.md',
        '/guide/complex-queries.md',
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
        '/postgres/listen-notify.md',
        '/postgres/copy-data.md',
        '/postgres/faceted-full-text-search-tsvector.md',
        '/postgres/table-partition.md',
        '/postgres/performance-tuning.md',
        '/postgres/zero-downtime-migrations.md',
        '/postgres/tuning-zfs-aws-ebs.md',
        '/postgres/pgbackrest-s3-backups.md',
      ],
    },
  ],
}
