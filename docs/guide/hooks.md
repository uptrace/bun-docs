# Hooks

## Model hooks

Struct and slice models support optional hooks that are called before and after scan, select,
insert, update, and delete queries. For slice models, hooks are called for each struct in a slice.

Bun also calls `BeforeScanHook`/`AfterScanHook` before/after scanning values into a struct.

To ensure that a model implements a hook, use
[compile time checks](https://medium.com/@matryer/golang-tip-compile-time-checks-to-ensure-your-type-satisfies-an-interface-c167afed3aae),
for example, `var _ bun.AfterScanHook = (*Model)(nil)`.

```go
type Model struct{}

var _ bun.BeforeScanHook = (*Model)(nil)

func (*Model) BeforeScan(ctx context.Context) error { return nil }

var _ bun.AfterScanHook = (*Model)(nil)

func (*Model) AfterScan(ctx context.Context) error { return nil }

var _ bun.AfterSelectHook = (*Model)(nil)

func (*Model) AfterSelect(ctx context.Context) error { return nil }

var _ bun.BeforeInsertHook = (*Model)(nil)

func (*Model) BeforeInsert(ctx context.Context) error { nil }

var _ bun.AfterInsertHook = (*Model)(nil)

func (*Model) AfterInsert(ctx context.Context) error { return nil }

var _ bun.BeforeUpdateHook = (*Model)(nil)

func (*Model) BeforeUpdate(ctx context.Context) error { return nil }

var _ bun.AfterUpdateHook = (*Model)(nil)

func (*Model) AfterUpdate(ctx context.Context) error { return nil }

var _ bun.BeforeDeleteHook = (*Model)(nil)

func (*Model) BeforeDelete(ctx context.Context) error { return nil }

var _ bun.AfterDeleteHook = (*Model)(nil)

func (*Model) AfterDelete(ctx context.Context) error { return nil }
```

## Query hooks

Bun also supports query hooks which are called before and after each query. Bun uses query hooks for
[tracing and errors monitoring](tracing.md).

```go
type QueryHook struct{}

func (h *QueryHook) BeforeQuery(ctx context.Context, event *bun.QueryEvent) context.Context {
	return ctx
}

func (h *QueryHook) AfterQuery(ctx context.Context, event *bun.QueryEvent) {
	fmt.Println(string(event.Query))
}

db.AddQueryHook(&QueryHook{})
```
