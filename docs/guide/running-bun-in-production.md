# Running Bun in production

## database/sql

Bun uses `sql.DB` to communicate with database management systems. You should create one `sql.DB` and one `bun.DB` when your app starts and close them when your app exits.

The sql package creates and frees connections automatically; it also maintains a pool of idle connections. To maximize pool performance, you can configure `sql.DB` to not close idle connections:

```go
maxOpenConns := 4 * runtime.GOMAXPROCS(0)
sqldb.SetMaxOpenConns(maxOpenConns)
sqldb.SetMaxIdleConns(maxOpenConns)
```

## bun.WithDiscardUnknownColumns

To make your app more resilient to errors during migrations, you can tweak Bun to discard unknown columns in production:

```go
db := bun.NewDB(sqldb, pgdialect.New(), bun.WithDiscardUnknownColumns())
```

## PostgreSQL

See [PostgreSQL](/postgres/) section.
