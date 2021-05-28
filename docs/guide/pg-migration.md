# Migrating from go-pg

Bun is a rewrite of [go-pg](https://github.com/go-pg/pg) on top of `sql.DB`. As a consequence, it
works with different databases, for example, PostgreSQL, MySQL, and SQLite.

Bun's query builder is fully compatible with go-pg's builder, but some rarely used APIs are removed
(for example, `WhereOrNotGroup`). In most cases, you won't need to rewrite your queries.

Once you are familiar with the new API, you should be able to migrate a 80-100k lines go-pg app to
Bun within a single day.

## New features

- [Bun starter kit](starter-kit.md).
- `*pg.Query` is split into smaller structs, for example, `*bun.SelectQuery`, `*bun.InsertQuery`,
  `*bun.UpdateQuery`, `*bun.DeleteQuery` and so on.

  go-pg API:

  ```go
  err := db.ModelContext(ctx, &users).Select()
  res, err := db.ModelContext(ctx, &users).Insert()
  res, err := db.ModelContext(ctx, &user).WherePK().Update()
  res, err := db.ModelContext(ctx, &users).WherePK().Delete()
  ```

  Bun API:

  ```go
  err := db.NewSelect().Model(&users).Scan(ctx)
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

- To create an index, use `db.NewCreateIndex()`.
- To drop an index, use `db.NewDropIndex()`.
- To truncate a table, use `db.NewTruncateTable()`.
- To overwrite model table name, use `q.Model((*MyModel)(nil)).ModelTableExpr("my_table_name")`.
- Use [fixtures](fixtures.md) to provide initial data.

## Go zero values and NULL

Unlike go-pg, Bun does not marshal Go zero values as SQL NULLs by default. To get the old behavior,
use `nullzero` tag option:

```go
type User struct {
    Name string `bun:",nullzero"`
}
```

For `time.Time` fields you can also use `bun.NullTime`:

```go
type User struct {
    Name      string    `bun:",nullzero"`
    CreatedAt time.Time `bun:",notnull:default:current_timestamp"`
    UpdatedAt bun.NullTime
}
```

## Other changes

- Replace `pg` struct tags with `bun`, for example, `bun:"my_column_name"`.
- Replace `` tableName struct{} `pg:"mytable`" `` with `` bun.BaseModel `bun:"mytable"` ``.
- To marshal Go zero values as NULLs, use `bun:",nullzero"` field tag. By default, bun does not
  marshal Go zero values as `NULL` any more.
- Replace `pg.ErrNoRows` wtih `sql.ErrNoRows`.
- Replace `db.WithParam` with `db.WithNamedArg`.
- Replace `orm.RegisterTable` with `db.RegisterModel`.
- Replace `pg.Safe` with `bun.Safe`.
- Replace `pg.Ident` with `bun.Ident`.
- Replace `pg.Array` with `pgdialect.Array`.
- Replace `pg:",discard_unknown_columns"` with `WithDiscardUnknownColumns` option.
- Replace `q.OnConflict("DO NOTHING")` with `q.On("CONFLICT DO NOTHING")`.
- Replace `q.OnConflict("(column) DO UPDATE")` with `q.On("CONFLICT (column) DO UPDATE")`.
- Replace `ForEach` with `sql.Rows` and `db.ScanRow`.
- Replace `WhereIn("foo IN (?)", slice)` with `Where("foo IN (?)", bun.In(slice))`.

## pg.Listener

You have 2 options if you need to replace `pg.Listener`:

- Use [pgdriver.Listener](https://pkg.go.dev/github.com/uptrace/bun/driver/pgdriver#Listener). Note
  that at the moment pgdriver does not support prepared statements.
- Use [pgx](https://pkg.go.dev/github.com/jackc/pgx/v4#hdr-Listen_and_Notify)

## Porting migrations

Bun supports migrations via [bun/migrate](migrations.md) package. Because it uses timestamp-based
migration names, you need to rename your migration files, for example, `1_initial.up.sql` should be
renamed to `20210505110026_initial.up.sql`.

After you are done porting migrations, you need to initialize Bun migration tables (use
[starter kit](starter-kit.md)):

```go
go run cmd/bun/main.go -env=dev db init
```

And probably mark existing migrations as completed:

```go
go run cmd/bun/main.go -env=dev db mark_completed
```

You can check the status of migrations with:

```go
go run cmd/bun/main.go -env=dev db status
```
