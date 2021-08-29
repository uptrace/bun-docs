---
title: Performance and errors monitoring
---

# Debugging

## Performance and errors monitoring

You can monitor DB performance and errors using
[distributed tracing](https://docs.uptrace.dev/guide/tracing.html). Tracing allows you to see how a
request progresses through different services and systems, timings of every operation, any logs and
errors as they occur.

Bun supports tracing using [OpenTelemetry](https://opentelemetry.io/) API. OpenTelemetry is a
vendor-neutral API for distributed traces and metrics. It specifies how to collect and send
telemetry data to backend platforms. It means that you can instrument your application once and then
add or change vendors (backends) as required.

Bun comes with an OpenTelemetry instrumentation called
[bunotel](https://github.com/uptrace/bun/tree/master/extra/bunotel) that is distributed as a
separate module:

```shell
go get github.com/uptrace/bun/extra/bunotel
```

To instrument Bun database, you need to add a hook provided by bunotel:

```go
db := bun.NewDB(sqldb, dialect)
db.AddQueryHook(bunotel.NewQueryHook())
```

As expected, Bun creates [spans](https://docs.uptrace.dev/guide/tracing.html#spans) for processed
queries and records any errors as they occur. Here is how the collected information is displayed at
[Uptrace](https://uptrace.dev/explore/1/groups/?system=db%3Apostgresql&utm_source=bun&utm_campaign=bun-tracing):

![Bun trace](/img/bun-trace.png)

## Debug hook

For quick debugging you can also print queries to the stdout. First you need to install the
`bundebug` package:

```shell
go get github.com/uptrace/bun/extra/bundebug
```

Then you need to add provided query hook which by default only prints failed queries:

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
