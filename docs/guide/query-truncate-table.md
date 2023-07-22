---
title: Truncate table [PostgreSQL MySQL]
---

<CoverImage title="Golang Truncate Table PostgreSQL MySQL" />

[[toc]]

## API

To see the full list of supported methods, see [TruncateTableQuery](https://pkg.go.dev/github.com/uptrace/bun#TruncateTableQuery).

```go
db.NewTruncateTable().

	Model(&strct).

	Table("table1"). // quotes table names
	TableExpr("table1"). // arbitrary unsafe expression
	ModelTableExpr("table1"). // overrides model table name

	ContinueIdentity().
	Cascade().
	Restrict().

	Exec(ctx)
```

## Example

To drop a table:

```go
_, err := db.NewTruncateTable().Model((*Book)(nil)).Exec(ctx)
if err != nil {
	panic(err)
}
```
