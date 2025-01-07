---
title: Golang ORM for PostgreSQL and MySQL
description: Bun is a Golang ORM for PostgreSQL and MySQL that is based on database/sql APIs.
keywords:
  - golang orm
  - go orm
  - golang database orm
  - golang orm mysql
  - golang orm postgresql
---

# Golang ORM for PostgreSQL and MySQL

Bun is a SQL-first Golang ORM (Object-Relational Mapping) that supports PostgreSQL, MySQL, MSSQL, and SQLite. It aims to provide a simple and efficient way to work with databases while utilizing Go's type safety and reducing boilerplate code.

![Golang ORM](/bun/cover.png)

[[toc]]

## Installation

To install Bun:

```shell
go get github.com/uptrace/bun@latest
```

## Connecting to a database

Bun works on top of [database/sql](https://pkg.go.dev/database/sql) so the first thing you need to do is to create a `sql.DB`. In this tutorial we will be using [SQLite](drivers.html#sqlite) but Bun also works with [PostgreSQL](/postgres/), [MySQL](drivers.html#mysql), and [MSSQL](drivers.html#mssql).

```go
import (
    "database/sql"

    "github.com/uptrace/bun/driver/sqliteshim"
)

sqldb, err := sql.Open(sqliteshim.ShimName, "file::memory:?cache=shared")
if err != nil {
	panic(err)
}
```

Having a `sql.DB`, you can create a `bun.DB` using the corresponding SQLite [dialect](drivers.html) that comes with Bun:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
)

db := bun.NewDB(sqldb, sqlitedialect.New())
```

To see executed queries in stdout, install a [query hook](hooks.html#query-hooks):

```go
import "github.com/uptrace/bun/extra/bundebug"

db.AddQueryHook(bundebug.NewQueryHook(
	bundebug.WithVerbose(true),
	bundebug.FromEnv("BUNDEBUG"),
))
```

Now you are ready to execute queries using database/sql API:

```go
res, err := db.ExecContext(ctx, "SELECT 1")

var num int
err := db.QueryRowContext(ctx, "SELECT 1").Scan(&num)
```

Or using Bun's query builder:

```go
res, err := db.NewSelect().ColumnExpr("1").Exec(ctx)

var num int
err := db.NewSelect().ColumnExpr("1").Scan(ctx, &num)
```

## Using Bun with existing code

Learning all Bun capabilities may take some time, but you can start using it right away by executing manually crafted queries and allowing Bun to scan results for you:

```go
type User struct {
	ID int64
	Name string
}

users := make([]User, 0)

err := bundb.NewRaw(
	"SELECT id, name FROM ? LIMIT ?",
	bun.Ident("users"), 100,
).Scan(ctx, &users)
```

```sql
SELECT id, name FROM "users" LIMIT 100
```

If you already have code that uses `*sql.Tx` or `*sql.Conn`, you can still use Bun query builder without rewriting the existing code:

```go
tx, err := sqldb.Begin()
if err != nil {
	panic(err)
}

if _, err := tx.Exec("...existing query..."); err != nil {
	panic(err)
}

res, err := bundb.NewInsert().
	Conn(tx). // run the query using the existing transaction
	Model(&model).
	Exec(ctx)
```

## Defining models

Bun uses struct-based [models](models.md) to construct [queries](queries.md) and scan results. A typical Bun model looks like this:

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

	ID	 int64  `bun:",pk,autoincrement"`
	Name string
}
```

Having a model, you can [create](query-create-table.md) and drop tables:

```go
// Create users table.
res, err := db.NewCreateTable().Model((*User)(nil)).Exec(ctx)

// Drop users table.
res, err := db.NewDropTable().Model((*User)(nil)).Exec(ctx)

// Drop and create tables.
err := db.ResetModel(ctx, (*User)(nil))
```

[Insert](query-insert.html) rows:

```go
// Insert a single user.
user := &User{Name: "admin"}
res, err := db.NewInsert().Model(user).Exec(ctx)

// Insert multiple users (bulk-insert).
users := []User{user1, user2}
res, err := db.NewInsert().Model(&users).Exec(ctx)
```

[Update](query-update.html) rows:

```go
// Based on the primary key (ID), update the name field to "admin2"
user := &User{ID: 1, Name: "admin2"}
res, err := db.NewUpdate().Model(user).Column("name").WherePK().Exec(ctx)
```

[Delete](query-delete.html) rows:

```go
user := &User{ID: 1}
res, err := db.NewDelete().Model(user).WherePK().Exec(ctx)
```

And [select](query-select.html) rows scanning the results:

```go
// Select a user by a primary key.
user := new(User)
err := db.NewSelect().Model(user).Where("id = ?", 1).Scan(ctx)

// Select first 10 users.
var users []User
err := db.NewSelect().Model(&users).OrderExpr("id ASC").Limit(10).Scan(ctx)
```

## Scanning query results

When it comes to [scanning](queries.html#scan-and-exec) query results, Bun is very flexible and allows scanning into structs:

```go
user := new(User)
err := db.NewSelect().Model(user).Limit(1).Scan(ctx)
```

Into scalars:

```go
var id int64
var name string
err := db.NewSelect().Model((*User)(nil)).Column("id", "name").Limit(1).Scan(ctx, &id, &name)
```

Into a `map[string]interface{}`:

```go
var m map[string]interface{}
err := db.NewSelect().Model((*User)(nil)).Limit(1).Scan(ctx, &m)
```

And into slices of the types above:

```go
var users []User
err := db.NewSelect().Model(&users).Limit(1).Scan(ctx)

var ids []int64
var names []string
err := db.NewSelect().Model((*User)(nil)).Column("id", "name").Limit(1).Scan(ctx, &ids, &names)

var ms []map[string]interface{}
err := db.NewSelect().Model((*User)(nil)).Scan(ctx, &ms)
```

You can also return results from insert/update/delete queries and scan them too:

```go
var ids []int64
res, err := db.NewDelete().Model((*User)(nil)).Returning("id").Exec(ctx, &ids)
```

## Table relationships

Bun also recognizes common [table relationships](relations.html), for example, you can define a [belongs-to](relations.html#belongs-to) relation:

```go
type Story struct {
	ID       int64
	Title    string
	AuthorID int64
	Author   *User `bun:"rel:belongs-to,join:author_id=id"`
}
```

And Bun will join the story author for you:

```go
story := new(Story)
err := db.NewSelect().
	Model(story).
	Relation("Author").
	Limit(1).
	Scan(ctx)
```

```sql
SELECT
  "story"."id", "story"."title", "story"."author_id",
  "author"."id" AS "author__id",
  "author"."name" AS "author__name"
FROM "stories" AS "story"
LEFT JOIN "users" AS "author" ON ("author"."id" = "story"."author_id")
LIMIT 1
```

See [example](https://github.com/uptrace/bun/tree/master/example/basic) for details.

## What's next

By now, you should have basic understanding of Bun API. Next, learn how to [define models](models.md) and [write queries](queries.md).

- [Top DataDog competitors](https://uptrace.dev/blog/datadog-competitors.html)
- [Distributed tracing tools](https://uptrace.dev/blog/distributed-tracing-tools.html)
