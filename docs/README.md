---
home: true
title: SQL-first Golang ORM [get things done in 2022]

actions:
  - text: Get Started
    link: /guide/golang-orm.html
    type: primary
  - text: Introduction
    link: /guide/
    type: secondary

features:
  - title: SQL-first
    details: Bun's goal is to help you write SQL, not to hide it behind awkward constructs.
  - title: '*sql.DB compatible'
    details: Bun uses database/sql and extends it in a compatible and idiomatic way.
  - title: Database-agnostic
    details: Out-of-the box works with PostgreSQL, MySQL 5.7+, MSSQL, and SQLite.
  - title: Migrations
    details: Keep your database schema updated with Go and SQL-based migrations.
  - title: Fixtures
    details: Provide initial data for your application with YAML fixtures.
  - title: Starter kit
    details: Modern app skeleton puts everything together and helps you get started.
---

## Why another Golang ORM?

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

## Quickstart

<CodeGroup>
  <CodeGroupItem title="SQLite">

```go
package main

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	"github.com/uptrace/bun/driver/sqliteshim"
	"github.com/uptrace/bun/extra/bundebug"
)

func main() {
	ctx := context.Background()

	// Open an in-memory SQLite database.
	sqlite, err := sql.Open(sqliteshim.ShimName, "file::memory:?cache=shared")
	if err != nil {
		panic(err)
	}

	// Create a Bun db on top of it.
	db := bun.NewDB(sqlite, sqlitedialect.New())

	// Print all queries to stdout.
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))

	var rnd int64

	// Select a random number.
	if err := db.NewSelect().ColumnExpr("random()").Scan(ctx, &rnd); err != nil {
		panic(err)
	}

	fmt.Println(rnd)
}
```

  </CodeGroupItem>

  <CodeGroupItem title="Postgres">

```go
package main

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
	"github.com/uptrace/bun/extra/bundebug"
)

func main() {
	ctx := context.Background()

	// Open a PostgreSQL database.
	dsn := "postgres://postgres:@localhost:5432/test?sslmode=disable"
	pgdb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))

	// Create a Bun db on top of it.
	db := bun.NewDB(pgdb, pgdialect.New())

	// Print all queries to stdout.
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))

	var rnd float64

	// Select a random number.
	if err := db.NewSelect().ColumnExpr("random()").Scan(ctx, &rnd); err != nil {
		panic(err)
	}

	fmt.Println(rnd)
}
```

  </CodeGroupItem>

  <CodeGroupItem title="MySQL">

```go
package main

import (
	"context"
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/mysqldialect"
	"github.com/uptrace/bun/extra/bundebug"
)

func main() {
	ctx := context.Background()

	// Open a MySQL 5.7+ database.
	sqldb, err := sql.Open("mysql", "root:pass@/test")
	if err != nil {
		panic(err)
	}

	// Create a Bun db on top of it.
	db := bun.NewDB(sqldb, mysqldialect.New())

	// Print all queries to stdout.
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))

	var rnd float64

	// Select a random number.
	if err := db.NewSelect().ColumnExpr("rand()").Scan(ctx, &rnd); err != nil {
		panic(err)
	}

	fmt.Println(rnd)
}
```

  </CodeGroupItem>

  <CodeGroupItem title="MSSQL">

```go
package main

import (
	"context"
	"database/sql"
	"fmt"

	_ "github.com/denisenkom/go-mssqldb"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/mssqldialect"
	"github.com/uptrace/bun/extra/bundebug"
)

func main() {
	ctx := context.Background()

	// Open a MSSQL database.
	sqldb, err := sql.Open("sqlserver", "sqlserver://sa:passWORD1@localhost:1433?database=test")
	if err != nil {
		panic(err)
	}

	// Create a Bun db on top of it.
	db := bun.NewDB(sqldb, mssqldialect.New())

	// Print all queries to stdout.
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))

	var rnd float64

	// Select a random number.
	if err := db.NewSelect().ColumnExpr("rand()").Scan(ctx, &rnd); err != nil {
		panic(err)
	}

	fmt.Println(rnd)
}
```

  </CodeGroupItem>
</CodeGroup>
