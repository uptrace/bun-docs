---
title: 'Bun: Defining models'
---

<CoverImage title="Defining models" />

[[toc]]

## Mapping tables to structs

For each table you need to define a corresponding Go struct (model). Bun maps the exported struct fields to the table columns and ignores the unexported fields.

```go
type User struct {
	bun.BaseModel `bun:"table:users,alias:u"`

    ID    int64  `bun:"id,pk,autoincrement"`
    Name  string `bun:"name,notnull"`
    email string // unexported fields are ignored
}
```

## Struct tags

Bun uses sensible defaults to generate names and deduct types, but you can use the following struct tags to override the defaults.

| Tag                                        | Comment                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| bun.BaseModel \`bun:"table:table_name"\`   | Override default table name.                                                                                          |
| bun.BaseModel \`bun:"alias:table_alias"\`  | Override default table alias.                                                                                         |
| bun.BaseModel \`bun:"select:view_name"\`   | Override table name for SELECT queries.                                                                               |
| bun:"-"                                    | Ignore the field.                                                                                                     |
| bun:"column_name"                          | Override default column name.                                                                                         |
| bun:"alt:alt_name"                         | Alternative column name. Useful during migrations.                                                                    |
| bun:",pk"                                  | Mark column as a primary key and apply `notnull` option. Multiple/composite primary keys are supported.               |
| bun:",autoincrement"                       | Mark column as a serial in PostgreSQL, autoincrement in MySQL, and identity in MSSQL. Also applies `nullzero` option. |
| bun:"type:uuid"                            | Override default SQL type.                                                                                            |
| bun:"default:gen_random_uuid()"            | Tell `CreateTable` to set `DEFAULT` expression.                                                                       |
| bun:",notnull"                             | Tell `CreateTable` to add `NOT NULL` constraint.                                                                      |
| bun:",unique"                              | Tell `CreateTable` to add an unique constraint.                                                                       |
| bun:",unique:group_name"                   | Unique constraint for a group of columns.                                                                             |
| bun:",nullzero"                            | Marshal Go zero values as SQL `NULL` or `DEFAULT` (when supported).                                                   |
| bun:",scanonly"                            | Only use this field to scan query results and ignore in SELECT/INSERT/UPDATE/DELETE.                                  |
| bun:",array"                               | Use PostgreSQL array.                                                                                                 |
| bun:",json_use_number"                     | Use `json.Decoder.UseNumber` to decode JSON.                                                                          |
| bun:",msgpack"                             | Encode/decode data using MessagePack.                                                                                 |
| DeletedAt time.Time \`bun:",soft_delete"\` | Enable soft deletes on the model.                                                                                     |

## Table names

Bun generates table names and aliases from struct names by underscoring them. It also pluralizes table names, for example, struct `ArticleCategory` gets table name `article_categories` and alias `article_category`.

To override the generated name and the alias:

```go
type User struct {
	bun.BaseModel `bun:"table:myusers,alias:u"`
}
```

To specify a different table name for `SELECT` queries:

```go
type User struct {
	bun.BaseModel `bun:"select:users_view,alias:u"`
}
```

### ModelTableExpr

Using the `ModelTableExpr` method, you can override the struct table name, but not the alias. `ModelTableExpr` should always use the same table alias, for example:

```go
type User struct {
	bun.BaseModel `bun:"table:myusers,alias:u"`
}

// Good.
db.NewSelect().Model(&User{}).ModelTableExpr("all_users AS u")
db.NewSelect().Model(&User{}).ModelTableExpr("deleted_users AS u")

// Bad.
db.NewSelect().Model(&User{}).ModelTableExpr("all_users AS user")
db.NewSelect().Model(&User{}).ModelTableExpr("deleted_users AS deleted")
```

## Column names

Bun generates column names from struct field names by underscoring them. For example, struct field `UserID` gets column name `user_id`.

To override the generated column name:

```go
type User struct {
	Name string `bun:"myname"`
}
```

## SQL naming convention

Use [snake_case](https://en.wikipedia.org/wiki/Snake_case) identifiers for table and column names. If you get spurious SQL parser errors, try to quote the identifier with double quotes (backticks for MySQL) to check if the problem goes away.

<!-- prettier-ignore -->
::: warning
Don't use [SQL keywords](https://www.postgresql.org/docs/13/sql-keywords-appendix.html) (for example
`order`, `user`) as identifiers.
:::

<!-- prettier-ignore -->
::: warning
Don't use case-sensitive names because such names are folded to lower case, for example,
`UserOrders` becomes `userorders`.
:::

## Column types

Bun generates column types from the struct field types. For example, Go type `string` is translated to SQL type `varchar`.

To override the generated column type:

```go
type User struct {
    ID int64 `bun:"type:integer"`
}
```

## NULLs

To represent SQL `NULL`, you can use pointers or `sql.Null*` types:

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

To marshal a zero Go value as `NULL`, use `nullzero` tag:

```go
type User struct {
	Name string `bun:",nullzero"`
}
```

## DEFAULT

To specify a default SQL expression, use the combination of `nullzero`, `notnull`, and `default` tags:

```go
type User struct {
	Name string `bun:",nullzero,notnull,default:'unknown'"`
}

err := db.NewCreateTable().Model((*User)(nil)).Exec(ctx)
```

```sql
CREATE TABLE users (
  name text NOT NULL DEFAULT 'unknown'
);
```

## Automatic timestamps

Use the following code to automatically set creation and update time on `INSERT`:

```go
type User struct {
	CreatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
	UpdatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
}
```

If you don't want to set update time, use `bun.NullTime`:

```go
type User struct {
	CreatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
	UpdatedAt bun.NullTime
}
```

You can also use [hooks](hooks.md) to set struct fields:

```go
var _ bun.BeforeAppendModelHook = (*User)(nil)

func (u *User) BeforeAppendModel(ctx context.Context, query bun.Query) error {
	switch query.(type) {
	case *bun.InsertQuery:
		u.CreatedAt = time.Now()
	case *bun.UpdateQuery:
		u.UpdatedAt = time.Now()
	}
	return nil
}
```

## Extending models

You can add/remove fields to/from an existing model by using `extend` tag option. The new model will inherit the table name and the alias from the original model.

```go
type UserWithCount struct {
	User `bun:",extend"`

	Name		string `bun:"-"` // remove this field
	AvatarCount int				 // add a new field
}
```

## Embedding structs

Bun allows to embed a model in another model using a prefix, for example:

```go
type Role struct {
	Name     string
	Users    Permissions `bun:"embed:users_"`
	Profiles Permissions `bun:"embed:profiles_"`
	Roles    Permissions `bun:"embed:roles_"`
}

type Permissions struct {
	View   bool
	Create bool
	Update bool
	Delete bool
}
```

The code above generates the following table:

```sql
CREATE TABLE roles (
    name TEXT,

    users_view BOOLEAN,
    users_create BOOLEAN,
    users_update BOOLEAN,
    users_delete BOOLEAN,

    profiles_view BOOLEAN,
    profiles_create BOOLEAN,
    profiles_update BOOLEAN,
    profiles_delete BOOLEAN,

    roles_view BOOLEAN,
    roles_create BOOLEAN,
    roles_update BOOLEAN,
    roles_delete BOOLEAN
);
```

## See also

- [Monitoring Bun performance](/guide/performance-monitoring.md)
- [Running Bun in production](/guide/running-bun-in-production.md)
- [Context deadline exceeded](https://uptrace.dev/glossary/context-deadline-exceeded)
