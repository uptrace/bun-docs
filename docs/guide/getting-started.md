# Getting started

## Quickstart

First, you need to create a `sql.DB`. Here we are using the
[sqliteshim](https://pkg.go.dev/github.com/uptrace/bun/driver/sqliteshim) driver which choses
between [modernc.org/sqlite](https://modernc.org/sqlite/) and
[mattn/go-sqlite3](https://github.com/mattn/go-sqlite3) depending on your platform.

```go
import "github.com/uptrace/bun/driver/sqliteshim"

sqldb, err := sql.Open(sqliteshim.ShimName, "file::memory:?cache=shared")
if err != nil {
	panic(err)
}
```

And then create a `bun.DB` on top of it using the corresponding SQLite [dialect](drivers.md) that
comes with Bun:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
)

db := bun.NewDB(sqldb, sqlitedialect.New())
```

Now you are ready to issue queries:

```go
type User struct {
	ID	 int64
	Name string
}

user := new(User)
err := db.NewSelect().
	Model(user).
	Where("name != ?", "").
	OrderExpr("id ASC").
	Limit(1).
	Scan(ctx)
```

## Basic example

Before we start, let's create some tables and load initial data for our
[basic example](/example/basic/). To provide initial data, we are going to use Bun
[fixtures](https://bun.uptrace.dev/guide/fixtures.html):

```go
import "github.com/uptrace/bun/dbfixture"

// Register models for the fixture.
db.RegisterModel((*User)(nil), (*Story)(nil))

// WithRecreateTables tells Bun to drop existing tables and create new ones.
fixture := dbfixture.New(db, dbfixture.WithRecreateTables())

// Load fixture.yml which contains data for User and Story models.
if err := fixture.Load(ctx, os.DirFS("."), "fixture.yml"); err != nil {
	panic(err)
}
```

The `fixture.yml` file containing the data looks like this:

```yaml
- model: User
  rows:
    - _id: admin
      name: admin
      emails: ['admin1@admin', 'admin2@admin']
    - _id: root
      name: root
      emails: ['root1@root', 'root2@root']

- model: Story
  rows:
    - title: Cool story
      author_id: '{{ $.User.admin.ID }}'
```

To select all users:

```go
users := make([]User, 0)
if err := db.NewSelect().Model(&users).OrderExpr("id ASC").Scan(ctx); err != nil {
	panic(err)
}
```

To select a single user by id:

```go
user1 := new(User)
if err := db.NewSelect().Model(user1).Where("id = ?", 1).Scan(ctx); err != nil {
	panic(err)
}
```

To select a story and the associated author in a single query:

```go
story := new(Story)
if err := db.NewSelect().
	Model(story).
	Relation("Author").
	Limit(1).
	Scan(ctx); err != nil {
	panic(err)
}
```

To select a user into a map:

```go
m := make(map[string]interface{})
if err := db.NewSelect().
	Model((*User)(nil)).
	Limit(1).
	Scan(ctx, &m); err != nil {
	panic(err)
}
```

To select all users scanning each column into a separate slice:

```go
var ids []int64
var names []string
if err := db.NewSelect().
	ColumnExpr("id, name").
	Model((*User)(nil)).
	OrderExpr("id ASC").
	Scan(ctx, &ids, &names); err != nil {
	panic(err)
}
```

## What's next

By now, you should have a basic understanding of Bun API. Next, learn how to
[define models](models.md) and [write queries](queries.md).
