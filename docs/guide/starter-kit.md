# Bun Starter Kit

Bun [starter kit](https://github.com/go-bun/bun-starter-kit) consists of:

- [bunrouter](https://bunrouter.uptrace.dev/) is an extremely fast and flexible HTTP router.
- [bun](https://github.com/uptrace/bun)
- Hooks to decouple and initialize the app.
- CLI to run migrations.
- [example](https://github.com/go-bun/bun-starter-kit/tree/master/example) package that shows how to load fixtures and test handlers.

You can also check [bun-realworld-app](https://github.com/go-bun/bun-realworld-app) which is a JSON API built with Bun starter kit.

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

- `bunapp/app.go` contains `App` struct that maintains the app state. For example, `App.DB()` creates `*bun.DB`.
- `bunapp/config.go` contains the `Config` struct to parse YAML configuration, for example, `bunapp/embed/config/dev.yaml`.
- `cmd/bun/migrations` contains database migrations.
- `example/init.go` is the package entry point.

You should keep HTTP handlers and DB models in the same package, but split the app into logically isolated packages. Each package should have `init.go` file with the module initialization logic.

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

It also provides hooks to execute custom code on the app start/stop. You usually add hooks from the `init` function in your module's `init.go` file.

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
