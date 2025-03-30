---
title: PostgreSQL driver Golang
---

<CoverImage title="Supported PostgreSQL drivers" />

[[toc]]

## Supported drivers

### pgdriver

Bun comes with its own PostgreSQL driver called [pgdriver](https://github.com/uptrace/bun/tree/master/driver/pgdriver) that allows connecting to a PostgreSQL database using a DSN (connection string):

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

You can specify the following options in a DSN:

- `?sslmode=verify-full` - enable TLS.
- `?sslmode=disable` - disables TLS.
- `?dial_timeout=5s` - timeout for establishing new connections.
- `?read_timeout=5s` - timeout for socket reads.
- `?write_timeout=5s` - timeout for socket writes.
- `?timeout=5s` - sets all three timeouts described above.
- `?application_name=myapp` - PostgreSQL application name.

pgdriver treats all unknown options as PostgreSQL configuration parameters, for example, `?search_path=my_search_path` executes the following query whenever a connection is created:

```sql
SET search_path TO 'my_search_path'
```

In addition to DSN, you can also use [pgdriver.Option](https://pkg.go.dev/github.com/uptrace/bun/driver/pgdriver#Option) to configure the driver:

```go
pgconn := pgdriver.NewConnector(
	pgdriver.WithNetwork("tcp"),
	pgdriver.WithAddr("localhost:5437"),
	pgdriver.WithTLSConfig(&tls.Config{InsecureSkipVerify: true}),
	pgdriver.WithUser("test"),
	pgdriver.WithPassword("test"),
	pgdriver.WithDatabase("test"),
	pgdriver.WithApplicationName("myapp"),
	pgdriver.WithTimeout(5 * time.Second),
	pgdriver.WithDialTimeout(5 * time.Second),
	pgdriver.WithReadTimeout(5 * time.Second),
	pgdriver.WithWriteTimeout(5 * time.Second),
	pgdriver.WithConnParams(map[string]interface{}{
		"search_path": "my_search_path",
	}),
)
```

Or use a DSN _and_ driver options together:

```go
pgconn := pgdriver.NewConnector(
    pgdriver.WithDSN("postgres://postgres:@localhost:5432/test?sslmode=verify-full"),
    pgdriver.WithTLSConfig(tlsConfig),
)
```

#### pgdriver.Error

pgdriver exposes [Error](https://pkg.go.dev/github.com/uptrace/bun/driver/pgdriver#Error) type to work with PostgreSQL errors:

```go
import "github.com/jackc/pgerrcode"

_, err := db.NewInsert().Model(&model).Exec(ctx)
if err != nil {
    if err, ok := err.(pgdriver.Error); ok && err.IntegrityViolation() {
        // ...
    } else if err.Field('C') == pgerrcode.InvalidTransactionState {
        // ...
    } else {
        // ...
    }
}
```

#### Debugging

If you suspect an issue with pgdriver, try to replace it with [pgx](#pgx) and check if the problem goes away.

### pgx

As an alternative to pgdriver, you can also use [pgx](https://github.com/jackc/pgx) with `pgdialect`. With pgx, you can disable implicit prepared statements, because Bun does not benefit from using them:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/jackc/pgx/v5/stdlib"
)

config, err := pgx.ParseConfig("postgres://postgres:@localhost:5432/test?sslmode=disable")
if err != nil {
	panic(err)
}
config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

sqldb := stdlib.OpenDB(*config)
db := bun.NewDB(sqldb, pgdialect.New())
```

Starting from v5, you can also use pgxpool like this:

```go
import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
)

pool, err := pgxpool.NewWithConfig(context.Background(), config)
if err != nil {
	panic(err)
}

sqldb := stdlib.OpenDBFromPool(pool)
db := bun.NewDB(sqldb, pgdialect.New())
```

## PgBouncer

To achieve better performance, you can use a server-side connection pool like [PgBouncer](https://www.pgbouncer.org/). The pool that comes with `sql.DB` is a client-side pool and it doesn't replace a server-side pool provided by PgBouncer.

## ZFS

If you store large amounts of data (> 100 gigabytes), consider using ZFS filesystem which enables 2-3x data compression and efficient ARC cache. See:

- [Installing ZFS on Ubuntu](https://uptrace.dev/blog/ubuntu-install-zfs)
- [Running PostgreSQL on ZFS and AWS](tuning-zfs-aws-ebs.md)

## Backups

To backup PostgreSQL database, consider using [PgBackRest with S3](pgbackrest-s3-backups.md).

## See also

- [OpenTelemetry database/sql](https://uptrace.dev/guides/opentelemetry-database-sql)
- [OpenTelemetry GORM](https://uptrace.dev/guides/opentelemetry-gorm)
- [OpenTelemetry SQLAlchemy](https://uptrace.dev/guides/opentelemetry-sqlalchemy)
