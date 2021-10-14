# Performance and errors monitoring

You can monitor DB performance and errors using
[distributed tracing](https://docs.uptrace.dev/guide/tracing.html) and
[metrics](https://docs.uptrace.dev/guide/metrics.html). Tracing allows you to see how a request
progresses through different services and systems, timings of every operation, any logs and errors
as they occur.

Bun supports tracing and metrics using [OpenTelemetry](https://opentelemetry.io/) API. OpenTelemetry
is a vendor-neutral API for distributed traces and metrics. It specifies how to collect and send
telemetry data to backend platforms. It means that you can instrument your application once and then
add or change vendors (backends) as required.

Bun comes with an OpenTelemetry instrumentation called
[bunotel](https://github.com/uptrace/bun/tree/master/extra/bunotel) that is distributed as a
separate module:

```shell
go get github.com/uptrace/bun/extra/bunotel
```

To instrument Bun database, you need to add the hook provided by bunotel:

```go
import "github.com/uptrace/bun/extra/bunotel"

db := bun.NewDB(sqldb, dialect)
db.AddQueryHook(bunotel.NewQueryHook(bunotel.WithDBName("mydb")))
```

As expected, Bun creates [spans](https://docs.uptrace.dev/guide/tracing.html#spans) for processed
queries and records any errors as they occur. Here is how the collected information is displayed at
[Uptrace](https://uptrace.dev/explore/1/groups/?system=db%3Apostgresql&utm_source=bun&utm_campaign=bun-tracing):

![Bun trace](/img/bun-trace.png)

You can find a runnable example on
[GitHub](https://github.com/uptrace/bun/tree/master/example/opentelemetry).
