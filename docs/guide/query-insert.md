# Insert

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#InsertQuery).

```go
db.NewInsert().
    With("subq_name", subquery).

    Model(&strct).
    Model(&slice).
    Model(&map). // only map[string]interface{}

    Column("col1", "col2"). // list of columns to insert
    ExcludeColumn("col1"). // all columns except col1
    ExcludeColumn("*"). // exclude all columns

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary expression
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

To insert a new book or update an existing one:

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

To insert a `map[string]interface{}`:

```go
values := map[string]interface{}{
    "title": "title1",
    "text":  "text1",
}
_, err := db.NewInsert().Model(&values).TableExpr("books").Exec()
```

```sql
INSERT INTO books (title, text) VALUES ('title1', 'text2')
```

To copy all rows from a table:

```go
selq := db.NewSelect().
	Model((*Book)(nil)).
	Where("TRUE")

_, err := db.NewInsert().
	Model((*Book)(nil)).
	With("sel", selq).
	TableExpr("sel").
	Exec(ctx)
```

```sql
WITH "sel" AS (
  SELECT "book"."id"
  FROM "books" AS "book"
  WHERE (TRUE)
)
INSERT INTO "books"
SELECT * FROM sel
```
