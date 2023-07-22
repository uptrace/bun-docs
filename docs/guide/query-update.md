---
title: Golang Update [PostgreSQL MySQL]
---

<CoverImage title="Golang Update PostgreSQL MySQL" />

[[toc]]

## API

To see the full list of supported methods, see [API reference](https://pkg.go.dev/github.com/uptrace/bun#UpdateQuery).

```go
db.NewUpdate().
	With("cte_name", subquery).

	Model(&strct).
	Model(&slice).
	Model(&map). // only map[string]interface{}

	Column("col1", "col2"). // list of columns to update
	ExcludeColumn("col1"). // all columns except col1
	ExcludeColumn("*"). // exclude all columns

	Table("table1", "table2"). // quotes table names
	TableExpr("table1 AS t1"). // arbitrary unsafe expression
	TableExpr("(?) AS alias", subquery).
	ModelTableExpr("table1 AS t1"). // overrides model table name

	Value("col1", "expr1", arg1, arg2). // overrides column value

    // Generates `SET col1 = 'value1'`
	Set("col1 = ?", "value1").
    SetColumn("col1", "?", "value1").

	OmitZero() // don't update struct fields having zero values

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

To update a row, define a [model](models.md) and use [UpdateQuery](https://pkg.go.dev/github.com/uptrace/bun#UpdateQuery):

```go
book := &Book{ID: 123, Title: "hello"}

res, err := db.NewUpdate().Model(book).WherePK().Exec(ctx)
```

To update a single column:

```go
book.Title = "hello"

res, err := db.NewUpdate().
	Model(book).
	Column("title").
	Where("id = ?", 123).
	Exec(ctx)
```

```sql
UPDATE books SET title = 'my title' WHERE id = 123
```

Alternatively:

```go
res, err := db.NewUpdate().
    Model(book).
    Set("title = ?", "hello").
    Where("id = ?", 123).
    Exec(ctx)
```

## Bulk-update

To bulk-update books, you can use a [CTE](query-common-table-expressions.md):

```go
values := db.NewValues(&[]*Book{book1, book2})

res, err := db.NewUpdate().
	With("_data", values).
	Model((*Book)(nil)).
	TableExpr("_data").
	Set("title = _data.title").
	Set("text = _data.text").
	Where("book.id = _data.id").
	Exec(ctx)
```

```sql
WITH _data (id, title, text) AS (
  VALUES
    (1, 'title1', 'text1'),
    (2, 'title2', 'text2')
)
UPDATE books AS book
SET title = _data.title, text = _data.text
FROM _data
WHERE book.id = _data.id
```

Alternatively, you can use `Bulk` helper which creates a CTE for you:

```go
res, err := db.NewUpdate().
	Model(&books).
	Column("title", "text").
	Bulk().
	Exec(ctx)
```

## Maps

To update using a `map[string]interface{}`:

```go
value := map[string]interface{}{
	"title": "title1",
	"text":	 "text1",
}
res, err := db.NewUpdate().
	Model(&value).
	TableExpr("books").
	Where("id = ?", 1).
	Exec(ctx)
```

```sql
UPDATE books
SET title = 'title1', text = 'text2'
WHERE id = 1
```

## Omit zero values

You can also tell Bun to omit zero struct fields, for example, the following query does not update `email` column because it contains an empty value:

```go
type User struct {
	ID	  int64
	Name  string
	Email string
}

res, err := db.NewUpdate().
	Model(&User{ID: 1, Name: "John Doe"}).
	OmitZero().
	WherePK().
	Exec(ctx)
```

```sql
UPDATE users
SET name = "John Doe"
WHERE id = 1
```

## FQN

Multi-table updates differ in PostgreSQL and MySQL:

```sql
-- PostgreSQL
UPDATE dest FROM src SET col1 = src.col1 WHERE dest.id = src.id

-- MySQL
UPDATE dest, src SET dest.col1 = src.col1 WHERE dest.id = src.id
```

Bun helps you write queries for both databases by providing `SetColumn` method:

```go
res, err := db.NewUpdate().
	Table("dest", "src").
	SetColumn("col1", "src.col1").
	Where("dest.id = src.id").
	Exec(ctx)
```

If you have a slice of models to update, use `Bulk` method:

```go
res, err := db.NewUpdate().
	Model(&models).
	Column("col1").
	Bulk().
	Exec(ctx)
```
