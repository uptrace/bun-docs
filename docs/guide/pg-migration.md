# Migrating from go-pg

Bun is a rewrite of [go-pg](https://github.com/go-pg/pg) that works with PostgreSQL, MySQL, and SQLite. It consists of:

- Bun core that provides a query builder and models.
- [pgdriver](drivers.md#pgdriver) package to connect to PostgreSQL.
- [migrate](migrations.md) package to run migrations.
- [dbfixture](fixtures.md) to load initial data from YAML files.
- Optional [starter kit](starter-kit.md) that provides modern app skeleton.

Bun's query builder tries to be compatible with go-pg's builder, but some rarely used APIs are removed (for example, `WhereOrNotGroup`). In most cases, you won't need to rewrite your queries.

go-pg is still maintained and there is no urgency in rewriting go-pg apps in Bun, but new projects should prefer Bun over go-pg. And once you are familiar with the updated API, you should be able to migrate a 80-100k lines go-pg app to Bun within a single day.

## New features

- `*pg.Query` is split into smaller structs, for example, [bun.SelectQuery](https://pkg.go.dev/github.com/uptrace/bun#SelectQuery), [bun.InsertQuery](https://pkg.go.dev/github.com/uptrace/bun#InsertQuery), [bun.UpdateQuery](https://pkg.go.dev/github.com/uptrace/bun#UpdateQuery), [bun.DeleteQuery](https://pkg.go.dev/github.com/uptrace/bun#DeleteQuery) and so on. This is one of the reasons Bun inserts/updates data faster than go-pg.

  go-pg API:

  ```go
  err := db.ModelContext(ctx, &users).Select()
  err := db.ModelContext(ctx, &users).Select(&var1, &var2)
  res, err := db.ModelContext(ctx, &users).Insert()
  res, err := db.ModelContext(ctx, &user).WherePK().Update()
  res, err := db.ModelContext(ctx, &users).WherePK().Delete()
  ```

  Bun API:

  ```go
  err := db.NewSelect().Model(&users).Scan(ctx)
  err := db.NewSelect().Model(&users).Scan(ctx, &var1, &var2)
  res, err := db.NewInsert().Model(&users).Exec(ctx)
  res, err := db.NewUpdate().Model(&users).WherePK().Exec(ctx)
  res, err := db.NewDelete().Model(&users).WherePK().Exec(ctx)
  ```

- To create `VALUES (1, 'one')` statement, use `db.NewValues(&rows)`.
- Bulk `UPDATE` queries should be rewrited using CTE and `VALUES` statement:

  ```go
  db.NewUpdate().
      With("_data", db.NewValues(&rows)).
      Model((*Model)(nil)).
      Table("_data").
      Set("model.name = _data.name").
      Where("model.id = _data.id").
      Exec(ctx)
  ```

  Alternatively, you can use `UpdateQuery.Bulk` helper that does the same:

  ```go
  err := db.NewUpdate().Model(&rows).Bulk().Exec(ctx)
  ```

- To create an index, use `db.NewCreateIndex()`.
- To drop an index, use `db.NewDropIndex()`.
- To truncate a table, use `db.NewTruncateTable()`.
- To overwrite model table name, use `q.Model((*MyModel)(nil)).ModelTableExpr("my_table_name")`.
- To provide initial data, use [fixtures](fixtures.md).

## Go zero values and NULL

Unlike go-pg, Bun does not marshal Go zero values as SQL NULLs by default. To get the old behavior, use `nullzero` tag option:

```go
type User struct {
    Name string `bun:",nullzero"`
}
```

For `time.Time` fields you can use `bun.NullTime`:

```go
type User struct {
    Name      string    `bun:",nullzero"`
    CreatedAt time.Time `bun:",notnull,default:current_timestamp"`
    UpdatedAt bun.NullTime
}
```

## Other changes

- Replace `pg` struct tags with `bun`, for example, `bun:"my_column_name"`.
- Replace `rel:"has-one"` with `rel:"belongs-to"` and `rel:"belongs-to"` with `rel:"has-one"`. go-pg used wrong names for those relations.
- Replace ``tableName struct{} `pg:"mytable`"`` with `` bun.BaseModel `bun:"mytable"` ``. This helps with linters that mark the field as unused.
- To marshal Go zero values as NULLs, use `bun:",nullzero"` field tag. By default, Bun does not marshal Go zero values as `NULL` any more.
- Replace `pg.ErrNoRows` with `sql.ErrNoRows`.
- Replace `db.WithParam` with `db.WithNamedArg`.
- Replace `orm.RegisterTable` with `db.RegisterModel`.
- Replace `pg.Safe` with `bun.Safe`.
- Replace `pg.Ident` with `bun.Ident`.
- Replace `pg.Array` with `pgdialect.Array`.
- Replace `pg:",discard_unknown_columns"` with `db.WithDiscardUnknownColumns()` option.
- Replace `q.OnConflict("DO NOTHING")` with `q.On("CONFLICT DO NOTHING")`.
- Replace `q.OnConflict("(column) DO UPDATE")` with `q.On("CONFLICT (column) DO UPDATE")`.
- Replace `ForEach` with `sql.Rows` and `db.ScanRow`.
- Replace `WhereIn("foo IN (?)", slice)` with `Where("foo IN (?)", bun.In(slice))`.
- Replace `db.RunInTransaction` with `db.RunInTx`.
- Replace `db.SelectOrInsert` with an upsert:

```go
res, err := db.NewInsert().Model(&model).On("CONFLICT DO NOTHING").Exec(ctx)
res, err := db.NewInsert().Model(&model).On("CONFLICT DO UPDATE").Exec(ctx)
```

- Replace `q.UpdateNotZero()` with `q.OmitZero()` on an update query:

```go
// go-pg API:
res, err := db.Model(&model).WherePK().UpdateNotZero()
// bun API:
res, err := db.NewUpdate().Model(&model).WherePK().OmitZero().Exec(ctx)
```

- Bun uses a database/sql pool, so use [sql.DBStats](https://pkg.go.dev/database/sql#DBStats) instead of `pg.PoolStats.`
- `WrapWith` is removed. Use `With` instead:

```go
subq := db.NewSelect()
q := db.NewSelect().
	With("subq", subq).
	Table("subq")
```

## Ignored columns

Unlike go-pg, Bun does not allow scanning into explicitly ignored fields. For example, the following code does not work:

```go
type Model struct {
    Foo string `bun:"-"`
}
```

But you can fix it by adding `scanonly` option:

```go
type Model struct {
    Foo string `bun:",scanonly"`
}
```

## pg.Listener

You have 2 options if you need `pg.Listener`:

- Use [pgdriver.Listener](/postgres/listen-notify.html).
- Use [pgx](https://pkg.go.dev/github.com/jackc/pgx/v4#hdr-Listen_and_Notify).

## Porting migrations

Bun supports migrations via [bun/migrate](migrations.md) package. Because it uses timestamp-based migration names, you need to rename your migration files, for example, `1_initial.up.sql` should be renamed to `20210505110026_initial.up.sql`.

After you are done porting migrations, you need to initialize Bun tables (use [starter kit](starter-kit.md)):

```go
go run cmd/bun/main.go -env=dev db init
```

And probably mark existing migrations as completed:

```go
go run cmd/bun/main.go -env=dev db mark_applied
```

You can check the status of migrations with:

```go
go run cmd/bun/main.go -env=dev db status
```

## Monitoring performance

To [monitor Bun performance](/guide/performance-monitoring.html), you can use OpenTelemetry instrumentation that comes with Bun.

OpenTelemetry is an open source project that aims to provide a unified set of APIs, libraries, agents, and instrumentation to enable observability in modern software applications. It allows developers to collect, instrument, and export telemetry data from their applications to gain insight into the performance and behavior of distributed systems.

Uptrace is a [OpenTelemetry APM](https://uptrace.dev/opentelemetry/apm) that supports distributed tracing, metrics, and logs. You can use it to monitor applications and troubleshoot issues.

![Uptrace Overview](/uptrace/home.png)

Uptrace comes with an intuitive query builder, rich dashboards, alerting rules with notifications, and integrations for most languages and frameworks.

Uptrace can process billions of spans and metrics on a single server and allows you to monitor your applications at 10x lower cost.

In just a few minutes, you can try Uptrace by visiting the [cloud demo](https://app.uptrace.dev/play) (no login required) or running it locally with [Docker](https://github.com/uptrace/uptrace/tree/master/example/docker). The source code is available on [GitHub](https://github.com/uptrace/uptrace).
