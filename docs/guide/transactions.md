# Transactions

`bun.Tx` is a thin wrapper around `sql.Tx`. In addition to the features provided by `sql.Tx`,
`bun.Tx` also supports [query hooks](hooks.md).

To start a transaction:

```go
tx, err := db.BeginTx(ctx, nil)
```

To commit/rollback the transaction:

```go
err := tx.Commit()
err := tx.Rollback()
```

Bun provides `RunInTx` helper method that runs the provided function in a transaction. If the
function returns an error, the transaction is rolled back. Otherwise, the transaction is committed.

```go
err := db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
    _, err := tx.Exec(...)
    return err
})
```

You can also use `bun.IDB` interface to accept `*bun.DB`, `bun.Tx`, or `bun.Conn`. The following
[example](https://github.com/uptrace/bun/tree/master/example/tx-composition) demonstrates how
`InsertUser` uses the `bun.IDB` to support transactions:

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
