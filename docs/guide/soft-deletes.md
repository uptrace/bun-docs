# Soft deletes

To enable soft deletes on a model, add `DeletedAt` field with `soft_delete` tag:

```go
type User struct {
    ID int64
    CreatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
    DeletedAt time.Time `bun:",soft_delete"`
}
```

For such models Bun will update rows instead of deleting them:

```go
_, err := db.NewDelete().Model(user).Where("id = ?", 123).Exec(ctx)
```

```sql
UPDATE users SET deleted_at = current_timestamp WHERE id = 123
```

Bun also excludes soft-deleted rows from `SELECT` queries results:

```go
err := db.NewSelect().Model(&users).Scan(ctx)
```

```sql
SELECT * FROM users WHERE deleted_at IS NULL
```

To select soft-deleted rows:

```go
err := db.NewSelect().Model(&users).WhereDeleted().Scan(ctx)
```

```sql
SELECT * FROM users WHERE deleted_at IS NOT NULL
```

To select all rows including soft-deleted rows:

```go
err := db.NewSelect().Model(&users).WhereAllWithDeleted().Scan(ctx)
```

```sql
SELECT * FROM users
```

Finally, to actually delete soft-deleted rows from a database:

```go
db.NewDelete().Model(user).Where("id = ?", 123).ForceDelete().Exec(ctx)
```

```sql
DELETE FROM users WHERE id = 123
```
