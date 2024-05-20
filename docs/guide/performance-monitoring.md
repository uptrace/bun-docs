---
title: Bun Performance Monitoring
---

<CoverImage title="Bun Performance Monitoring" />

[[toc]]

## What is OpenTelemetry?

Bun relies on OpenTelemetry to monitor database performance and errors using [OpenTelemetry tracing](https://uptrace.dev/opentelemetry/distributed-tracing.html) and [OpenTelemetry metrics](https://uptrace.dev/opentelemetry/metrics.html).

OpenTelemetry is designed to be language- and framework-agnostic, supporting multiple programming languages and frameworks. It offers language-specific software development kits (SDKs) that make it easier to integrate telemetry collection into applications written in different languages.

OpenTelemetry also provides exporters and integrations to send telemetry data to various [OpenTelemetry backend](https://uptrace.dev/blog/opentelemetry-backend.html) systems and observability platforms, including popular tools like Prometheus, Grafana, Jaeger, Zipkin, Elasticsearch, and more.

By using OpenTelemetry, developers can adopt a standardized approach to observability, making it easier to collect and analyze telemetry data across different components of a distributed system. It helps improve troubleshooting, performance optimization, and monitoring of applications, providing valuable insights into their behavior and performance.

## OpenTelemetry instrumentaton

Bun comes with an OpenTelemetry instrumentation called [bunotel](https://github.com/uptrace/bun/tree/master/extra/bunotel) that is distributed as a separate module:

```shell
go get github.com/uptrace/bun/extra/bunotel
```

To instrument Bun database, you need to add the hook provided by bunotel:

```go
import "github.com/uptrace/bun/extra/bunotel"

db := bun.NewDB(sqldb, dialect)
db.AddQueryHook(bunotel.NewQueryHook(bunotel.WithDBName("mydb")))
```

To make tracing work, you must use an active [span context](https://uptrace.dev/opentelemetry/go-tracing.html#context) when executing queries, for example:

```go
ctx := req.Context()
err := db.NewSelect().Scan(ctx)
```

## Uptrace

Uptrace is an [open source APM](https://uptrace.dev/get/open-source-apm.html) for OpenTelemetry that supports distributed tracing, metrics, and logs. You can use it to monitor applications and troubleshoot issues.

![Uptrace Overview](/uptrace/home.png)

Uptrace comes with an intuitive query builder, rich dashboards, alerting rules, notifications, and integrations for most languages and frameworks.

Uptrace can process billions of spans and metrics on a single server and allows you to monitor your applications at 10x lower cost.

In just a few minutes, you can try Uptrace by visiting the [cloud demo](https://app.uptrace.dev/play) (no login required) or running it locally with [Docker](https://github.com/uptrace/uptrace/tree/master/example/docker). The source code is available on [GitHub](https://github.com/uptrace/uptrace).

## Prometheus

OpenTelemetry can also integrate with Prometheus, a popular monitoring and alerting system, to collect and export telemetry data.

By integrating OpenTelemetry with Prometheus, you can leverage the powerful monitoring and alerting capabilities of Prometheus while benefiting from the flexibility and standardization provided by OpenTelemetry. This integration enables you to collect, store, visualize, and analyze metrics from your applications and systems, gaining valuable insights into their performance and behavior.

You can send OpenTelemetry metrics to Prometheus using [OpenTelemetry Prometheus exporter](https://uptrace.dev/opentelemetry/opentelemetry-prometheus.html).

## Conclusion

Overall, monitoring SQL performance is crucial for optimizing query execution, improving application responsiveness, ensuring scalability, troubleshooting issues, and maintaining the security and compliance of your database environment. It enables you to proactively manage and optimize your SQL infrastructure, leading to better application performance, efficient resource utilization, and enhanced user satisfaction.

- [otelgorm: OpenTelemetry GORM](https://uptrace.dev/get/instrument/opentelemetry-gorm.html)
- [OpenTelemetry MySQL](https://uptrace.dev/get/monitor/opentelemetry-mysql.html)
