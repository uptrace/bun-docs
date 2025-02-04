---
title: Transactions
---

# Database SQL transactions

[[toc]]

## Starting transactions

`bun.Tx` is a thin wrapper around `sql.Tx`. In addition to the features provided by `sql.Tx`, `bun.Tx` also supports [query hooks](hooks.md) and provides helpers to build queries.

```go
type Tx struct {
	*sql.Tx
	db *DB
}
```

To start a transaction:

```go
tx, err := db.BeginTx(ctx, &sql.TxOptions{})
```

To commit/rollback the transaction:

```go
err := tx.Commit()

err := tx.Rollback()
```

## Running queries in a transaction

Just like with `bun.DB`, you can use `bun.Tx` to run queries:

```go
res, err := tx.NewInsert().Model(&models).Exec(ctx)

res, err := tx.NewUpdate().Model(&models).Column("col1", "col2").Exec(ctx)

err := tx.NewSelect().Model(&models).Limit(100).Scan(ctx)
```

## RunInTx

Bun provides `RunInTx` helpers that runs the provided function in a transaction. If the function returns an error, the transaction is rolled back. Otherwise, the transaction is committed.

```go
err := db.RunInTx(ctx, &sql.TxOptions{}, func(ctx context.Context, tx bun.Tx) error {
    _, err := tx.Exec(...)
    return err
})
```

## IDB interface

Bun provides `bun.IDB` interface so the same methods can work with `*bun.DB`, `bun.Tx`, and `bun.Conn`. The following [example](https://github.com/uptrace/bun/tree/master/example/tx-composition) demonstrates how `InsertUser` uses the `bun.IDB` to support transactions:

```go
// Insert single user using bun.DB.
err := InsertUser(ctx, db, user1)

// Insert several users in a transaction.
err := db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
    if err := InsertUser(ctx, tx, user1); err != nil {
        return err
    }
    if err := InsertUser(ctx, tx, user2); err != nil {
        return err
    }
    return nil
})

func InsertUser(ctx context.Context, db bun.IDB, user *User) error {
	_, err := db.NewInsert().Model(user).Exec(ctx)
	return err
}
```

## PostgreSQL advisory locks

You can acquire a PostgreSQL advisory lock using the following code:

```go
err := db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
    if _, err := tx.ExecContext(ctx, "SELECT pg_advisory_xact_lock(1)"); err != nil {
        return err
    }
    if _, err := db.NewSelect().ColumnExpr("pg_advisory_xact_lock(2)").Exec(ctx); err != nil {
        return err
    }
    return nil
})
```
