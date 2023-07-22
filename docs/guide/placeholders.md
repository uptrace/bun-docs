---
title: SQL Placeholders
---

<CoverImage title="SQL Placeholders" />

## Introduction

Bun recognizes `?` in queries as placeholders and replaces them with provided args. Bun quotes and escapes stringly values and removes null bytes.

## Basic and positional placeholders

To use basic placeholders:

```go
// SELECT 'foo', 'bar'
db.ColumnExpr("?, ?", 'foo', 'bar')
```

To use positional placeholders:

```go
// SELECT 'foo', 'bar', 'foo'
db.ColumnExpr("?0, ?1, ?0", 'foo', 'bar')
```

## bun.Ident

To quote SQL identifiers, for example, a column or a table name, use `bun.Ident`:

```go
q.ColumnExpr("? = ?", bun.Ident("foo"), "bar")
```

```sql
"foo" = 'bar' -- PostgreSQL
`foo` = 'bar' -- MySQL
```

## bun.Safe

To disable quotation altogether, use `bun.Safe`:

```go
q.TableExpr("(?) AS foo", bun.Safe("generate_series(0, 10)"))
```

```sql
FROM (generate_series(0, 10)) AS foo
```

## IN

Provides a `bun.In` helper to generate `IN (...)` queries:

```go
// WHERE foo IN ('hello', 'world')
q.Where("foo IN (?)", bun.In([]string{"hello", "world"}))
```

For composite (multiple) keys you can use nested slices:

```go
// WHERE (foo, bar) IN (('hello', 'world'), ('hell', 'yeah'))
q.Where("(foo, bar) IN (?)", bun.In([][]string{
	{"hello", "world"},
	{"hell", "yeah"},
}))
```

## Model placeholders

Bun also supports the following model placeholders:

- `?TableName` - model table name, for example, `"users"`.
- `?TableAlias` - model table alias, for example, `"user"`.
- `?PKs` - table primary keys, for example, `"id"`
- `?TablePKs` - table primary keys with the alias, for example, `"user"."id"`
- `?Columns` - table columns, for example, `"id", "name", "emails"`.
- `?TableColumns` - table columns with the alias, for example, `"user"."id", "user"."name", "user"."emails"`.

See [placeholders](https://github.com/uptrace/bun/tree/master/example/placeholders) example for details.

## Global placeholders

Bun also supports global placeholders:

```go
// db1 and db2 share the same *sql.DB, but have different named args.
db1 := db.WithNamedArg("SCHEMA", bun.Ident("foo"))
db2 := db.WithNamedArg("SCHEMA", bun.Ident("bar"))

// FROM foo.table
db1.NewSelect().TableExpr("?SCHEMA.table")

// FROM bar.table
db2.NewSelect().TableExpr("?SCHEMA.table")
```
