---
title: SQL Performance and Errors Monitoring
---

<CoverImage title="Golang ORM Performance and Errors Monitoring" />

[[toc]]

## What is OpenTelemetry?

Bun relies on OpenTelemetry to monitor database performance and errors using
[distributed tracing](https://opentelemetry.uptrace.dev/guide/distributed-tracing.html) and
[metrics](https://opentelemetry.uptrace.dev/guide/metrics.html).

[OpenTelemetry](https://opentelemetry.uptrace.dev/) is a vendor-neutral API for distributed traces
and metrics. It specifies how to collect and send telemetry data to backend platforms. It means that
you can instrument your application once and then add or change vendors (backends) as required.

## OpenTelemetry instrumentaton

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

To make tracing work, you must use the active
[span context](https://opentelemetry.uptrace.dev/guide/go-tracing.html#context) when executing
queries, for example:

```go
ctx := req.Context()
err := db.NewSelect().Scan(ctx)
```

## Uptrace

[Uptrace](https://uptrace.dev/) is an open source
[DataDog alternative](https://get.uptrace.dev/compare/datadog-competitors.html) that helps
developers pinpoint failures and find performance bottlenecks. Uptrace can process billions of spans
on a single server and allows to monitor your software at 10x lower cost.

You can [install Uptrace](https://get.uptrace.dev/guide/opentelemetry-tracing-tool.html) by
downloading a DEB/RPM package or a pre-compiled binary.

As expected, otelbun creates
[spans](https://opentelemetry.uptrace.dev/guide/distributed-tracing.html#spans) for processed
queries and records any errors as they occur. Here is how the collected information is displayed at
[Uptrace](https://uptrace.dev/explore/1/groups/?system=db%3Apostgresql&utm_source=bun&utm_campaign=bun-tracing):

![Bun trace](/img/bun-trace.png)

You can find a runnable example at
[GitHub](https://github.com/uptrace/bun/tree/master/example/opentelemetry).

## Prometheus

You can send OpenTelemetry metrics to Prometheus using
[OpenTelemetry Prometheus exporter](https://opentelemetry.uptrace.dev/guide/opentelemetry-prometheus.html).
Alternatively, you can also use [j2gg0s/otsql](https://github.com/j2gg0s/otsql) that directly works
with Prometheus.

## See also

- [Open Source distributed tracing tools](https://get.uptrace.dev/compare/distributed-tracing-tools.html)
- [DataDog competitors and alternatives](https://get.uptrace.dev/compare/datadog-competitors.html)
- [OpenTelemetry guide for Gin, GORM, and Zap](https://get.uptrace.dev/opentelemetry/gin-gorm.html)
