---
title: Golang Drop Table [PostgreSQL MySQL]
---

<CoverImage title="Golang Drop Table PostgreSQL MySQL" />

[[toc]]

## API

To see the full list of supported methods, see [DropTableQuery](https://pkg.go.dev/github.com/uptrace/bun#DropTableQuery).

```go
db.NewDropTable().

	Model(&strct).

	Table("table1"). // quotes table names
	TableExpr("table1"). // arbitrary unsafe expression
	ModelTableExpr("table1"). // overrides model table name

	IfExists().

	Cascade().
	Restrict().

	Exec(ctx)
```

## Example

To drop PostgreSQL/MySQL table:

```go
_, err := db.NewDropTable().Model((*Book)(nil)).IfExists().Exec(ctx)
if err != nil {
	panic(err)
}
```
