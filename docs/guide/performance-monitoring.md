---
title: Bun Performance Monitoring
---

<CoverImage title="Bun Performance Monitoring" />

[[toc]]

## What is OpenTelemetry?

Bun relies on OpenTelemetry to monitor database performance and errors using
[OpenTelemetry tracing](https://uptrace.dev/opentelemetry/distributed-tracing.html) and
[OpenTelemetry metrics](https://uptrace.dev/opentelemetry/metrics.html).

[OpenTelemetry](https://uptrace.dev/opentelemetry/) is a vendor-neutral API for distributed traces
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

To make tracing work, you must use an active
[span context](https://uptrace.dev/opentelemetry/go-tracing.html#context) when executing queries,
for example:

```go
ctx := req.Context()
err := db.NewSelect().Scan(ctx)
```

## Uptrace

Uptrace is an [open-source APM](https://uptrace.dev/get/open-source-apm.html) and a popular
[DataDog competitor](https://uptrace.dev/get/compare/datadog-competitors.html) that supports
distributed tracing, metrics, and logs. You can use it to monitor applications and set up automatic
alerts to receive notifications via email, Slack, Telegram, and more.

You can [install Uptrace](https://uptrace.dev/get/install.html) by downloading a DEB/RPM package or
a pre-compiled binary.

As expected, otelbun creates
[spans](https://uptrace.dev/opentelemetry/distributed-tracing.html#spans) for processed queries and
records any errors as they occur. Here is how the collected information is displayed at
[Uptrace](https://app.uptrace.dev/explore/1/?system=db%3Apostgresql&utm_source=bun&utm_campaign=bun-tracing):

![Bun trace](/img/bun-trace.png)

You can find a runnable example at
[GitHub](https://github.com/uptrace/bun/tree/master/example/opentelemetry).

## Prometheus

You can also send OpenTelemetry metrics to Prometheus using
[OpenTelemetry Prometheus exporter](https://uptrace.dev/opentelemetry/opentelemetry-prometheus.html).

## What's next?

Next, start using Uptrace by following the
[Getting started guide](https://uptrace.dev/get/get-started.html).

You can also check the following guides to monitor features specific to your RDBMS:

- [PostgreSQL performance monitoring](https://uptrace.dev/opentelemetry/postgresql-monitoring.html)
- [MySQL performance monitoring](https://uptrace.dev/opentelemetry/mysql-monitoring.html)
- [OpenTelemetry GORM](https://uptrace.dev/opentelemetry/instrumentations/go-gorm.html)
