# Migrations [PostgreSQL MySQL]

You can write migrations to change database schema or data. A migration can be a regular Go function or a text file with SQL commands.

[[toc]]

## Migration names

You should put each migration into a separate file. A migration file names consists of an unique migration name (`20210505110026`) and a comment (`add_foo_column`), for example, `20210505110026_add_foo_column.go`.

# Migration status

Bun stores the completed migration names in the `bun_migrations` table to decide which migrations to run. It also uses that information to rollback migrations.

When a migration fails, Bun still marks the migration as applied so you can rollback the partially applied migration to cleanup the database and try to run the migration again.

## Migration groups and rollbacks

When there are multiple migrations to run, Bun runs migrations together as a group. During rollbacks, Bun reverts the last migration group (not a single migration). Usually that is desirable, because it rolls the db back to the last known stable state.

To rollback a single migration, you need to rollback the last group, delete the migration(s) you want to skip, and run migrations again. Alternatively, you can add a new migration with the changes you need.

## Go-based migrations

A Go-based migration is a regular Go function that can execute arbitrary code. Each such function must be registered in a migration collection that is created in `main.go` file:

```go
package migrations

import (
	"github.com/uptrace/bun/migrate"
)

// A collection of migrations.
var Migrations = migrate.NewMigrations()
```

Then, in a separate files, you should define and register migrations using `MustRegister` method, for example, in `20210505110026_test_migration.go`:

```go
package migrations

import (
	"context"
	"fmt"

	"github.com/uptrace/bun"
)

func init() {
	Migrations.MustRegister(func(ctx context.Context, db *bun.DB) error {
		fmt.Print(" [up migration] ")
		return nil
	}, func(ctx context.Context, db *bun.DB) error {
		fmt.Print(" [down migration] ")
		return nil
	})
}
```

See [bun-starter-kit](starter-kit.md) and [example](https://github.com/uptrace/bun/tree/master/example/migrate) for details.

## SQL-based migrations

A SQL-based migration is a file with `.up.sql` extension that contains one or more SQL commands. You can use `--bun:split` line as a separator to create migrations with multiple statements.

```sql
SELECT 1

--bun:split

SELECT 2
```

You can register such migrations using `Discover` method:

```go
//go:embed *.sql
var sqlMigrations embed.FS

func init() {
	if err := Migrations.Discover(sqlMigrations); err != nil {
		panic(err)
	}
}
```

To create a transactional migration, use `.tx.up.sql` extension.

See [bun-starter-kit](starter-kit.md) and [example](https://github.com/uptrace/bun/tree/master/example/migrate) for details.
