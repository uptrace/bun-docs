---
title: Golang Merge [PostgreSQL MySQL]
---

<CoverImage title="Golang Merge PostgreSQL MySQL" />

[[toc]]

## API

To see the full list of supported methods, see [MergeQuery](https://pkg.go.dev/github.com/uptrace/bun#MergeQuery).

```go
db.NewMerge().
	Model(&strct).
	Model(&slice).

	Table("table1", "table2"). // quotes table names
	TableExpr("table1 AS t1"). // arbitrary unsafe expression
	TableExpr("(?) AS alias", subquery).
	ModelTableExpr("table1 AS t1"). // overrides model table name

    On(expr string, args ...any).
    When(expr string, args ...any).
    WhenInsert(expr string, func(q *bun.InsertQuery) *bun.InsertQuery).
    WhenUpdate(expr string, func(q *bun.UpdateQuery) *bun.UpdateQuery).
    WhenDelete(expr string).
```

## Example

To create a `MERGE` query for MSSQL RDMBS:

```go
type Model struct {
	ID    int64 `bun:",pk,autoincrement"`
	Name  string
	Value string
}

newModels := []*Model{
	{Name: "A", Value: "world"},
	{Name: "B", Value: "test"},
}

return db.NewMerge().
	Model(new(Model)).
	With("_data", db.NewValues(&newModels)).
	Using("_data").
	On("?TableAlias.name = _data.name").
	WhenUpdate("MATCHED", func(q *bun.UpdateQuery) *bun.UpdateQuery {
		return q.Set("value = _data.value")
	}).
	WhenInsert("NOT MATCHED", func(q *bun.InsertQuery) *bun.InsertQuery {
		return q.Value("name", "_data.name").Value("value", "_data.value")
	}).
	Returning("$action")
```
