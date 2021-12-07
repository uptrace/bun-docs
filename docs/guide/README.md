# Introduction

Bun is a SQL-first database client for Go. SQL-first means that most SQL queries can be
automatically compiled to Bun expressions and Bun expressions look and feel like SQL queries.

The purpose of Bun is to allow writing queries using the good old SQL and to help scanning results
into common Go types: structs, maps, slices, and scalars.

## How it works

Bun wraps `sql.DB` to provide query [builder](queries.md) and [hooks](hooks.md). The original
`sql.DB` is available as `db.DB` and can be used without any restrictions.

```go
type DB struct {
	*sql.DB
    ...
}
```

Bun comes with [dialects](drivers.md) for each supported database. Bun uses dialects to discover
available features when building queries and scanning query results. For example, to connect to a
PostgreSQL server, you should use PostgreSQL driver (for example,
[pgdriver](https://github.com/uptrace/bun/tree/master/driver/pgdriver)) and PostgreSQL dialect
(pgdialect).

Bun provides [fixtures](fixtures.md) to load initial data and [migrations](migrations.md) to update
database schema. You can also use [Bun starter kit](starter-kit.md) to quickly bootstrap an app
using those packages.

## Why another database client?

So you can elegantly write complex queries:

```go
regionalSales := db.NewSelect().
	ColumnExpr("region").
	ColumnExpr("SUM(amount) AS total_sales").
	TableExpr("orders").
	GroupExpr("region")

topRegions := db.NewSelect().
	ColumnExpr("region").
	TableExpr("regional_sales").
	Where("total_sales > (SELECT SUM(total_sales) / 10 FROM regional_sales)")

err := db.NewSelect().
	With("regional_sales", regionalSales).
	With("top_regions", topRegions).
	ColumnExpr("region").
	ColumnExpr("product").
	ColumnExpr("SUM(quantity) AS product_units").
	ColumnExpr("SUM(amount) AS product_sales").
	TableExpr("orders").
	Where("region IN (SELECT region FROM top_regions)").
	GroupExpr("region").
	GroupExpr("product").
	Scan(ctx)
```

```sql
WITH regional_sales AS (
    SELECT region, SUM(amount) AS total_sales
    FROM orders
    GROUP BY region
), top_regions AS (
    SELECT region
    FROM regional_sales
    WHERE total_sales > (SELECT SUM(total_sales)/10 FROM regional_sales)
)
SELECT region,
       product,
       SUM(quantity) AS product_units,
       SUM(amount) AS product_sales
FROM orders
WHERE region IN (SELECT region FROM top_regions)
GROUP BY region, product
```

## Why Not ...?

### GORM

It is usually easier to write complex queries with Bun rather than [GORM](https://gorm.io/). Out of
the box, Bun has better integration with database-specific functionality, for example, PostgreSQL
arrays. Bun is also faster, partly because Bun is smaller in size and scope.

Bun does not support such popular GORM features like automatic migrations (you can try
[fixtures](fixtures.md) instead), optimizer/index/comment hints, and database resolver.

### Ent

With Bun you can use your previous experience working with SQL DBMS and Go to write fast and
idiomatic code. Bun's goal is to help you write SQL, not replace or hide it.

With [Ent](https://entgo.io/) your previous experience does not mean as much and can be even
misleading because Ent provides a new/different way to write Go apps and you don't have much choice
but to follow it.

### go-pg

Bun is a rewrite of go-pg that works on top of `sql.DB` instead of using custom API. As a
consequence, Bun is slightly less efficient than go-pg but works with different databases.

Eventually Bun will replace go-pg. To migrate an existing go-pg app to Bun, see this
[guide](pg-migration.md).
