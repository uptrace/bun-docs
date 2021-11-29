---
title: Getting started
---

# Getting started with database/sql and Bun

## database/sql

Bun works on top of [database/sql](https://pkg.go.dev/database/sql) so the first thing you need to
do is to create a sql.DB. In this tutorial we will be using [SQLite](drivers.html#sqlite) but Bun
also works with [PostgreSQL](drivers.html#postgresql) and [MySQL](drivers.html#mysql).

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

Having a `sql.DB`, you can create a `bun.DB` using the corresponding SQLite [dialect](drivers.html)
that comes with Bun:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
)

db := bun.NewDB(sqldb, sqlitedialect.New())
```

You can also install a [query hook](hooks.html#query-hooks) to see executed queries in console:

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

## Models

Bun uses struct-based [models](models.html) to build [queries](queries.html) and scan results. A
typical Bun model looks like this:

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

	ID	 int64  `bun:",pk,autoincrement"`
	Name string
}
```

Having a model, you can [create](query-table-create.html) and drop tables:

```go
// Create users table.
res, err := db.NewCreateTable().Model((*User)(nil)).Exec(ctx)

// Drop users table.
res, err := db.NewDropTable().Model((*User)(nil)).Exec(ctx)
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
user := &User{ID: 1, Name: "admin"}
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

## Table relations

Bun also recognizes common [table relationships](relations.html), for example, you can define a
[belongs-to](relations.html#belongs-to) relation:

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

By now, you should have basic understanding of Bun API. Next, learn how to
[define models](models.html) and [write queries](queries.html).
