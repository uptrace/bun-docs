# Delete

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#DeleteQuery).

```go
db.NewDelete().
    With("subq_name", subquery).

    Model(&strct).
    Model(&slice).

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary expression
    TableExpr("(?) AS alias", subquery).
    ModelTableExpr("table1 AS t1"). // overrides model table name

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

To delete multiple books by a primary key:

```go
books := []*Book{book1, book2} // slice of books with ids
res, err := db.NewDelete().Model(&books).WherePK().Exec(ctx)
```

```sql
DELETE FROM "books" WHERE id IN (1, 2)
```

To delete using a subquery:

```go
subq := db.NewSelect().Model((*Book)(nil)).Limit(1000)

res, err := db.NewDelete().
    With("todo", subq).
    Model((*Book)(nil)).
    Table("todo").
    Where("book.id = todo.id").
    Exec(ctx)
```

```sql
WITH todo AS (
    SELECT * FROM books LIMIT 1000
)
DELETE FROM books AS book USING todo
WHERE book.id = todo.id
```
