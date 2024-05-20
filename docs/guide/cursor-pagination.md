---
title: Cursor pagination [PostgreSQL MySQL]
description: Cursor pagination is a useful technique for improving the performance and usability of web applications that display large sets of data.
keywords:
  - postgres cursor pagination
  - mysql cursor pagination
  - cursor pagination vs offset pagination
  - cursor based pagination postgresql
---

<UptraceCta />

# Cursor pagination for PostgreSQL/MySQL

Cursor pagination is a useful technique for improving performance and usability of web applications that display large sets of data.

With cursor pagination, the server sends a page of data to the client along with a cursor, which identifies the position of the last item in the page. The client can use this cursor to request the next page of data, passing the cursor as a parameter to the server.

![Cursor pagination](/cursor-pagination/cover.png)

## Introduction

Usually, you can paginate through results using `LIMIT X OFFSET Y`:

```sql
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 0; -- first page
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 10; -- second page
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 20; -- third page
```

Such pagination method works well, but you may notice that the query becomes slower and slower as the offset grows. That happens because `OFFSET 100000` tells database to read and discard 100,000 rows which makes performance with large offsets unacceptable. The usual response here is to limit the allowed offset range, for example, you could limit the number of allowed pages to 1000.

But what if you can't limit the number of pages? For example, GitHub must allow users to view all commits in a repo no matter how big a repo can be. The answer is cursor pagination.

## Cursor pagination

Cursor-based pagination works by returning to the client a pointer (cursor) to the last item on the page. To get the next page, the client passes the cursor to the server and the server returns results after the given cursor. The main limitation of this approach is that the client can't jump to a specific page and does not know the total number of pages.

<!-- prettier-ignore -->
::: tip
Cursor-based pagination provides much worse user experience than the classic pagination.
Use it only when you must.
:::

Because the cursor must unambiguously identify the row, you can only use cursor-based pagination on primary keys or columns with an unique constraint. That also ensures that the query uses an index and can quickly skip already paginated rows.

## Cursor pagination vs Offset pagination

Compared to traditional page-based pagination, cursor pagination has several advantages:

- **Performance**. Cursor pagination reduces the amount of data that needs to be retrieved from the database, resulting in faster page load times and reduced server load.

- **Stability**. Cursor pagination provides more stable and predictable pagination compared to page-based pagination, which can result in inconsistent pagination if data is added or removed while navigating pages.

All that comes at a cost of **reduced flexibility**. Cursor pagination does NOT allow users to jump to any point in the data set without having to traverse all previous pages.

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

To retrieve the previous page, we need to iterate backwards starting from the cursor pointing to the first item:

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

## Monitoring performance

To [monitor Bun performance](/guide/performance-monitoring.html), you can use OpenTelemetry instrumentation that comes with Bun.

By using OpenTelemetry, developers can gain valuable insight into the performance of their applications and the interactions between different components, making it easier to troubleshoot problems, optimize performance, and improve the overall reliability of distributed systems.

Uptrace is a [OpenTelemetry backend](https://uptrace.dev/blog/opentelemetry-backend.html) that supports distributed tracing, metrics, and logs. You can use it to monitor applications and troubleshoot issues.

![Uptrace Overview](/uptrace/home.png)

Uptrace comes with an intuitive query builder, rich dashboards, alerting rules with notifications, and integrations for most languages and frameworks.

Uptrace can process billions of spans and metrics on a single server and allows you to monitor your applications at 10x lower cost.

In just a few minutes, you can try Uptrace by visiting the [cloud demo](https://app.uptrace.dev/play) (no login required) or running it locally with [Docker](https://github.com/uptrace/uptrace/tree/master/example/docker). The source code is available on [GitHub](https://github.com/uptrace/uptrace).

- [OpenTelemetry MySQL](https://uptrace.dev/get/monitor/opentelemetry-mysql.html)
- [OpenTelemetry vs Prometheus](https://uptrace.dev/blog/opentelemetry-vs-prometheus.html)
