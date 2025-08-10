---
title: "Bun: The SQL-first Golang ORM that doesn't get in your way"
home: true
heroImage: /bun/home.png
tagline: Write elegant SQL queries with type safety and performance. No magic, just pure Go and SQL working together.

actions:
  - text: Get Started →
    link: /guide/golang-orm.html
    type: primary
  - text: View Examples
    link: /guide/
    type: secondary
  - text: GitHub ⭐
    link: https://github.com/uptrace/bun
    type: secondary

features:
  - title: 🎯 SQL-first Philosophy
    details: Write the SQL you know and love. Bun translates your intent into clean, optimized queries without hiding the SQL behind abstractions.
  - title: ⚡ Zero-overhead Performance
    details: Built on database/sql with minimal overhead. Get raw SQL performance with the convenience of an ORM.
  - title: 🔄 Database Agnostic
    details: One codebase, multiple databases. Works seamlessly with PostgreSQL, MySQL 5.7+, MSSQL, and SQLite.
  - title: 🛠 Type-safe Queries
    details: Catch errors at compile time with Go's type system. IntelliSense support for columns, tables, and relationships.
  - title: 📦 Migration System
    details: Version control your database schema with Go and SQL-based migrations. Keep your team in sync effortlessly.
  - title: 🚀 Production Ready
    details: Battle-tested features including connection pooling, query hooks, fixtures, and comprehensive testing utilities.
---

## Why Bun? Because SQL shouldn't be scary.

Traditional ORMs force you to learn their DSL and hide your SQL behind layers of abstraction. Bun takes a different approach: **embrace SQL, enhance it with Go's type safety**.

### Complex queries made elegant

Transform this complex analytical query from a maintenance nightmare into readable, maintainable Go code:

```go
// Build complex queries step by step
regionalSales := db.NewSelect().
	ColumnExpr("region").
	ColumnExpr("SUM(amount) AS total_sales").
	TableExpr("orders").
	GroupExpr("region")

topRegions := db.NewSelect().
	ColumnExpr("region").
	TableExpr("regional_sales").
	Where("total_sales > (SELECT SUM(total_sales) / 10 FROM regional_sales)")

// Compose them into a final query
var results []RegionProduct
err := db.NewSelect().
	With("regional_sales", regionalSales).
	With("top_regions", topRegions).
	ColumnExpr("region, product").
	ColumnExpr("SUM(quantity) AS product_units").
	ColumnExpr("SUM(amount) AS product_sales").
	TableExpr("orders").
	Where("region IN (SELECT region FROM top_regions)").
	GroupExpr("region, product").
	Scan(ctx, &results)
```

**The generated SQL is exactly what you'd write by hand:**

```sql
WITH regional_sales AS (
    SELECT region, SUM(amount) AS total_sales
    FROM orders GROUP BY region
), top_regions AS (
    SELECT region FROM regional_sales
    WHERE total_sales > (SELECT SUM(total_sales)/10 FROM regional_sales)
)
SELECT region, product,
       SUM(quantity) AS product_units,
       SUM(amount) AS product_sales
FROM orders
WHERE region IN (SELECT region FROM top_regions)
GROUP BY region, product
```

## Start building in 60 seconds

Choose your database and get running immediately:

<CodeGroup>
  <CodeGroupItem title="🐘 PostgreSQL" active>

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

	// Open a PostgreSQL database
	dsn := "postgres://postgres:@localhost:5432/test?sslmode=disable"
	pgdb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))

	// Create a Bun db on top of it
	db := bun.NewDB(pgdb, pgdialect.New())

	// Optional: Print queries during development
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))

	var rnd float64
	// Select a random number - it's that simple!
	if err := db.NewSelect().ColumnExpr("random()").Scan(ctx, &rnd); err != nil {
		panic(err)
	}

	fmt.Println("Random number:", rnd)
}
```

  </CodeGroupItem>

  <CodeGroupItem title="📦 SQLite">

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

	// Perfect for development and testing
	sqlite, err := sql.Open(sqliteshim.ShimName, "file::memory:?cache=shared")
	if err != nil {
		panic(err)
	}

	db := bun.NewDB(sqlite, sqlitedialect.New())
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))

	var rnd int64
	if err := db.NewSelect().ColumnExpr("random()").Scan(ctx, &rnd); err != nil {
		panic(err)
	}

	fmt.Println("Random number:", rnd)
}
```

  </CodeGroupItem>

  <CodeGroupItem title="🐬 MySQL">

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

	// Works with MySQL 5.7+ and MariaDB
	sqldb, err := sql.Open("mysql", "root:pass@/test")
	if err != nil {
		panic(err)
	}

	db := bun.NewDB(sqldb, mysqldialect.New())
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))

	var rnd float64
	if err := db.NewSelect().ColumnExpr("rand()").Scan(ctx, &rnd); err != nil {
		panic(err)
	}

	fmt.Println("Random number:", rnd)
}
```

  </CodeGroupItem>

  <CodeGroupItem title="🏢 SQL Server">

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

	// Enterprise-ready SQL Server support
	sqldb, err := sql.Open("sqlserver",
		"sqlserver://sa:passWORD1@localhost:1433?database=test")
	if err != nil {
		panic(err)
	}

	db := bun.NewDB(sqldb, mssqldialect.New())
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))

	var rnd float64
	if err := db.NewSelect().ColumnExpr("rand()").Scan(ctx, &rnd); err != nil {
		panic(err)
	}

	fmt.Println("Random number:", rnd)
}
```

  </CodeGroupItem>
</CodeGroup>

## Real-world examples that matter

### Type-safe model definitions

```go
type User struct {
    ID        int64     `bun:",pk,autoincrement"`
    Name      string    `bun:",notnull"`
    Email     string    `bun:",unique,notnull"`
    CreatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
}

type Order struct {
    ID     int64 `bun:",pk,autoincrement"`
    UserID int64 `bun:",notnull"`
    User   *User `bun:"rel:belongs-to,join:user_id=id"`
    Total  int64 `bun:",notnull"`
}
```

### Relationships made simple

```go
// Load user with all their orders in one query
var users []User
err := db.NewSelect().
    Model(&users).
    Relation("Orders").
    Scan(ctx)
```

### Migrations that scale

```go
func init() {
    migrations.Add("20230101_create_users", func(ctx context.Context, db *bun.DB) error {
        _, err := db.NewCreateTable().
            Model((*User)(nil)).
            IfNotExists().
            Exec(ctx)
        return err
    }, func(ctx context.Context, db *bun.DB) error {
        _, err := db.NewDropTable().
            Model((*User)(nil)).
            IfExists().
            Exec(ctx)
        return err
    })
}
```

## Performance & monitoring

Take your application to the next level with integrated observability:

- **[Uptrace APM](https://uptrace.dev/get/hosted/open-source-apm)** - Open source application performance monitoring
- **[Distributed Tracing](https://uptrace.dev/tools/distributed-tracing-tools)** - Debug complex queries across services

---

**Ready to write better SQL with Go?** [Get started in 5 minutes →](/guide/golang-orm.html)
