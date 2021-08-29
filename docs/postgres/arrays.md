# Working with PostgreSQL arrays

`pgdialect` supports PostgreSQL one-dimensional arrays using a struct field tag:

```go
type Article struct {
	ID	 int64
	Tags []string `bun:",array"`
}
```

To scan PostgreSQL arrays into a variable, use `pgdialect.Array`:

```go
import "github.com/uptrace/bun/dialect/pgdialect"

var tags []string

err := db.NewSelect().
	Model((*Article)(nil)).
	ColumnExpr("tags").
	Where("id = 1").
	Scan(ctx, pgdialect.Array(&tags))
```

You can also use it to insert/update arrays:

```go
res, err := db.NewUpdate().
    Model(&article).
    Set("tags = ?", pgdialect.Array([]string{"foo", "bar"})).
    WherePK().
    Exec(ctx)
```

Or in `Where` clause:

```go
q.Where("tags @> ?", pgdialect.Array([]string{"foo"}))
```
