---
title: Golang Insert [PostgreSQL MySQL]
---

<CoverImage title="Golang Insert PostgreSQL MySQL" />

[[toc]]

## API

To see the full list of supported methods, see [InsertQuery](https://pkg.go.dev/github.com/uptrace/bun#InsertQuery).

```go
db.NewInsert().
    With("cte_name", subquery).

    Model(&strct).
    Model(&slice).
    Model(&map). // only map[string]interface{}

    Column("col1", "col2"). // list of columns to insert
    ExcludeColumn("col1"). // all columns except col1
    ExcludeColumn("*"). // exclude all columns

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary unsafe expression
    TableExpr("(?) AS subq", subquery).
    ModelTableExpr("table1 AS t1"). // overrides model table name

    Value("col1", "expr1", arg1, arg2). // overrides column value

    On("CONFLICT (id) DO UPDATE").
	Set("col1 = EXCLUDED.col1").

    WherePK(). // where using primary keys
    Where("id = ?", 123).
    Where("name LIKE ?", "my%").
    Where("? = 123", bun.Ident("id")).
    Where("id IN (?)", bun.In([]int64{1, 2, 3})).
    Where("id IN (?)", subquery).
    Where("FALSE").WhereOr("TRUE").
    WhereGroup(" AND ", func(q *bun.SelectQuery) *bun.SelectQuery {
        return q.WhereOr("id = 1").
            WhereOr("id = 2")
    }).

    Returning("*").
    Returning("col1, col2").
    Returning("NULL"). // don't return anything

    Exec(ctx)
```

## Example

To insert data, define a [model](models.md) and use [InsertQuery](https://pkg.go.dev/github.com/uptrace/bun#InsertQuery):

```go
book := &Book{Title: "hello"}

res, err := db.NewInsert().Model(book).Exec(ctx)
```

## Bulk-insert

To bulk-insert models, use a slice:

```go
books := []Book{book1, book2}
res, err := db.NewInsert().Model(&books).Exec(ctx)
if err != nil {
    panic(err)
}

for _, book := range books {
    fmt.Println(book.ID) // book id is scanned automatically
}
```

## Upsert

To insert a new book or update the existing one:

```go
_, err := db.NewInsert().
	Model(&book).
	On("CONFLICT (id) DO UPDATE").
	Set("title = EXCLUDED.title").
	Exec(ctx)
```

```sql
INSERT INTO "books" ("id", "title") VALUES (100, 'my title')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
```

For MySQL use:

```go
_, err := db.NewInsert().
	Model(&book).
	On("DUPLICATE KEY UPDATE").
	Exec(ctx)
```

```sql
INSERT INTO `books` (`id`, `title`) VALUES (100, 'my title')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`)
```

To ignore duplicates, use `Ignore` with all databases:

```go
_, err := db.NewInsert().
	Model(&book).
	Ignore().
	Exec(ctx)
```

```sql
-- MySQL
INSERT IGNORE INTO `books` (`id`, `title`) VALUES (100, 'my title');

-- PostgreSQL
INSERT INTO `books` (`id`, `title`) VALUES (100, 'my title')
ON CONFLICT DO NOTHING;
```

## Maps

To insert a `map[string]interface{}`:

```go
values := map[string]interface{}{
    "title": "title1",
    "text":  "text1",
}
_, err := db.NewInsert().Model(&values).TableExpr("books").Exec()
```

```sql
INSERT INTO "books" ("title", "text") VALUES ('title1', 'text2')
```

## INSERT ... SELECT

To copy rows between tables:

```go
_, err := db.NewInsert().
    Table("books_backup").
	Table("books").
	Exec(ctx)
```

```sql
INSERT INTO "books_backup" SELECT * FROM "books"
```

You can also specify columns to copy:

```go
_, err := db.NewInsert().
    ColumnExpr("id, name").
    Table("dest").
    Table("src").
    Exec(ctx)
```

```sql
INSERT INTO "dest" (id, name) SELECT id, name FROM "src"
```
