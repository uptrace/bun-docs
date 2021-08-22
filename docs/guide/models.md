# Defining models

For each table you need to define a corresponding Go struct (model). Bun maps the exported struct
fields to the table columns and ignores the unexported fields.

## Struct tags

Bun uses sensible defaults to generate names and deduct types, but you can use the following struct
tags to override the defaults.

| Tag                                        | Comment                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| bun.BaseModel \`bun:"table_name"\`         | Overrides default table name.                                                            |
| bun.BaseModel \`bun:"alias:table_alias"\`  | Overrides default table alias name.                                                      |
| bun.BaseModel \`bun:"select:view_name"\`   | Overrides table name for SELECT queries.                                                 |
| bun:"-"                                    | Ignores the field.                                                                       |
| bun:"column_name"                          | Overrides default column name.                                                           |
| bun:"alt:alt_name"                         | Alternative column name. Useful during migrations.                                       |
| bun:",pk"                                  | Marks column as a primary key. Multiple primary keys are supported.                      |
| bun:",nopk"                                | Not a primary key. Useful for columns like `id` and `uuid` if they are not primary keys. |
| bun:"type:uuid"                            | Overrides default SQL type.                                                              |
| bun:"default:gen_random_uuid()"            | SQL default value for the column.                                                        |
| bun:",notnull"                             | Adds `NOT NULL` SQL constraint.                                                          |
| bun:",unique"                              | Makes `CreateTable` to add an unique constraint.                                         |
| bun:",unique:group_name"                   | Unique constraint for a group of columns.                                                |
| bun:",array"                               | Treats the column as a PostgreSQL array.                                                 |
| bun:",nullzero"                            | Marshals Go zero values as SQL `NULL`.                                                   |
| bun:",allowzero"                           | Can be used on primary keys to undo the effect of `nullzero`.                            |
| bun:",json_use_number"                     | Uses `json.Decoder.UseNumber` to decode JSON.                                            |
| bun:",msgpack"                             | Encodes/decodes data using MessagePack.                                                  |
| DeletedAt time.Time \`bun:",soft_delete"\` | Enables soft deletes on the model.                                                       |

## Table names

Bun generates table names and aliases from struct names by underscoring them. It also pluralizes
table names, for example, struct `ArticleCategory` gets table name `article_categories` and alias
`article_category`.

To override the generated name and the alias:

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

Bun generates column names from struct field names by underscoring them. For example, struct field
`UserID` gets column name `user_id`.

To override the generated column name:

```go
type User struct {
	Name string `bun:"myname"`
}
```

## Column types

Bun generates column types from struct field types. For example, Go type `string` is translated to
SQL type `varchar`.

To override the generated column type:

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
`order`, `user`) as identifiers.
:::

<!-- prettier-ignore -->
::: warning
Don't use case-sensitive names because such names are folded to lower case (for example,
`UserOrders` becomes `userorders`).
:::

## Modeling NULL values

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

To marshal a zero Go value as `NULL`, add `nullzero` tag option:

```go
type User struct {
    Name string `bun:",nullzero"`
}
```

Sometimes it can be useful to allow zero values on primary keys:

```go
type User struct {
    ID int64 `bun:",allowzero"`
}
```

## NULL and DEFAULT

To specify a default SQL value, use the combination of `notnull` and `default` tags:

```go
type User struct {
    Name string `bun:",nullzero,notnull,default:'unknown'"`
}
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

Note that you need to manually set `updated_at` column when updating rows.
