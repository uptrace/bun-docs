---
title: 'Bun: Writing Queries'
---

<CoverImage title="Writing Queries" />

## Design

Bun's goal is to help you write idiomatic SQL, not to hide it behind awkward constructs. It is a good idea to start writing and testing queries using CLI for your database (for example, psql), and then re-construct resulting queries using Bun's query builder.

The main features are:

- Splitting long queries into logically separated blocks.
- Replacing [placeholders](placeholders.html) with properly escaped values (using [bun.Ident](placeholders.html#bun-ident) and [bun.Safe](placeholders.html#bun-safe)).
- Generating a list of columns and some [joins](relations.html) from struct-based models.

For example, the following Go code:

```go
err := db.NewSelect().
	Model(book).
	ColumnExpr("lower(name)").
	Where("? = ?", bun.Ident("id"), "some-id").
	Scan(ctx)
```

Unsurprisingly generates the following query:

```sql
SELECT lower(name)
FROM "books"
WHERE "id" = 'some-id'
```

## Scan and Exec

You can create queries using [bun.DB](https://pkg.go.dev/github.com/uptrace/bun#DB), [bun.Tx](https://pkg.go.dev/github.com/uptrace/bun#Tx), or [bun.Conn](https://pkg.go.dev/github.com/uptrace/bun#Conn):

- [db.NewSelect](https://pkg.go.dev/github.com/uptrace/bun#DB.NewSelect)
- [db.NewInsert](https://pkg.go.dev/github.com/uptrace/bun#DB.NewInsert)
- [db.NewUpdate](https://pkg.go.dev/github.com/uptrace/bun#DB.NewUpdate)
- [db.NewDelete](https://pkg.go.dev/github.com/uptrace/bun#DB.NewDelete)
- [db.NewCreateTable](https://pkg.go.dev/github.com/uptrace/bun#DB.NewCreateTable)

Once you have a query, you can execute it with `Exec`:

```go
result, err := db.NewInsert().Model(&user).Exec(ctx)
```

Or use `Scan` which does the same but omits the `sql.Result` (only available for selects):

```go
err := db.NewSelect().Model(&user).Where("id = 1").Scan(ctx)
```

By default `Exec` scans columns into the model, but you can specify a different destination too:

```go
err := db.NewSelect().Model((*User)(nil)).Where("id = 1").Scan(ctx, &user)
```

You can scan into:

- a struct,
- a `map[string]interface{}`,
- scalar types,
- slices of the types above.

```go
// Scan into a map.
m := make(map[string]interface{})
err := db.NewSelect().Model(&user).Where("id = 1").Scan(ctx, &m)

// Scan into a slice of maps.
ms := make([]map[string]interface{}, 0)
err := db.NewSelect().Model(&user).Limit(100).Scan(ctx, &ms)

// Scan into a var.
var name string
err := db.NewSelect().Model(&user).Column("name").Where("id = 1").Scan(ctx, &name)

// Scan columns into separate slices.
var ids []int64
var names []string
err := db.NewSelect().Model(&user).Column("id", "name").Limit(100).Scan(ctx, &ids, &names)
```

## bun.IDB

Bun provides `bun.IDB` interface which you can use to accept `bun.DB`, `bun.Tx`, and `bun.Conn`:

```go
func InsertUser(ctx context.Context, db bun.IDB, user *User) error {
	_, err := db.NewInsert().Model(user).Exec(ctx)
	return err
}

err := InsertUser(ctx, db, user)

err := db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
	return InsertUser(ctx, tx, user)
})
```

## Scanning rows

To execute custom query and scan all rows:

```go
rows, err := db.QueryContext(ctx, "SELECT * FROM users")
if err != nil {
    panic(err)
}

err = db.ScanRows(ctx, rows, &users)
```

To scan row by row:

```go
rows, err := db.NewSelect().Model((*User)(nil)).Rows(ctx)
if err != nil {
	panic(err)
}
defer rows.Close()

for rows.Next() {
	user := new(User)
	if err := db.ScanRow(ctx, rows, user); err != nil {
		panic(err)
	}
}

if err := rows.Err(); err != nil {
	panic(err)
}
```

## Scanonly

Sometimes, you want to ignore some fields when inserting or updating data, but still be able to scan columns into the ignored fields. You can achieve that with `scanonly` option:

```diff
type Model struct {
    Foo string
-    Bar string `"bun:"-"`
+    Bar string `"bun:",scanonly"`
}
```

## Ignoring unknown columns

To discard unknown SQL columns, you can use `WithDiscardUnknownColumns` db option:

```go
db := bun.NewDB(sqldb, pgdialect.New(), bun.WithDiscardUnknownColumns())
```

If you want to ignore a single column, just underscore it:

```go
err := db.NewSelect().
    ColumnExpr("1 AS _rank"). // ignore the column when scanning
    OrderExpr("_rank DESC").  // but use it for sorting
    Scan(ctx)
```

## See also

- [Monitoring Bun performance](/guide/performance-monitoring.md)
- [Running Bun in production](/guide/running-bun-in-production.md)
- [DataDog alternatives](https://uptrace.dev/comparisons/datadog-alternatives)
