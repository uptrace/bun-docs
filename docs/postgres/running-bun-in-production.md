---
title: Running Bun in production
---

# Running Bun in production using PostgreSQL

## database/sql

Bun uses `sql.DB` to communicate with database management systems. You should create one `sql.DB`
and one `bun.DB` when your app starts and close them when your app exits.

The sql package creates and frees connections automatically; it also maintains a pool of idle
connections. To maximize pool performance, you can configure `sql.DB` to not close idle connections:

```go
maxOpenConns := 4 * runtime.GOMAXPROCS(0)
sqldb.SetMaxOpenConns(maxOpenConns)
sqldb.SetMaxIdleConns(maxOpenConns)
```

## bun.WithDiscardUnknownColumns

To make your app more resilient to errors during migrations, you can tweak Bun to discard unknown
columns in production:

```go
db := bun.NewDB(sqldb, pgdialect.New(), bun.WithDiscardUnknownColumns())
```

## PgBouncer

To achieve better performance, you should use a server-side connection pool like
[PgBouncer](https://www.pgbouncer.org/). The pool that comes with `sql.DB` is a client-side pool and
it doesn't replace server-side pools like PgBouncer.

## ZFS

If you store large amounts of data (> 100 gigabytes), consider using ZFS filesystem which enables
2-3x data compression and efficient ARC cache. See:

- [Installing ZFS on Ubuntu](https://blog.uptrace.dev/posts/ubuntu-install-zfs/)
- [Running PostgreSQL on ZFS and AWS](https://blog.uptrace.dev/posts/postgresql-zfs-aws-ebs/)
