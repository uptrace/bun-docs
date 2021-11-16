# Create Table

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#CreateTableQuery).

```go
db.NewCreateTable().

    Model(&strct).

    Table("table1"). // quotes table names
    TableExpr("table1"). // arbitrary unsafe expression
    ModelTableExpr("table1"). // overrides model table name

    Temp().
    IfNotExists().
    Varchar(100). // turns VARCHAR into VARCHAR(100)

    ForeignKey(`(fkey) REFERENCES table1 (pkey) ON DELETE CASCADE`)

    Exec(ctx)
```

To create a table:

```go
_, err := db.NewCreateTable().
	Model((*Book)(nil)).
	ForeignKey(`("author_id") REFERENCES "users" ("id") ON DELETE CASCADE`)
	Exec(ctx)
if err != nil {
	panic(err)
}
```

You can also modify query from the `bun.BeforeCreateTableHook` hook.

```go
var _ bun.BeforeCreateTableHook = (*Book)(nil)

func (*Book) BeforeCreateTable(ctx context.Context, query *bun.CreateTableQuery) error {
	query.ForeignKey(`("author_id") REFERENCES "users" ("id") ON DELETE CASCADE`)
	return nil
}

if _, err := db.NewCreateTable().Model((*Book)(nil)).Exec(ctx); err != nil {
	panic(err)
}
```

To create an index on the table, you can use `bun.AfterCreateTableHook` hook:

```go
var _ bun.AfterCreateTableHook = (*Book)(nil)

func (*Book) AfterCreateTable(ctx context.Context, query *bun.CreateTableQuery) error {
	_, err := query.DB().NewCreateIndex().
		Model((*Book)(nil)).
		Index("category_id_idx").
		Column("category_id").
		Exec(ctx)
	return err
}
```

See [example](https://github.com/uptrace/bun/tree/master/example/create-table-index) for details.
