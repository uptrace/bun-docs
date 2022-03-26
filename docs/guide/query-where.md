---
title: Where
---

# Where PostgreSQL/MySQL

[[toc]]

## Basics

You can use arbitrary unsafe expressions in `Where`:

```go
q = q.Where("column LIKE 'hello%'")
```

To safely build dynamic WHERE clauses, use [placeholders](placeholders.md) and `bun.Ident`:

```go
q = q.Where("? LIKE ?", bun.Ident("mycolumn"), "hello%")
```

## WHERE IN

If you already have a list of ids, use `bun.In`:

```go
q = q.Where("user_id IN (?)", bun.In([]int64{1, 2, 3}))
```

You can also use subqueries:

```go
subq := db.NewSelect().Model((*User)(nil)).Column("id").Where("active")

q = q.Where("user_id IN (?)", subq)
```

## WherePK

`WherePK` allows to auto-generate a WHERE clause using model primary keys:

```go
users := []User{
    {ID: 1},
    {ID: 2},
    {ID: 3},
}
err := db.NewSelect().Model(&users).WherePK().Scan(ctx)
```

```sql
SELECT * FROM users WHERE id IN (1, 2, 3)
```

`WherePK` also accepts a list of columns that can be used instead of primary keys to indentify rows:

```go
users := []User{
	{Email: "one@my.com"},
	{Email: "two@my.com"},
	{Email: "three@my.com"},
}
err := db.NewSelect().Model(&users).WherePK("email").Scan(ctx)
```

```sql
SELECT * FROM users WHERE email IN ('one@my.com', 'two@my.com', 'three@my.com')
```

## WHERE VALUES

You can build complex queries using [CTE](query-common-table-expressions.md) and `VALUES`:

```go
users := []User{
	{ID: 1, Email: "one@my.com"},
	{ID: 2, Email: "two@my.com"},
}

err := db.NewSelect().
	With("data", db.NewValues(&users).WithOrder()).
	Model(&users).
	Where("user.id = data.id").
	OrderExpr("data._order").
	Scan(ctx)
```

```sql
WITH "data" ("id", "email", _order) AS (
  VALUES
    (42::BIGINT, 'one@my.com'::VARCHAR, 0),
    (43::BIGINT, 'two@my.com'::VARCHAR, 1)
)
SELECT "user"."id", "user"."email"
FROM "users" AS "user"
WHERE (user.id = data.id)
ORDER BY data._order
```

## Grouping

You can use `WhereOr` to join conditions with logical `OR`:

```go
q = q.Where("id = 1").WhereOr("id = 2").WhereOr("id = 3")
```

To group conditions with parentheses, use `WhereGroup`:

```go
q = q.
	WhereGroup(" AND ", func(q *bun.SelectQuery) *bun.SelectQuery {
		return q.Where("id = 1").WhereOr("id = 2").WhereOr("id = 3")
	}).
	WhereGroup(" AND NOT ", func(q *bun.SelectQuery) *bun.SelectQuery {
		return q.Where("active").WhereOr("archived")
	})
```

```sql
WHERE (id = 1 OR id = 2 OR id = 3) AND NOT (active OR archived)
```
