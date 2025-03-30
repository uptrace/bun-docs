---
title: 'Bun: Drivers and dialects'
---

<CoverImage title="Drivers and dialects" />

To connect to a database, you need a `database/sql` driver and a corrensponding SQL dialect that comes with bun.

[[toc]]

## PostgreSQL

See [PostgreSQL](/postgres/) section for information about using Bun with PostgreSQL.

## MySQL

Bun supports MySQL 5+ and MariaDB using [MySQL driver](https://github.com/go-sql-driver/mysql) and `mysqldialect`:

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

## MSSQL

Bun supports SQL Server v2019.CU4 starting from v1.1.x. To connect to a SQL Server, use [go-mssqldb](https://github.com/denisenkom/go-mssqldb) driver and `mssqldialect`:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/mssqldialect"
	_ "github.com/denisenkom/go-mssqldb"
)

sqldb, err := sql.Open("sqlserver", "sqlserver://sa:passWORD1@localhost:1433?database=test")
if err != nil {
	panic(err)
}

db := bun.NewDB(sqldb, mssqldialect.New())
```

## SQLite

To connect to a SQLite database, use [sqliteshim](https://github.com/uptrace/bun/tree/master/driver/sqliteshim) driver which automatically imports [modernc.org/sqlite](https://modernc.org/sqlite/) or [mattn/go-sqlite3](https://github.com/mattn/go-sqlite3) depending on your platform.

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

If you are using an in-memory database, you need to configure `*sql.DB` to NOT close active connections. Otherwise, the database is deleted when the connection is closed.

```go
sqldb.SetMaxIdleConns(1000)
sqldb.SetConnMaxLifetime(0)
```

## Oracle

To connect to an Oracle database, use [go-oci8](https://github.com/mattn/go-oci8) driver and `oracledialect`:

```go
import (
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/oracledialect"
	_ "github.com/mattn/go-oci8"
)

sqldb, err := sql.Open("oci8", "127.0.0.1")
if err != nil {
	panic(err)
}

db := bun.NewDB(sqldb, oracledialect.New())
```

## Writing DMBS specific code

Bun comes with [feature](https://pkg.go.dev/github.com/uptrace/bun/dialect/feature) package that allows you to discover features supported by your DBMS:

```go
import "github.com/uptrace/bun/dialect/feature"

if db.HasFeature(feature.InsertOnConflict) {
    // DBMS supports `ON CONFLICT DO UPDATE` (PostgreSQL, SQLite)
}

if db.HasFeature(feature.InsertOnDuplicateKey) {
    // DBMS supports `ON DUPLICATE KEY UPDATE` (MySQL, MariaDB)
}
```

You can also directly check the database dialect name:

```go
import "github.com/uptrace/bun/dialect"

switch db.Dialect().Name() {
    case dialect.SQLite:
    case dialect.PG:
    case dialect.MySQL:
    case dialect.MSSQL:
    default:
        panic("not reached")
}
```

## Useful links

- [OpenTelemetry Kafka](https://uptrace.dev/guides/opentelemetry-kafka)
- [OpenTelemetry MySQL](https://uptrace.dev/guides/opentelemetry-mysql)
