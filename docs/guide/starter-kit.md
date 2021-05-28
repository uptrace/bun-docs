# Bun Starter Kit

Bun [starter kit](https://github.com/go-bun/bun-starter-kit) consists of:

- [treemux](https://github.com/vmihailenco/treemux)
- [bun](https://github.com/uptrace/bun)
- Hooks to decouple and initialize the app.
- CLI to run migrations.
- example package that shows how to load fixtures and test handlers.

You can also check [bun-realworld-app](https://github.com/go-bun/bun-realworld-app) which is a JSON
API built with Bun starter kit.

## App structure

The starter kit has the following structure:

```shell
├─ bunapp
│  └─ app.go
│  └─ config.go
│  └─ router.go
│  └─ start.go
│  └─ hook.go
│  └─ embed
│     └─ config
│        └─ dev.yaml
│        └─ test.yaml
├─ cmd
│  └─ bun
│     └─ main.go
│     └─ migrations
│        └─ main.go
│        └─ 20210505110026_init.go
├─ example
│  └─ init.go
│  └─ example_handler.go
│  └─ example_handler_test.go
├─ .gitignore
└─ go.mod
```

The main entrypoints are:

- `bunapp/app.go` contains `App` struct that maintains the app state. For example, `App.DB()`
  creates `*bun.DB`.
- `bunapp/config.go` contains the `Config` struct to parse YAML configuration, for example,
  `bunapp/embed/config/dev.yaml`.
- `cmd/bun/migrations` contains database migrations.
- `example/init.go` is the package entry point.

You should keep HTTP handlers and DB models in the same package, but split the app into logically
isolated packages. Each package should have `init.go` file with the module initialization logic.

## Starting the app

The kit provides convenience methods to start/stop the app:

```go
func main() {
	ctx, app, err := bunapp.Start(ctx, "service_name", "environment_name")
	if err != nil {
		panic(err)
	}
	defer app.Stop()
}
```

It also provides hooks to execute custom code on the app start/stop. You usually add hooks from the
`init` function in your module's `init.go` file.

```go
func init() {
	bunapp.OnStart("hook.name", func(ctx context.Context, app *bunapp.App) error {
		app.Router().GET("/endpoint", handler)

		app.OnStop("hook.name", func(ctx context.Context, app *bunapp.App) error {
			log.Println("stopping...")
		})

		return nil
	})
}
```

## Treemux

[treemux](https://github.com/vmihailenco/treemux) is a fast and flexible HTTP router with error
handling. Using treemux, you can replace the following classic HTTP handler:

```go
func myHandler(w http.ResponseWriter, req *http.Request) {
    user, err := selectUser(req.Context())
    if err != nil {
        writeError(w, err)
        return
    }

    err = writeResult(w, map[string]interface{}{
        "user": user
    })
    if err != nil {
        writeError(w, err)
        return
    }
}
```

With the following treemux handler:

```go
func myHandler(w http.ResponseWriter, req treemux.Request) error {
    user, err := selectUser(req.Context(), req.Param("user_id"))
    if err != nil {
        return err
    }

    return treemux.JSON(w, treemux.H{
        "user": user,
    })
}
```

`treemux.Request` is a thin wrapper around `*http.Request` that carries `context.Context` and
information about the current route:

```go
type Request struct {
	*http.Request
	ctx context.Context
	route string
	Params Params
}
```

To customize error handling (and [more](https://github.com/vmihailenco/treemux/tree/master/extra)),
you can use middlewares:

```go
import "github.com/vmihailenco/treemux"

router := treemux.New(
    treemux.WithMiddleware(errorHandler),
)

func errorHandler(next treemux.HandlerFunc) treemux.HandlerFunc {
    return func(w http.ResponseWriter, req treemux.Request) error {
        err := next(w, req)
        if err == nil {
            return nil
        }

        if err == sql.ErrNoRows {
            w.WriteHeader(http.StatusNotFound)
        } else {
            w.WriteHeader(http.StatusBadRequest)
        }

        _ = treemux.JSON(w, treemux.H{
            "message": err.Error(),
        })

        return err
    }
}
```

## Migrations

The kit also provides a CLI to manage migrations:

```shell
go run cmd/bun/main.go

NAME:
   bun db - manage database migrations

USAGE:
   bun db [global options] command [command options] [arguments...]

COMMANDS:
   init        create migration tables
   migrate     migrate database
   rollback    rollback the last migration group
   unlock      unlock migrations
   create_go   create a Go migration
   create_sql  create a SQL migration
   help, h     Shows a list of commands or help for one command

GLOBAL OPTIONS:
   --help, -h  show help (default: false)
```
