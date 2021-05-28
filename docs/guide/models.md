# Defining models

For each database table you need to define a corresponding Go struct (model). Bun maps the exported
struct fields to the table columns and ignores the unexported fields.

## Table names

Bun derives the table name and the alias from the struct name by underscoring it. It also pluralized
the table name, for example, struct `User` gets table name `users` and alias `user`.

To override the table name and the alias:

```go
type User struct {
	bun.BaseModel `bun:"myusers,alias:u"`
}
```

To specify a different table name for `SELECT` queries:

```go
type Genre struct {
	bun.BaseModel `bun:"select:users_view,alias:u"`
}
```

## Column names

Bun derives the column name from the struct field name by underscoring it. For example, struct field
`UserID` gets column name `user_id`.

To override the column name and the type:

```go
type User struct {
	Name string `bun:"myname,type:varchar(100)"`
}
```

## Column types

Bun derives the column type from the struct field type. For example, Go `string` gets SQL type
`varchar`.

To override the column type:

```go
type User struct {
    ID int64 `bun:"type:integer"`
}
```

## SQL naming convention

To avoid errors, use [snake_case](https://en.wikipedia.org/wiki/Snake_case) names. If you get
spurious SQL parser errors, try to quote the identifier with double quotes (backticks for MySQL) to
check if the problem goes away.

<!-- prettier-ignore -->
::: warning
Don't use [SQL keywords](https://www.postgresql.org/docs/13/sql-keywords-appendix.html) (for example
`order`, `user`) as an identifier.
:::

<!-- prettier-ignore -->
::: warning
Don't use case-sensitive names because such names are folded to lower case (for example,
`UserOrders` becomes `userorders`).
:::

## Modeling NULL values

To represent SQL `NULL`, can use pointers or `sql.Null*` types:

```go
type Item struct {
    Active *bool
    // or
    Active sql.NullBool
}
```

For example:

- `(*bool)(nil)` and `sql.NullBool{}` represent `NULL`.
- `(*bool)(false)` and `sql.NullBool{Valid: true}` represent `FALSE`.
- `(*bool)(true)` and `sql.NullBool{Valid: true, Value: true}` represent `TRUE`.

## Go zero values and NULL

To marshal a zero Go value as `NULL`, add `nullzero` tag option:

```go
type User struct {
    Name string `bun:",nullzero"`
}
```

## NULL and DEFAULT

To specify a default SQL value, use the combination of `notnull` and `default` tags:

```go
type User struct {
    Name string `bun:",nullzero,notnull,default:'unknown'"`
}
```
