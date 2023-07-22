---
title: Golang Delete rows [PostgreSQL MySQL]
---

<CoverImage title="Golang Delete Rows PostgreSQL MySQL" />

[[toc]]

## API

To see the full list of supported methods, see [DeleteQuery](https://pkg.go.dev/github.com/uptrace/bun#DeleteQuery).

```go
db.NewDelete().
    With("cte_name", subquery).

    Model(&strct).
    Model(&slice).

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary unsafe expression
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

## Example

To delete a row, define a [model](models.md) and use [DeleteQuery](https://pkg.go.dev/github.com/uptrace/bun#DeleteQuery):

```go
res, err := db.NewDelete().Where("id = ?", 123).Exec(ctx)
```

## Bulk-delete

To bulk-delete books by a primary key:

```go
books := []*Book{book1, book2} // slice of books with ids
res, err := db.NewDelete().Model(&books).WherePK().Exec(ctx)
```

```sql
DELETE FROM "books" WHERE id IN (1, 2)
```

## DELETE ... USING

To delete rows using another table:

```go
res, err := db.NewDelete().
    Model((*Book)(nil)).
    TableExpr("archived_books AS src").
    Where("book.id = src.id").
    Exec(ctx)
```

```sql
DELETE FROM "books" AS book
USING archived_books AS src
WHERE book.id = src.id
```
