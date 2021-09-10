# Update

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#UpdateQuery).

```go
db.NewUpdate().
    With("subq_name", subquery).

    Model(&strct).
    Model(&slice).
    Model(&map). // only map[string]interface{}

    Column("col1", "col2"). // list of columns to insert
    ExcludeColumn("col1"). // all columns except col1
    ExcludeColumn("*"). // exclude all columns

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary expression
    TableExpr("(?) AS alias", subquery).
    ModelTableExpr("table1 AS t1"). // overrides model table name

    Value("col1", "expr1", arg1, arg2). // overrides column value
    Set("col1 = ?", "value1").

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

To update a single column:

```go
res, err := db.NewUpdate().
	Model(&book).
	Column("title").
	Where("id = ?", 1).
	Exec(ctx)
```

```sql
UPDATE books SET title = 'my title' WHERE id = 1
```

To update using a `map[string]interface{}`:

```go
value := map[string]interface{}{
    "title": "title1",
    "text":  "text1",
}
res, err := db.NewUpdate().Model(&value).TableExpr("books").Where("id = ?", 1).Exec(ctx)
```

```sql
UPDATE books SET title = 'title1', text = 'text2' WHERE id = 1
```

## Bulk-update

To update multiple books with a single query:

```go
res, err := db.NewUpdate().
    With("_data", db.NewValues([]*Book{book1, book2})).
    Model((*Book)(nil)).
    TableExpr("_data").
    Set("title = _data.title").
    Set("text = _data.text").
    Where("book.id = _data.id").
    Exec(ctx)
```

```sql
WITH _data (id, title, text) AS (VALUES (1, 'title1', 'text1'), (2, 'title2', 'text2'))
UPDATE books AS book
SET title = _data.title, text = _data.text
FROM _data
WHERE book.id = _data.id
```

Alternatively, you can use `Bulk` helper and `Column` to specify columns to update:

```go
res, err := db.NewUpdate().
    Model(&books).
    Column("title", "text").
    Bulk().
    Exec(ctx)
```