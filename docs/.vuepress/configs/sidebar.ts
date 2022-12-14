import type { SidebarConfig } from '@vuepress/theme-default'

export const en: SidebarConfig = {
  '/': [
    {
      isGroup: true,
      text: 'Guide',
      children: [
        { text: 'Introduction', link: '/guide/' },
        { text: 'Getting started', link: '/guide/golang-orm.html' },
        { text: 'Drivers and dialects', link: '/guide/drivers.html' },
        { text: 'Defining models', link: '/guide/models.html' },
      ],
    },
    {
      isGroup: true,
      text: 'Querying',
      children: [
        { text: 'Writing queries', link: '/guide/queries.html' },
        { text: 'SQL placeholders', link: '/guide/placeholders.html' },
        { text: 'SELECT', link: '/guide/query-select.html' },
        { text: 'WHERE', link: '/guide/query-where.html' },
        { text: 'CTE and VALUES', link: '/guide/query-common-table-expressions.html' },
        { text: 'MERGE', link: '/guide/query-merge.html' },
        { text: 'INSERT', link: '/guide/query-insert.html' },
        { text: 'UPDATE', link: '/guide/query-update.html' },
        { text: 'DELETE', link: '/guide/query-delete.html' },
        { text: 'CREATE TABLE', link: '/guide/query-create-table.html' },
        { text: 'DROP TABLE', link: '/guide/query-drop-table.html' },
        { text: 'TRUNCATE TABLE', link: '/guide/query-truncate-table.html' },
        { text: 'ORM relations', link: '/guide/relations.html' },
      ],
    },
    {
      isGroup: true,
      text: 'Essentials',
      children: [
        { text: 'Starter kit', link: '/guide/starter-kit.html' },
        { text: 'Migrations', link: '/guide/migrations.html' },
        { text: 'Fixtures', link: '/guide/fixtures.html' },
        { text: 'Debugging', link: '/guide/debugging.html' },
      ],
    },
    {
      isGroup: true,
      text: 'Tutorials',
      children: [
        { text: 'Running Bun in production', link: '/guide/running-bun-in-production.html' },
        {
          text: 'Monitoring performance and errors',
          link: '/guide/performance-monitoring.html',
        },
        { text: 'Transactions', link: '/guide/transactions.html' },
        { text: 'Soft deletes', link: '/guide/soft-deletes.html' },
        { text: 'Hooks', link: '/guide/hooks.html' },
        { text: 'Custom types', link: '/guide/custom-types.html' },
        { text: 'Cursor pagination', link: '/guide/cursor-pagination.html' },
        { text: 'Writing complex queries', link: '/guide/complex-queries.html' },
        { text: 'Migrating from go-pg', link: '/guide/pg-migration.html' },
      ],
    },
  ],
  '/postgres': [
    {
      isGroup: true,
      text: 'PostgreSQL',
      children: [
        { text: 'Overview', link: '/postgres/' },
        { text: 'Supported data types', link: '/postgres/postgres-data-types.html' },
        { text: 'UUIDs', link: '/postgres/postgres-uuid-generate.html' },
        { text: 'Arrays', link: '/postgres/postgres-arrays.html' },
        { text: 'LISTEN NOTIFY', link: '/postgres/listen-notify.html' },
        { text: 'COPY', link: '/postgres/copy-data.html' },
        {
          text: 'Faceted navigation and search',
          link: '/postgres/faceted-full-text-search-tsvector.html',
        },
        { text: 'Table Partitioning', link: '/postgres/table-partition.html' },
        { text: 'Tuning PostgreSQL performance', link: '/postgres/performance-tuning.html' },
        {
          text: 'Zero-downtime migrations',
          link: '/postgres/zero-downtime-migrations.html',
        },
        {
          text: 'Optimizing PostgreSQL for ZFS and AWS EBS',
          link: '/postgres/tuning-zfs-aws-ebs.html',
        },
        { text: 'pgBackRest: PostgreSQL S3 backups', link: '/postgres/pgbackrest-s3-backups.html' },
      ],
    },
  ],
}
