# Migrations

You write migrations to change database schema or data. A migration can be a regular Go function or
a text file with SQL commands.

## Migration names

You should put each migration into a separate file. Migration file names consist of a migration name
(`20210505110026`) and a comment (`add_foo_column`), for example,
`20210505110026_add_foo_column.go`.

Bun stores the completed migration names in a table to decide which migrations to run. It also uses
that information to rollback migrations.

## Go-based migrations

A Go-based migration is a regular Go function that can execute arbitrary code, for example, start
transactions. You should register functions from the corrensponding migration files because Bun uses
stacktraces to discover migration names.

Each migration also has a second function that is run to revert the changes. You can use a `nil`
function to make no changes.

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

[bun-starter-kit](starter-kit.md) provides a command to create Go-based migrations:

```shell
bun db create_go
```

## SQL-based migrations

A SQL-based migration is a file with `.up.sql` extension that contains one or more SQL commands. You
can use `--bun:split` line as a separator to create migrations with multiple statements.

```sql
SELECT 1

--bun:split

SELECT 2
```

To create a transactional migration, use `.tx.up.sql` extension.

[bun-starter-kit](starter-kit.md) provides a command to create SQL-based migrations:

```shell
bun db create_sql
```

## Migration groups and rollbacks

When there are multiple migrations to run, Bun runs migrations together as a group. During
rollbacks, Bun reverts the last migration group (not a single migration). Usually that is desirable,
because it rolls the db back to the last known stable state.

To rollback a single migration, you need to rollback the last group, delete the migration(s) you
want to skip, and run migrations again. Alternatively, you can add a new migration with the changes
you need.
