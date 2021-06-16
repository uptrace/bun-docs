# Tracing and errors monitoring

Bun enables debugging through the AddQueryHook method, it expects an interface with two methods:
* **BeforeQuery** - recieves a QueryEvent object right before a query is executed
* **AfterQuery** - recives a QueryEvent object right after a query has been executed or an error has occured

Mock implementation:
```go
type MockLoggingHook struct {}
func (h *MockLoggingHook) BeforeQuery(ctx context.Context, event *bun.QueryEvent) context.Context {
    return ctx
}
func (h *MockLoggingHook) AfterQuery(ctx context.Context, event *bun.QueryEvent) {
}
db := bun.NewDB(sqldb, dialect)
db.AddQueryHook(MockLoggingHook{})

```

Following are several packages utilizing the QueryHook interface

## OpenTelemetry

Bun supports distributed [tracing](https://docs.uptrace.dev/guide/tracing.html) via
[OpenTelemetry](https://opentelemetry.io/) API. First you need to need to install the `bunotel`
package:

```shell
go get github.com/uptrace/bun/extra/bunotel
```

Then you can instrument the database using the `bunotel` query hook. The hook sends the raw query
along with any errors to the configured tracing backend.

```go
db := bun.NewDB(sqldb, dialect)
db.AddQueryHook(bunotel.NewQueryHook())
```

As a tracing backend you can try [Uptrace](https://uptrace.dev/?utm_source=bun), which uses the
collected data to optimize app performance and monitor errors. Uptrace offers 20 millions of spans
per month for free which should be enough for small and medium sites.

## Debug hook

For quick debugging you can also print queries to the stdout. First you need to install the
`bundebug` package:

```shell
go get github.com/uptrace/bun/extra/bundebug
```

Then you need to install the `bundebug` query hook which by default only prints failed queries:

```go
db := bun.NewDB(sqldb, dialect)
db.AddQueryHook(bundebug.NewQueryHook())
```

To print all queries, use `WithVerbose` option:

```go
bundebug.NewQueryHook(bundebug.WithVerbose())
```

## Logrus hook

Enables writing bun queries and errors to [Logrus](https://github.com/sirupsen/logrus)

```shell
go get https://github.com/oiime/logrusbun
```

Use `QueryHookOptions` to adjust log levels and behavior

```go
db := bun.NewDB(sqldb, dialect)
log := logrus.New()
db.AddQueryHook(logrusbun.NewQueryHook(logrusbun.QueryHookOptions{Logger: log}))
```
