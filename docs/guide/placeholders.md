# SQL placeholders

## Introduction

Bun recognizes `?` in queries as a placeholder and replaces it with an arg. Bun quotes and escapes
stringly values while also removing any null bytes.

## Basic placeholders

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

## Identifiers and safe queries

To quote SQL identifiers (for example, a column or a table name), use `bun.Ident`:

```go
// "foo" = 'bar'
q.ColumnExpr("? = ?", bun.Ident("foo"), "bar")
```

To disable quotation altogether, use `bun.Safe`:

```go
// FROM (generate_series(0, 10)) AS foo
q.TableExpr("(?) AS foo", bun.Safe("generate_series(0, 10)"))
```

## IN

To use `IN` with multiple values, use `bun.In`:

```go
// WHERE foo IN ('hello', 'world')
q.Where("foo IN (?)", bun.In([]string{"hello", "world"}))
```

To use `IN` with composite (multiple) keys:

```go
// WHERE (foo, bar) IN (('hello', 'world'), ('hell', 'yeah'))
q.Where("(foo, bar) IN (?)", bun.In([][]string{
	{"hello", "world"},
	{"hell", "yeah"},
}))
```

## Global DB args

Bun also supports global args:

```go
// db1 and db2 share the same *sql.DB, but have different named args.
db1 := db.WithNamedArg("SCHEMA", "foo")
db2 := db.WithNamedArg("SCHEMA", "bar")

// FROM foo.table
db1.NewSelect().TableExpr("?SCHEMA.table")

// FROM bar.table
db2.NewSelect().TableExpr("?SCHEMA.table")
```
