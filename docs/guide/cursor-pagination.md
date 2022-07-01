---
title: Cursor pagination
---

<UptraceCta />

<CoverImage title="Efficient database pagination using cursors" />

## Introduction

Usually, you can paginate through results using `LIMIT X OFFSET Y`:

```sql
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 0; -- first page
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 10; -- second page
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 20; -- third page
```

Such pagination method works well, but you may notice that the query becomes slower and slower as
the offset grows. That happens because `OFFSET 100000` tells database to read and discard 100,000
rows which makes performance with large offsets unacceptable. The usual response here is to limit
the allowed offset range, for example, you could limit the number of allowed pages to 1000.

But what if you can't limit the number of pages? For example, GitHub must allow users to view all
commits in a repo no matter how big a repo can be. The answer is cursor pagination.

## Cursor pagination

Cursor-based pagination works by returning to the client a pointer (cursor) to the last item on the
page. To get the next page, the client passes the cursor to the server and the server returns
results after the given cursor. The main limitation of this approach is that the client can't jump
to a specific page and does not know the total number of pages.

<!-- prettier-ignore -->
::: tip
Cursor-based pagination provides much worse user experience than the classic pagination.
Use it only when you must.
:::

Because the cursor must unambiguously identify the row, you can only use cursor-based pagination on
primary keys or columns with an unique constraint. That also ensures that the query uses an index
and can quickly skip already paginated rows.

## Example

Let's paginate the following model using primary key as a pointer:

```sql
type Entry struct {
	ID   int64
	Text string
}
```

Our helper `Cursor` struct may look like this:

```go
type Cursor struct {
	Start int64 // pointer to the first item for the previous page
	End   int64 // pointer to the last item for the next page
}
```

To retrieve the next page, we need to continue from the cursor pointing to the last item:

```go
func selectNextPage(ctx context.Context, db *bun.DB, cursor int64) ([]Entry, Cursor, error) {
	var entries []Entry
	if err := db.NewSelect().
		Model(&entries).
		Where("id > ?", cursor).
		OrderExpr("id ASC").
		Limit(10).
		Scan(ctx); err != nil {
		return nil, Cursor{}, err
	}
	return entries, NewCursor(entries), nil
}
```

To retrieve the previous page, we need to iterate backwards starting from the cursor pointing to the
first item:

```go
func selectPrevPage(ctx context.Context, db *bun.DB, cursor int64) ([]Entry, Cursor, error) {
	var entries []Entry
	if err := db.NewSelect().
		Model(&entries).
		Where("id < ?", cursor).
		OrderExpr("id DESC").
		Limit(10).
		Scan(ctx); err != nil {
		return nil, Cursor{}, err
	}
	return entries, NewCursor(entries), nil
}
```

We can use those methods like this:

```go
page1, cursor, err := selectNextPage(ctx, db, 0)
if err != nil {
	panic(err)
}

page2, cursor, err := selectNextPage(ctx, db, cursor.End)
if err != nil {
	panic(err)
}

prevPage, _, err := selectPrevPage(ctx, db, cursor.Start)
if err != nil {
	panic(err)
}
```

See [example](https://github.com/uptrace/bun/tree/master/example/cursor-pagination) for details.
