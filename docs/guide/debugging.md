# Logging queries

## bundebug

For quick debugging, you can print executed queries to stdout. First, you need to install `bundebug` package:

```shell
go get github.com/uptrace/bun/extra/bundebug
```

Then add the provided query hook which by default only prints failed queries:

```go
import "github.com/uptrace/bun/extra/bundebug"

db := bun.NewDB(sqldb, dialect)
db.AddQueryHook(bundebug.NewQueryHook())
```

To print all queries, use `WithVerbose` option:

```go
bundebug.NewQueryHook(bundebug.WithVerbose(true))
```

You can also disable the hook by default and use environment variables to enable it when needed:

```go
bundebug.NewQueryHook(
    // disable the hook
    bundebug.WithEnabled(false),

    // BUNDEBUG=1 logs failed queries
    // BUNDEBUG=2 logs all queries
    bundebug.FromEnv("BUNDEBUG"),
)
```

## Logrus hook

You can also use [logrusbun](https://github.com/oiime/logrusbun) to log executed queries using [Logrus](https://github.com/sirupsen/logrus)

```shell
go get github.com/oiime/logrusbun
```

Use `QueryHookOptions` to adjust log levels and behavior:

```go
db := bun.NewDB(sqldb, dialect)

log := logrus.New()
db.AddQueryHook(logrusbun.NewQueryHook(logrusbun.QueryHookOptions{Logger: log}))
```

## Zap hook

You can also use [bunzap](https://github.com/alexlast/bunzap) to log executed queries using [Zap](https://github.com/uber-go/zap)

```shell
go get github.com/alexlast/bunzap
```

Example:

```go
db := bun.NewDB(sqldb, dialect)

logger, err := zap.NewProduction()
db.AddQueryHook(bunzap.NewQueryHook(bunzap.QueryHookOptions{
    Logger:       logger,
    SlowDuration: 200 * time.Millisecond, // Omit to log all operations as debug
}))
```
