---
home: true
title: Simple and performant db client for PostgreSQL, MySQL, and SQLite

actions:
  - text: Get Started
    link: /guide/getting-started.html
    type: primary
  - text: Introduction
    link: /guide/
    type: secondary

features:
  - title: SQL First
    details: Bun's goal is to help you write SQL, not to hide it behind awkward constructs.
  - title: '*sql.DB compatible'
    details: Bun uses database/sql and extends it in a compatible and idiomatic way.
  - title: Database-agnostic
    details: Out-of-the box works with PostgreSQL, MySQL 5.7+, and SQLite.
  - title: Built-in migrations
    details: Keep your database updated with Go and SQL-based migrations.
  - title: Fixtures
    details: Provide initial data for your application with YAML fixtures.
  - title: Starter kit
    details: Modern app skeleton puts everything together and helps you get started.

footer: Copyright © 2021 Vladimir Mihailenco
---

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
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose()))

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
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose()))

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
	db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose()))

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
