# Drivers and dialects

To connect to a database, you need a `database/sql` driver and a corrensponding SQL dialect that
comes with bun.

## PostgreSQL

### pgx

To connect to a PostgreSQL server, use pgx [driver](https://github.com/jackc/pgx) and `pgdialect`:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	_ "github.com/jackc/pgx/v4/stdlib"
)

sqldb, err := sql.Open("pgx", "postgres://postgres:@localhost:5432/test?sslmode=disable")
if err != nil {
	panic(err)
}

db := bun.NewDB(sqldb, pgdialect.New())
```

It might be a good idea to disable prepared statements in `pgx` for performance reasons:

```go
config, err := pgx.ParseConfig("postgres://postgres:@localhost:5432/test?sslmode=disable")
if err != nil {
	panic(err)
}

config.PreferSimpleProtocol = true
sqldb := stdlib.OpenDB(*config)
```

### pgdriver

Bun comes with its own PostgreSQL driver called `pgdriver`. It offers slightly better performance,
but currently does not support prepared statements and some other features.

```go
import "github.com/uptrace/bun/driver/pgdriver"

dsn = "postgres://postgres:@localhost:5432/test?sslmode=disable"
sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))
db := bun.NewDB(sqldb, pgdialect.New())
```

## MySQL

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

To connect a SQLite database, use SQLite3 [driver](https://github.com/mattn/go-sqlite3) and
`sqlitedialect`:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/sqlitedialect"
	_ "github.com/mattn/go-sqlite3"
)

sqldb, err := sql.Open("sqlite3", ":memory:?cache=shared")
if err != nil {
	panic(err)
}

db := bun.NewDB(sqldb, sqlitedialect.New())
```

If you are using an in-memory database, you need to configure `*sql.DB` to NOT close active
connections. Otherwise the database is deleted when the connection is closed.

```go
sqldb.SetMaxIdleConns(1000)
sqldb.SetConnMaxLifetime(0)
```
