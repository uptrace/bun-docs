# Hooks

## Disclaimer

It may sound like a good idea to use hooks for validation or caching, because this way you can't
forget to sanitize data or check permissions. It gives false sense of safety.

Don't do that. Code that uses hooks is harder to read, understand, and debug. It is more complex and
error-prone. Where possible prefer writing simple code like
[this](https://github.com/uptrace/bun/tree/master/example/tx-composition):

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

## Query hooks

Bun supports query hooks which are called before and after executing a query. Bun uses query hooks
for [tracing and errors monitoring](tracing.md).

To ensure that your hook implements the correct interface, use
[compile time checks](https://medium.com/@matryer/golang-tip-compile-time-checks-to-ensure-your-type-satisfies-an-interface-c167afed3aae),
for example, `var _ bun.QueryHook = (*QueryHook)(nil)`.

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

## Scan hooks

Struct and slice models also support `BeforeScanHook`/`AfterScanHook` hooks that are called before
and after scanning column values. For slices, the hooks are called for each struct in a slice. Use
these hooks for pre- and post-processing column values.

```go
type Model struct{}

var _ bun.BeforeScanHook = (*Model)(nil)

func (m *Model) BeforeScan(ctx context.Context) error { return nil }

var _ bun.AfterScanHook = (*Model)(nil)

func (m *Model) AfterScan(ctx context.Context) error { return nil }
```

## Model query hooks

<!-- prettier-ignore -->
::: warning
Code that uses hooks is less readable and harder to debug. Only use hooks as a last resort. That
means that most of your models should not have hooks.
:::

You can also define model query hooks that are called before and after executing certain type of
queries on a certain model. Such hooks are called once for a query and using a `nil` model. To
access the query data, use `query.GetModel().Value()`. See
[example](https://github.com/uptrace/bun/tree/master/example/model-hooks) for details.

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
