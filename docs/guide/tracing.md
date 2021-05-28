# Tracing and errors monitoring

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
