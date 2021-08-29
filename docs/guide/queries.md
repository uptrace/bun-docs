# Writing queries

## Design

Bun's goal is to help you write good SQL, not to hide it behind awkward constructs. It is a good
idea to start writing and testing queries using CLI for your database (for example, psql), and then
re-construct resulting queries using Bun's query builder.

The main features are:

- Splitting long queries into logically separated blocks.
- Replacing [placeholders](placeholders.md) with properly escaped values (see `bun.Ident` and
  `bun.Safe`).
- Generating the list of columns and some [joins](relations.md) from Go models.

For example, the following Go code:

```go
err := db.NewSelect().
	Model(book).
	ColumnExpr("lower(name)").
	Where("? = ?", bun.Ident("id"), "some-id").
	Scan(ctx)
```

Unsurprsingly generates the following query:

```sql
SELECT lower(name)
FROM "books"
WHERE "id" = 'some-id'
```

## Scan and Exec

You can create queries using [bun.DB](https://pkg.go.dev/github.com/uptrace/bun#DB),
[bun.Tx](https://pkg.go.dev/github.com/uptrace/bun#Tx), or
[bun.Conn](https://pkg.go.dev/github.com/uptrace/bun#Conn):

- [db.NewSelect](https://pkg.go.dev/github.com/uptrace/bun#DB.NewSelect)
- [db.NewInsert](https://pkg.go.dev/github.com/uptrace/bun#DB.NewInsert)
- [db.NewUpdate](https://pkg.go.dev/github.com/uptrace/bun#DB.NewUpdate)
- [db.NewDelete](https://pkg.go.dev/github.com/uptrace/bun#DB.NewDelete)
- [db.NewCreateTable](https://pkg.go.dev/github.com/uptrace/bun#DB.NewCreateTable)

Once you have a query, you can execute it with `Exec`:

```go
result, err := db.NewInsert().Model(&user).Exec(ctx)
```

Or use `Scan` which does the same but omits the result (only available for selects):

```go
err := db.NewSelect().Model(&user).Where("id = 1").Scan(ctx)
```

By default `Exec` scans columns into the model, but you can specify a different destination too:

```go
err := db.NewSelect().Model((*User)(nil)).Where("id = 1").Scan(ctx, &user)
```

You can scan into

- a struct,
- a `map[string]interface{}`,
- scalar types,
- and slices of the types above.

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

// Scan all names.
var names []string
err := db.NewSelect().Model(&user).Column("name").Limit(100).Scan(ctx, &names)
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

## Select

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#SelectQuery).

```go
// Subquery.
subq := db.NewSelect().Model((*User)(nil)).Column("id").Limit(100)

db.NewSelect().
    With("subq_name", subq).

    Model(&strct).
    Model(&slice).

    Column("col1", "col2"). // quotes column names
    ColumnExpr("col1, col2"). // arbitrary expression
    ColumnExpr("count(*)").
    ColumnExpr("count(?)", bun.Ident("id")).
    ColumnExpr("(?) AS alias", subq).
    ExcludeColumn("col1"). // all columns except col1
    ExcludeColumn("*"). // exclude all columns

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary expression
    TableExpr("(?) AS subq", subq).
    ModelTableExpr("table1 AS t1"). // overrides model table name

    Join("JOIN table2 AS t2 ON t2.id = t1.id").
    Join("LEFT JOIN table2 AS t2").JoinOn("t2.id = t1.id").

    WherePK(). // where using primary keys
    Where("id = ?", 123).
    Where("name LIKE ?", "my%").
    Where("? = 123", bun.Ident("id")).
    Where("id IN (?)", bun.In([]int64{1, 2, 3})).
    Where("id IN (?)", subq).
    Where("FALSE").WhereOr("TRUE").
    WhereGroup(" AND ", func(q *bun.SelectQuery) *bun.SelectQuery {
        return q.WhereOr("id = 1").
            WhereOr("id = 2")
    }).

    Group("col1", "col2"). // quotes column names
    GroupExpr("lower(col1)"). // arbitrary expression

    Order("col1 ASC", "col2 DESC"). // quotes column names
    OrderExpr("col1 ASC NULLS FIRST"). // arbitrary expression

    Limit(100).
    Offset(100).

    For("UPDATE").
    For("SHARE").

    Scan(ctx)
```

Bun provides a helper to count returned rows:

```go
count, err := db.NewSelect().Model((*User)(nil)).Count(ctx)
```

You can also select and count users with one call (but 2 queries):

```go
count, err := db.NewSelect().Model(&users).Limit(20).ScanAndCount(ctx)
```

To select a book and manually join the book author:

```go
book := new(Book)
err := db.NewSelect().
    Model(&book).
    ColumnExpr("book.*").
    ColumnExpr("a.id AS author__id, a.name AS author__name").
    Join("JOIN authors AS a ON a.id = book.author_id").
    OrderExpr("book.id ASC").
    Limit(1).
    Scan(ctx)
```

```sql
SELECT book.*, a.id AS author__id, a.name AS author__name
FROM books
JOIN authors AS a ON a.id = book.author_id
ORDER BY book.id ASC
LIMIT 1
```

To select PostgreSQL array:

```go
var ids []int
err := db.NewSelect().
	Model((*Book)(nil)).
	ColumnExpr("array_agg(id)").
	Scan(ctx, pgdialect.Array(&ids))
```

To use subqueries:

```go
subq := db.NewSelect().Model((*Book)(nil)).Where("author_id = ?", 1)

err := db.NewSelect().Model().TableExpr("(?) AS book", subq).Scan(ctx, &books)
```

```sql
SELECT * FROM (
  SELECT "book"."id", "book"."title", "book"."text"
  FROM "books" AS "book" WHERE (author_id = 1)
) AS book
```

## Insert

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#InsertQuery).

```go
db.NewInsert().
    With("subq_name", subq).

    Model(&strct).
    Model(&slice).
    Model(&map). // only map[string]interface{}

    Column("col1", "col2"). // list of columns to insert
    ExcludeColumn("col1"). // all columns except col1
    ExcludeColumn("*"). // exclude all columns

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary expression
    TableExpr("(?) AS subq", subq).
    ModelTableExpr("table1 AS t1"). // overrides model table name

    On("CONFLICT (id) DO UPDATE").
	Set("title = EXCLUDED.title").

    WherePK(). // where using primary keys
    Where("id = ?", 123).
    Where("name LIKE ?", "my%").
    Where("? = 123", bun.Ident("id")).
    Where("id IN (?)", bun.In([]int64{1, 2, 3})).
    Where("id IN (?)", subq).
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

## Update

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#UpdateQuery).

```go
db.NewUpdate().
    With("subq_name", subq).

    Model(&strct).
    Model(&slice).
    Model(&map). // only map[string]interface{}

    Column("col1", "col2"). // list of columns to insert
    ExcludeColumn("col1"). // all columns except col1
    ExcludeColumn("*"). // exclude all columns

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary expression
    TableExpr("(?) AS subq", subq).
    ModelTableExpr("table1 AS t1"). // overrides model table name

    Set("col1 = ?", "value1").

    WherePK(). // where using primary keys
    Where("id = ?", 123).
    Where("name LIKE ?", "my%").
    Where("? = 123", bun.Ident("id")).
    Where("id IN (?)", bun.In([]int64{1, 2, 3})).
    Where("id IN (?)", subq).
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

To update single column:

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

## Delete

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#DeleteQuery).

```go
db.NewDelete().
    With("subq_name", subq).

    Model(&strct).
    Model(&slice).
    Model(&map). // only map[string]interface{}

    Table("table1", "table2"). // quotes table names
    TableExpr("table1 AS t1"). // arbitrary expression
    TableExpr("(?) AS subq", subq).
    ModelTableExpr("table1 AS t1"). // overrides model table name

    WherePK(). // where using primary keys
    Where("id = ?", 123).
    Where("name LIKE ?", "my%").
    Where("? = 123", bun.Ident("id")).
    Where("id IN (?)", bun.In([]int64{1, 2, 3})).
    Where("id IN (?)", subq).
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

## Creating tables

For the full list of supported methods, see
[API reference](https://pkg.go.dev/github.com/uptrace/bun#CreateTableQuery).

```go
db.NewCreateTable().

    Model(&strct).

    Table("table1"). // quotes table names
    TableExpr("table1"). // arbitrary expression
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

You can also modify query from the `BeforeCreateTableQuery` hook.

```go
var _ bun.BeforeCreateTableQueryHook = (*Book)(nil)

func (*Book) BeforeCreateTableQuery(ctx context.Context, query *bun.CreateTableQuery) error {
	query.ForeignKey(`("author_id") REFERENCES "users" ("id") ON DELETE CASCADE`)
	return nil
}

if _, err := db.NewCreateTable().Model((*Book)(nil)).Exec(ctx); err != nil {
	panic(err)
}
```

To create an index on the table, you can use `AfterCreateTableQuery` hook:

```go
var _ bun.AfterCreateTableQueryHook = (*Book)(nil)

func (*Book) AfterCreateTableQuery(ctx context.Context, query *bun.CreateTableQuery) error {
	_, err := query.DB().NewCreateIndex().
		Model((*Book)(nil)).
		Index("category_id_idx").
		Column("category_id").
		Exec(ctx)
	return err
}
```

See [example](https://github.com/uptrace/bun/tree/master/example/create-table-index) for details.
