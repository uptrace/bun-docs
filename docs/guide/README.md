# Introduction

Bun is a SQL-first database client for Go. SQL-first means that most SQL queries can be
automatically compiled to Bun expressions and Bun expressions look and feel like SQL queries.

The purpose of Bun is to allow writing queries using the good old SQL and to help scanning results
into common Go types: structs, maps, slices, and columns.

## How it works

Bun wraps `sql.DB` to provide query [builder](queries.md) and [hooks](hooks.md). The original
`sql.DB` is available as `db.DB` and can be used without any restrictions.

Bun comes with [dialects](drivers.md) for each supported database. Bun uses dialects to discover
available features when building queries and scanning query results. For example, to connect to a
PostgreSQL server, you should use PostgreSQL driver (for example, pgx) and PostgreSQL dialect
(pgdialect).

Bun provides [fixtures](fixtures.md) to load initial data and [migrations](migrations.md) to update
database schema. You can also use [Bun starter kit](starter-kit.md) to quickly bootstrap an app
using those packages.

## Why Not ...?

### GORM

It is usually easier to write complex queries using Bun rather than GORM. Out of the box, Bun has
better integration with database-specific functionality, for example, PostgreSQL arrays. Bun is also
faster, partly because it is smaller in size.

Bun does not support such popular GORM features like auto migrations (you can try
[fixtures](fixtures.md) instead), optimizer/index/comment hints, database resolver.

### go-pg

Bun is a rewrite of go-pg that works on top of `sql.DB` instead of using custom API. As a
consequence, Bun is slightly slower than go-pg but is able to work with different databases.

Bun will eventually replace go-pg. To migrate an existing go-pg app to Bun, see this
[guide](pg-migration.md).
