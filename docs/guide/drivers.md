# Drivers and dialects

To connect to a database, you need a `database/sql` driver and a corrensponding SQL dialect that
comes with bun.

## PostgreSQL

### pgdriver

Bun comes with its own PostgreSQL driver called
[pgdriver](https://github.com/uptrace/bun/tree/master/driver/pgdriver).

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

dsn := "postgres://postgres:@localhost:5432/test?sslmode=disable"
// dsn := "unix://user:pass@dbname/var/run/postgresql/.s.PGSQL.5432"
sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))

db := bun.NewDB(sqldb, pgdialect.New())
```

See [PostgreSQL](/postgres/) section for more information about pgdriver and PostgreSQL.

### pgx

Alternatively, you can use [pgx](https://github.com/jackc/pgx) with `pgdialect`. You can disable
prepared statements in `pgx`, because Bun does not benefit from using them:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/jackc/pgx/v4/stdlib"
)

config, err := pgx.ParseConfig("postgres://postgres:@localhost:5432/test?sslmode=disable")
if err != nil {
	panic(err)
}
config.PreferSimpleProtocol = true

sqldb := stdlib.OpenDB(*config)
db := bun.NewDB(sqldb, pgdialect.New())
```

See [PostgreSQL](/postgres/) section for more information about pgx and PostgreSQL.

## MySQL5+ and MariaDB

To connect to a MySQL database, use MySQL [driver](https://github.com/go-sql-driver/mysql) and
`mysqldialect`:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/mysqldialect"
    _ "github.com/go-sql-driver/mysql"
)

sqldb, err := sql.Open("mysql", "root:pass@/test")
if err != nil {
	panic(err)
}

db := bun.NewDB(sqldb, mysqldialect.New())
```

## SQLite

To connect to a SQLite database, use
[sqliteshim](https://github.com/uptrace/bun/tree/master/driver/sqliteshim) driver which
automatically imports [modernc.org/sqlite](https://modernc.org/sqlite/) or
[mattn/go-sqlite3](https://github.com/mattn/go-sqlite3) depending on your platform.

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
    "github.com/uptrace/bun/driver/sqliteshim"
)

sqldb, err := sql.Open(sqliteshim.ShimName, "file::memory:?cache=shared")
if err != nil {
	panic(err)
}

db := bun.NewDB(sqldb, sqlitedialect.New())
```

If you are using an in-memory database, you need to configure `*sql.DB` to NOT close active
connections. Otherwise, the database is deleted when the connection is closed.

```go
sqldb.SetMaxIdleConns(1000)
sqldb.SetConnMaxLifetime(0)
```
