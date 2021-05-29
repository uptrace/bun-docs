# Writing queries

## Design

Bun's goal is to help you write good SQL, not to hide it behind awkward constructs. It is a good
idea to write and test your query using CLI for your database, then to rewrite in using Bun's query
builder.

The main bun features are:

- Splitting long queries into logically separated blocks.
- Replacing `?` placeholders with properly escaped values.
- Generating the list of columns and some joins for Go models.

For example, the following Go code:

```go
err := db.NewSelect().
	Model(book).
	ColumnExpr("lower(name)").
	Where("? = ?", bun.Ident("id"), "some-id").
	Scan(ctx)
```

Generates the following query:

```sql
SELECT lower(name)
FROM "books"
WHERE "id" = 'some-id'
```

## Select

| SQL                                 | Bun                                                     |
| ----------------------------------- | ------------------------------------------------------- |
| SELECT col1, col2                   | Column("col1", "col2")                                  |
| SELECT col1, col2                   | ColumnExpr("col1, col2")                                |
| SELECT count()                      | ColumnExpr("count()")                                   |
| SELECT count("id")                  | ColumnExpr("count(?)", bun.Ident("id"))                 |
| FROM "table1", "table2"             | Table("table1", "table2")                               |
| FROM table1, table2                 | TableExpr("table1, table2")                             |
| JOIN table1 ON col1 = 'value1'      | Join("JOIN table1 ON col1 = ?", "value1")               |
| JOIN table1 ON col1 = 'value1'      | Join("JOIN table1").JoinOn("col1 = ?", "value1")        |
| LEFT JOIN table1 ON col1 = 'value1' | Join("LEFT JOIN table1 ON col1 = ?", "value1")          |
| WHERE id = 1                        | Where("id = ?", 1)                                      |
| WHERE "foo" = 'bar'                 | Where("? = ?", bun.Ident("foo"), "bar")                 |
| WHERE id = 1 OR foo = 'bar'         | Where("id = ?", 1).WhereOr("foo = ?", "bar")            |
| GROUP BY "col1", "col2"             | Group("col1", "col2")                                   |
| GROUP BY col1, col2                 | GroupExpr("col1, col2")                                 |
| GROUP BY "col1", "col2"             | GroupExpr("?, ?", bun.Ident("col1"), bun.Ident("col2")) |
| ORDER BY "col1" ASC                 | Order("col1 ASC")                                       |
| ORDER BY col1 ASC                   | OrderExpr("col1 ASC")                                   |
| ORDER BY "col1" ASC                 | OrderExpr("? ASC", bun.Ident("col1"))                   |
| LIMIT 10                            | Limit(10)                                               |
| OFFSET 1000                         | Offset(1000)                                            |

Select book by id:

```go
book := new(Book)
err := db.NewSelect().Model(book).Where("id = ?", 1).Scan(ctx)
```

```sql
SELECT "book"."id", "book"."title", "book"."text"
FROM "books" WHERE id = 1
```

Select only book title and text:

```go
err := db.NewSelect().
	Model(book).
	Column("title", "text").
	Where("id = ?", 1).
	Scan(ctx)
```

```sql
SELECT "title", "text" FROM "books" WHERE id = 1
```

Select only book title and text into variables:

```go
var title, text string
err := db.NewSelect().
	Model((*Book)(nil)).
	Column("title", "text").
	Where("id = ?", 1).
	Scan(ctx, &title, &text)
```

```sql
SELECT "title", "text"
FROM "books" WHERE id = 1
```

Select book using `WHERE ... AND ...`:

```go
err := db.
	NewSelect().
	Model(book).
	Where("id > ?", 100).
	Where("title LIKE ?", "my%").
	Limit(1).
	Scan(ctx)
```

```sql
SELECT "book"."id", "book"."title", "book"."text"
FROM "books"
WHERE (id > 100) AND (title LIKE 'my%')
LIMIT 1
```

Select book using `WHERE ... OR ...`:

```go
err := db.
	NewSelect().
	Model(book).
	Where("id > ?", 100).
	WhereOr("title LIKE ?", "my%").
	Limit(1).
	Scan(ctx)
```

```sql
SELECT "book"."id", "book"."title", "book"."text"
FROM "books"
WHERE (id > 100) OR (title LIKE 'my%')
LIMIT 1
```

Select book user `WHERE ... AND (... OR ...)`:

```go
err := db.NewSelect().
    Model(book).
    Where("title LIKE ?", "my%").
    WhereGroup(" AND ", func(q *bun.Query) *bun.Query {
        q = q.WhereOr("id = 1").
            WhereOr("id = 2")
        return q, nil
    }).
    Limit(1).
    Scan(ctx)
```

```sql
SELECT "book"."id", "book"."title", "book"."text"
FROM "books"
WHERE (title LIKE 'my%') AND (id = 1 OR id = 2)
LIMIT 1
```

Select first 20 books:

```go
var books []Book
err := db.NewSelect().Model(&books).Order("id ASC").Limit(20).Scan(ctx)
```

```sql
SELECT "book"."id", "book"."title", "book"."text"
FROM "books"
ORDER BY id ASC LIMIT 20
```

Count books:

```go
count, err := db.NewSelect().Model((*Book)(nil)).Count(ctx)
```

```sql
SELECT count(*) FROM "books"
```

Select 20 books and count all books:

```go
count, err := db.NewSelect().Model(&books).Limit(20).ScanAndCount(ctx)
```

```sql
SELECT "book"."id", "book"."title", "book"."text"
FROM "books" LIMIT 20;

SELECT count(*) FROM "books";
```

Select author ID and number of books:

```go
var res []struct {
	AuthorID  int
	BookCount int
}
err := db.Model((*Book)(nil)).
	Column("author_id").
	ColumnExpr("count(*) AS book_count").
	Group("author_id").
	Order("book_count DESC").
	Scan(ctx, &res)
```

```sql
SELECT "author_id", count(*) AS book_count
FROM "books" AS "book"
GROUP BY author_id
ORDER BY book_count DESC
```

Select book IDs as PostgreSQL array:

```go
var ids []int
err := db.NewSelect().
	Model((*Book)(nil)).
	ColumnExpr("array_agg(id)").
	Scan(ctx, pgdialect.Array(&ids))
```

```sql
SELECT array_agg(id) FROM "books"
```

Select by multiple ids:

```go
ids := []int{1, 2, 3}
err := db.NewSelect().
	Model((*Book)(nil)).
	Where("id IN (?)", bun.In(ids)).
	Scan(ctx)
```

```sql
SELECT * FROM books WHERE id IN (1, 2, 3)
```

Select books for update:

```go
book := new(Book)
err := db.NewSelect().
	Model(book).
	Where("id = ?", 1).
	For("UPDATE").
	Scan(ctx)
```

```sql
SELECT * FROM books WHERE id = 1 FOR UPDATE
```

## CTE

Select books using WITH statement:

```go
authorBooks := db.NewSelect().Model((*Book)(nil)).Where("author_id = ?", 1)

err := db.NewSelect().
	Model().
	With("author_books", authorBooks).
	Table("author_books").
	Scan(ctx, &books)
```

```sql
WITH "author_books" AS (
  SELECT "book"."id", "book"."title", "book"."text"
  FROM "books" AS "book" WHERE (author_id = 1)
)
SELECT * FROM "author_books"
```

Same query using WrapWith:

```go
err := db.NewSelect().
	Model(&books).
	Where("author_id = ?", 1).
	WrapWith("author_books").
	Table("author_books").
	Scan(ctx, &books)
```

```sql
WITH "author_books" AS (
  SELECT "book"."id", "book"."title", "book"."text"
  FROM "books" AS "book" WHERE (author_id = 1)
)
SELECT * FROM "author_books"
```

## Subqueries

Subquery in FROM:

```go
authorBooks := db.NewSelect().Model((*Book)(nil)).Where("author_id = ?", 1)

err := db.NewSelect().Model().TableExpr("(?) AS book", authorBooks).Scan(ctx, &books)
```

```sql
SELECT * FROM (
  SELECT "book"."id", "book"."title", "book"."text"
  FROM "books" AS "book" WHERE (author_id = 1)
) AS book
```

Subquery in WHERE:

```go
authorBooks := db.NewSelect().Model((*Book)(nil)).ColumnExpr("id").Where("author_id = ?", 1)

err := db.NewSelect().Model(&books).Where("id IN (?)", authorBooks).Scan(ctx)
```

```sql
SELECT * FROM "books" WHERE id IN (
  SELECT id FROM "books" AS "book" WHERE (author_id = 1)
)
```

### Relations

Select book and associated author:

```go
err := db.NewSelect().Model(book).Relation("Author").Scan(ctx)
```

```sql
SELECT
  "book"."id", "book"."title", "book"."text",
  "author"."id" AS "author__id", "author"."name" AS "author__name"
FROM "books"
LEFT JOIN "users" AS "author" ON "author"."id" = "book"."author_id"
WHERE id = 1
```

Select book ID and the associated author id:

```go
err := db.NewSelect().
	Model(book).
	Column("book.id").
	Relation("Author", func (q *bun.SelectQuery) *bun.SelectQuery {
		return q.ColumnExpr("id")
	}).
	Scan(ctx)
```

```sql
SELECT "book"."id", "author"."id" AS "author__id"
FROM "books"
LEFT JOIN "users" AS "author" ON "author"."id" = "book"."author_id"
WHERE id = 1
```

Select book and join author without selecting it:

```go
err := db.NewSelect().
	Model(book).
	Relation("Author", func (q *bun.SelectQuery) *bun.SelectQuery {
		return q.Exclude("*")
	}).
	Scan(ctx)
```

```sql
SELECT "book"."id"
FROM "books"
LEFT JOIN "users" AS "author" ON "author"."id" = "book"."author_id"
WHERE id = 1
```

## Insert

### Insert struct

Insert new book returning primary keys:

```go
_, err := db.NewInsert().Model(book).Exec(ctx)
```

```sql
INSERT INTO "books" (title, text) VALUES ('my title', 'my text') RETURNING "id"
```

Insert new book returning all columns:

```go
_, err := db.NewInsert().Model(book).Returning("*").Exec(ctx)
```

```sql
INSERT INTO "books" (title, text) VALUES ('my title', 'my text') RETURNING *
```

Insert new book or update existing one:

```go
_, err := db.NewInsert().
	Model(book).
	On("CONFLICT (id) DO UPDATE").
	Set("title = EXCLUDED.title").
	Exec(ctx)
```

```sql
INSERT INTO "books" ("id", "title") VALUES (100, 'my title')
ON CONFLICT (id) DO UPDATE SET title = 'title version #1'
```

### Insert slice

Insert slice in a single query:

```go
books := []*Book{book1, book2}
_, err := db.NewInsert().Model(&books).Exec(ctx)
```

```sql
INSERT INTO "books" (title, text) VALUES ('title1', 'text2'), ('title2', 'text2') RETURNING "id"
```

### Insert map

Insert `map[string]interface{}`:

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

### Insert from Select

```go
selq := db.NewSelect().
	Model((*Book)(nil)).
	Where("1 = 1")

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
  WHERE (1 = 1)
)
INSERT INTO "books"
SELECT * FROM sel
```

## Update

### Update struct

Update all columns except primary keys:

```go
book := &Book{
	ID:	   1,
	Title: "my title",
	Text:  "my text",
}
res, err := db.NewUpdate().Model(book).WherePK().Exec(ctx)
```

```sql
UPDATE books SET title = 'my title', text = 'my text' WHERE id = 1
```

Update only column `title` using `SET`:

```go
res, err := db.NewUpdate().Model(book).Set("title = ?title").WherePK().Exec(ctx)
```

```sql
UPDATE books SET title = 'my title' WHERE id = 1
```

Alternatively:

```go
res, err := db.NewUpdate().
	Model(book).
	Column("title").
	Where("id = ?", 1).
	Exec(ctx)
```

```sql
UPDATE books SET title = 'my title' WHERE id = 1
```

Upper column `title` and scan it:

```go
var title string
res, err := db.Model(book).
	Set("title = upper(title)").
	Where("id = ?", 1).
	Returning("title").
	Exec(ctx, &title)
```

```sql
UPDATE books SET title = upper(title) WHERE id = 1 RETURNING title
```

### Update slice

Update multiple books with single query:

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

### Update map

Update `map[string]interface{}`:

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

## Delete

### Delete struct

Delete book by id:

```go
res, err := db.NewDelete().Model(book).Where("id = ?", 1).Exec(ctx)
```

```sql
DELETE FROM "books" WHERE id = 1
```

Delete book by title:

```go
res, err := db.NewDelete().Model(book).Where("title = ?", "title").Exec(ctx)
```

```sql
DELETE FROM "books" WHERE title = 'my title'
```

### Delete slice

Delete multiple books using ids:

```go
res, err := db.NewDelete().
	Model((*Book)(nil)).
	Where("id IN (?)", bun.In([]int{1, 2})).
	Exec(ctx)
```

```sql
DELETE FROM "books" WHERE id IN (1, 2)
```

Delete multiple books using structs:

```go
books := []*Book{book1, book2} // slice of books with ids

res, err := db.NewDelete().Model(&books).WherePK().Exec(ctx)
```

```sql
DELETE FROM "books" WHERE id IN (1, 2)
```

## Joins

Select a book and manually join the book author:

```go
book := new(Book)
err := db.NewSelect().
    Model(book).
    ColumnExpr("book.*").
    ColumnExpr("a.id AS author__id, a.name AS author__name").
    Join("JOIN authors AS a ON a.id = book.author_id").
    OrderExpr("book.id ASC").
    Limit(1).
    Scan(ctx)
```

```
SELECT book.*, a.id AS author__id, a.name AS author__name
FROM books
JOIN authors AS a ON a.id = book.author_id
ORDER BY book.id ASC
LIMIT 1
```

Join conditions can be split using `JoinOn`:

```go
q.Join("LEFT JOIN authors AS a").
    JoinOn("a.id = book.author_id").
    JoinOn("a.active = ?", true)
```

## Creating tables

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

You can also add query options from the `BeforeCreateTableQuery` hook. For example, the query above
can be written as:

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

To create an index on the table, define `AfterCreateTableQuery` on the model:

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

## Scanning rows

To execute custom query and scan all rows:

```go
rows, err := db.QueryContext(ctx, "SELECT * FROM books")
if err != nil {
    panic(err)
}

err = db.ScanRows(ctx, rows, &books)
```

To execute custom query and scan row by row:

```go
rows, err := db.NewSelect().Model((*Book)(nil)).Rows(ctx)
if err != nil {
	panic(err)
}
defer rows.Close()

for rows.Next() {
	book := new(Book)
	if err := db.ScanRow(ctx, rows, book); err != nil {
		panic(err)
	}
}

if err := rows.Err(); err != nil {
	panic(err)
}
```
