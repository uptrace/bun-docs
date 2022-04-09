import type { SidebarConfig } from '@vuepress/theme-default'

export const en: SidebarConfig = {
  '/': [
    {
      isGroup: true,
      text: 'Guide',
      children: [
        { text: 'Introduction', link: '/guide/README.md' },
        { text: 'Getting started', link: '/guide/getting-started.md' },
        { text: 'Drivers and dialects', link: '/guide/drivers.md' },
        { text: 'Defining models', link: '/guide/models.md' },
      ],
    },
    {
      isGroup: true,
      text: 'Querying',
      children: [
        { text: 'Writing queries', link: '/guide/queries.md' },
        { text: 'SQL placeholders', link: '/guide/placeholders.md' },
        { text: 'SELECT', link: '/guide/query-select.md' },
        { text: 'WHERE', link: '/guide/query-where.md' },
        { text: 'Common table expressions', link: '/guide/query-common-table-expressions.md' },
        { text: 'INSERT', link: '/guide/query-insert.md' },
        { text: 'UPDATE', link: '/guide/query-update.md' },
        { text: 'DELETE', link: '/guide/query-delete.md' },
        { text: 'CREATE TABLE', link: '/guide/query-create-table.md' },
        { text: 'DROP TABLE', link: '/guide/query-drop-table.md' },
        { text: 'TRUNCATE TABLE', link: '/guide/query-truncate-table.md' },
        { text: 'ORM relations', link: '/guide/relations.md' },
      ],
    },
    {
      isGroup: true,
      text: 'Essentials',
      children: [
        { text: 'Starter kit', link: '/guide/starter-kit.md' },
        { text: 'Migrations', link: '/guide/migrations.md' },
        { text: 'Fixtures', link: '/guide/fixtures.md' },
        { text: 'Debugging', link: '/guide/debugging.md' },
      ],
    },
    {
      isGroup: true,
      text: 'Tutorials',
      children: [
        { text: 'Running Bun in production', link: '/guide/running-bun-in-production.md' },
        { text: 'Monitoring performance and errors', link: '/guide/tracing.md' },
        { text: 'Transactions', link: '/guide/transactions.md' },
        { text: 'Soft deletes', link: '/guide/soft-deletes.md' },
        { text: 'Hooks', link: '/guide/hooks.md' },
        { text: 'Custom types', link: '/guide/custom-types.md' },
        { text: 'Cursor pagination', link: '/guide/cursor-pagination.md' },
        { text: 'Writing complex queries', link: '/guide/complex-queries.md' },
        { text: 'Migrating from go-pg', link: '/guide/pg-migration.md' },
      ],
    },
  ],
  '/postgres': [
    {
      isGroup: true,
      text: 'PostgreSQL',
      children: [
        { text: 'Overview', link: '/postgres/README.md' },
        { text: 'Supported data types', link: '/postgres/data-types.md' },
        { text: 'UUID', link: '/postgres/uuid.md' },
        { text: 'Arrays', link: '/postgres/arrays.md' },
        { text: 'LISTEN NOTIFY', link: '/postgres/listen-notify.md' },
        { text: 'COPY', link: '/postgres/copy-data.md' },
        {
          text: 'Faceted navigation and search',
          link: '/postgres/faceted-full-text-search-tsvector.md',
        },
        { text: 'Table Partitioning', link: '/postgres/table-partition.md' },
        { text: 'Tuning PostgreSQL performance', link: '/postgres/performance-tuning.md' },
        {
          text: 'Zero-downtime migrations',
          link: '/postgres/zero-downtime-migrations.md',
        },
        {
          text: 'Running PostgreSQL using ZFS and AWS EBS',
          link: '/postgres/tuning-zfs-aws-ebs.md',
        },
        { text: 'pgBackRest: PostgreSQL S3 backups', link: '/postgres/pgbackrest-s3-backups.md' },
      ],
    },
  ],
}
