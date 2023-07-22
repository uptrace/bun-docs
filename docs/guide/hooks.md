# Model and query hooks

## Introduction

Hooks are user-defined functions that are called before and/or after certain operations, for example, before every processed query.

To ensure that your model implements a hook interface, use [compile time checks](https://medium.com/@matryer/golang-tip-compile-time-checks-to-ensure-your-type-satisfies-an-interface-c167afed3aae), for example, `var _ bun.QueryHook = (*MyHook)(nil)`.

## Disclaimer

It may sound like a good idea to use hooks for validation or caching because this way you can't forget to sanitize data or check permissions. It gives false sense of safety.

Don't do that. Code that uses hooks is harder to read, understand, and debug. It is more complex and error-prone. Instead, prefer writing simple code like [this](https://github.com/uptrace/bun/tree/master/example/tx-composition) even if that means repeating yourself:

```go
func InsertUser(ctx context.Context, db *bun.DB, user *User) error {
	// before insert

	if _, err := db.NewInsert().Model(user).Exec(ctx); err != nil {
		return err
	}

	// after insert

	return nil
}
```

## Model hooks

### BeforeAppendModel

To update certain fields before inserting or updating a model, use `bun.BeforeAppendModelHook` which is called just before constructing a query. For [example](https://github.com/uptrace/bun/tree/master/example/model-hooks):

```go
type Model struct {
    ID        int64
    CreatedAt time.Time
    UpdatedAt time.Time
}

var _ bun.BeforeAppendModelHook = (*Model)(nil)

func (m *Model) BeforeAppendModel(ctx context.Context, query bun.Query) error {
	switch query.(type) {
	case *bun.InsertQuery:
		m.CreatedAt = time.Now()
	case *bun.UpdateQuery:
		m.UpdatedAt = time.Now()
	}
	return nil
}
```

### Before/AfterScanRow

Bun also calls `BeforeScanRow` and `AfterScanRow` hooks before and after scanning row values. For [example](https://github.com/uptrace/bun/tree/master/example/model-hooks):

```go
type Model struct{}

var _ bun.BeforeScanRowHook = (*Model)(nil)

func (m *Model) BeforeScanRow(ctx context.Context) error { return nil }

var _ bun.AfterScanRowHook = (*Model)(nil)

func (m *Model) AfterScanRow(ctx context.Context) error { return nil }
```

### Model query hooks

You can also define model query hooks that are called before and after executing certain type of queries on a certain model. Such hooks are called once for a query and using a `nil` model. To access the query data, use `query.GetModel().Value()`.

```go
var _ bun.BeforeSelectHook = (*Model)(nil)

func (*Model) BeforeSelect(ctx context.Context, query *bun.SelectQuery) error { return nil }

var _ bun.AfterSelectHook = (*Model)(nil)

func (*Model) AfterSelect(ctx context.Context, query *bun.SelectQuery) error { return nil }

var _ bun.BeforeInsertHook = (*Model)(nil)

func (*Model) BeforeInsert(ctx context.Context, query *bun.InsertQuery) error { nil }

var _ bun.AfterInsertHook = (*Model)(nil)

func (*Model) AfterInsert(ctx context.Context, query *bun.InsertQuery) error { return nil }

var _ bun.BeforeUpdateHook = (*Model)(nil)

func (*Model) BeforeUpdate(ctx context.Context, query *bun.UpdateQuery) error { return nil }

var _ bun.AfterUpdateHook = (*Model)(nil)

func (*Model) AfterUpdate(ctx context.Context, query *bun.UpdateQuery) error { return nil }

var _ bun.BeforeDeleteHook = (*Model)(nil)

func (*Model) BeforeDelete(ctx context.Context, query *bun.DeleteQuery) error { return nil }

var _ bun.AfterDeleteHook = (*Model)(nil)

func (*Model) AfterDelete(ctx context.Context, query *bun.DeleteQuery) error { return nil }

var _ bun.BeforeCreateTableHook = (*Model)(nil)

func (*Model) BeforeCreateTable(ctx context.Context, query *CreateTableQuery) error { return nil }

var _ bun.AfterCreateTableHook = (*Model)(nil)

func (*Model) AfterCreateTable(ctx context.Context, query *CreateTableQuery) error { return nil }

var _ bun.BeforeDropTableHook = (*Model)(nil)

func (*Model) BeforeDropTable(ctx context.Context, query *DropTableQuery) error { return nil }

var _ bun.AfterDropTableHook = (*Model)(nil)

func (*Model) AfterDropTable(ctx context.Context, query *DropTableQuery) error { return nil }
```

## Query hooks

Bun supports query hooks which are called before and after executing a query. Bun uses query hooks for [logging queries](debugging.md) and for [performance monitoring](performance-monitoring.md).

```go
type QueryHook struct{}

func (h *QueryHook) BeforeQuery(ctx context.Context, event *bun.QueryEvent) context.Context {
	return ctx
}

func (h *QueryHook) AfterQuery(ctx context.Context, event *bun.QueryEvent) {
	fmt.Println(time.Since(event.StartTime), string(event.Query))
}

db.AddQueryHook(&QueryHook{})
```
