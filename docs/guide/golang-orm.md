---
title: Golang ORM for PostgreSQL and MySQL
description: Bun is a Golang ORM for PostgreSQL and MySQL that is based on database/sql APIs.
keywords:
  - golang orm
  - go orm
  - golang database orm
  - golang orm mysql
  - golang orm postgresql
---

# Golang ORM for PostgreSQL and MySQL

![Golang ORM](/bun/cover.png)

Bun is a SQL-first Golang ORM (Object-Relational Mapping) that supports PostgreSQL, MySQL, MSSQL, and SQLite. It aims to provide a simple and efficient way to work with databases while utilizing Go's type safety and reducing boilerplate code.

**Key Features:**

- Built on top of Go's standard `database/sql` package
- Type-safe query builder with excellent performance
- Support for complex relationships and joins
- Migration support and schema management
- Comprehensive scanning capabilities
- Hooks and middleware support
- Production-ready with extensive testing

## Why Choose Bun?

Bun stands out from other Go ORMs by being **SQL-first** rather than trying to hide SQL from you. This approach offers several advantages:

- **Predictable queries**: You know exactly what SQL is being generated
- **High performance**: Minimal overhead over raw SQL
- **Gradual adoption**: Easy to integrate into existing codebases
- **Flexibility**: Drop down to raw SQL when needed
- **Type safety**: Compile-time checking for most operations

## Installation

To install Bun and the database driver you need:

```shell
# Core Bun package
go get github.com/uptrace/bun@latest

# Database drivers (choose one or more)
go get github.com/uptrace/bun/driver/pgdriver        # PostgreSQL
go get github.com/uptrace/bun/driver/sqliteshim     # SQLite
go get github.com/go-sql-driver/mysql               # MySQL
go get github.com/denisenkom/go-mssqldb             # SQL Server
```

## Quick Start

Here's a complete example to get you started:

```go
package main

import (
    "context"
    "database/sql"
    "fmt"

    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/sqlitedialect"
    "github.com/uptrace/bun/driver/sqliteshim"
    "github.com/uptrace/bun/extra/bundebug"
)

// User model
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID    int64  `bun:",pk,autoincrement"`
    Name  string `bun:",notnull"`
    Email string `bun:",unique"`
}

func main() {
    ctx := context.Background()

    // Open database connection
    sqldb, err := sql.Open(sqliteshim.ShimName, "file::memory:?cache=shared")
    if err != nil {
        panic(err)
    }
    defer sqldb.Close()

    // Create Bun database instance
    db := bun.NewDB(sqldb, sqlitedialect.New())

    // Add query debugging (optional)
    db.AddQueryHook(bundebug.NewQueryHook(
        bundebug.WithVerbose(true),
    ))

    // Create table
    _, err = db.NewCreateTable().Model((*User)(nil)).IfNotExists().Exec(ctx)
    if err != nil {
        panic(err)
    }

    // Insert user
    user := &User{Name: "John Doe", Email: "john@example.com"}
    _, err = db.NewInsert().Model(user).Exec(ctx)
    if err != nil {
        panic(err)
    }

    // Select user
    var selectedUser User
    err = db.NewSelect().Model(&selectedUser).Where("email = ?", "john@example.com").Scan(ctx)
    if err != nil {
        panic(err)
    }

    fmt.Printf("User: %+v\n", selectedUser)
}
```

## Connecting to Different Databases

### PostgreSQL

```go
import (
    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/pgdialect"
    "github.com/uptrace/bun/driver/pgdriver"
)

// Using pgdriver (recommended)
sqldb := sql.NewDB(pgdriver.NewConnector(
    pgdriver.WithDSN("postgres://user:password@localhost:5432/dbname?sslmode=disable"),
))
db := bun.NewDB(sqldb, pgdialect.New())

// Or using lib/pq
import _ "github.com/lib/pq"
sqldb, err := sql.Open("postgres", "postgres://user:password@localhost/dbname?sslmode=disable")
db := bun.NewDB(sqldb, pgdialect.New())
```

### MySQL

```go
import (
    "github.com/uptrace/bun/dialect/mysqldialect"
    _ "github.com/go-sql-driver/mysql"
)

sqldb, err := sql.Open("mysql", "user:password@tcp(localhost:3306)/dbname?parseTime=true")
if err != nil {
    panic(err)
}
db := bun.NewDB(sqldb, mysqldialect.New())
```

### SQLite

```go
import (
    "github.com/uptrace/bun/dialect/sqlitedialect"
    "github.com/uptrace/bun/driver/sqliteshim"
)

sqldb, err := sql.Open(sqliteshim.ShimName, "file:test.db?cache=shared&mode=rwc")
if err != nil {
    panic(err)
}
db := bun.NewDB(sqldb, sqlitedialect.New())
```

## Connection Pool Configuration

Configure your database connection pool for optimal performance:

```go
// Configure connection pool
sqldb.SetMaxOpenConns(25)                 // Maximum open connections
sqldb.SetMaxIdleConns(10)                 // Maximum idle connections
sqldb.SetConnMaxLifetime(5 * time.Minute) // Connection lifetime
sqldb.SetConnMaxIdleTime(5 * time.Minute) // Idle connection timeout

// Test the connection
if err := sqldb.Ping(); err != nil {
    log.Fatal("Failed to connect to database:", err)
}
```

## Using Bun with Existing Code

Learning all Bun capabilities may take some time, but you can start using it right away by executing manually crafted queries and allowing Bun to scan results for you:

### Raw Queries with Bun Scanning

```go
type User struct {
    ID   int64
    Name string
    CreatedAt time.Time
}

users := make([]User, 0)

// Use Bun's powerful scanning with raw SQL
err := db.NewRaw(
    "SELECT id, name, created_at FROM ? WHERE status = ? ORDER BY created_at DESC LIMIT ?",
    bun.Ident("users"), "active", 100,
).Scan(ctx, &users)
```

```sql
SELECT id, name, created_at FROM "users" WHERE status = 'active' ORDER BY created_at DESC LIMIT 100
```

### Integrating with Existing Transactions

If you already have code that uses `*sql.Tx` or `*sql.Conn`, you can still use Bun query builder without rewriting the existing code:

```go
// Start a transaction with database/sql
tx, err := sqldb.Begin()
if err != nil {
    panic(err)
}
defer tx.Rollback()

// Execute existing SQL code
if _, err := tx.Exec("UPDATE users SET last_login = NOW() WHERE id = ?", userID); err != nil {
    return err
}

// Use Bun query builder with the same transaction
user := &User{Name: "New User"}
_, err = db.NewInsert().
    Conn(tx). // Use existing transaction
    Model(user).
    Exec(ctx)
if err != nil {
    return err
}

// Commit the transaction
return tx.Commit()
```

## Defining Models

Bun uses struct-based [models](models.md) to construct [queries](queries.md) and scan results. Models define your database schema using Go structs with struct tags.

### Basic Model Structure

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID        int64     `bun:",pk,autoincrement"`
    Name      string    `bun:",notnull"`
    Email     string    `bun:",unique,notnull"`
    CreatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
    UpdatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
}
```

### Common Struct Tags

| Tag                 | Description               | Example                    |
| ------------------- | ------------------------- | -------------------------- |
| `pk`                | Primary key               | `bun:",pk"`                |
| `autoincrement`     | Auto-incrementing field   | `bun:",pk,autoincrement"`  |
| `notnull`           | NOT NULL constraint       | `bun:",notnull"`           |
| `unique`            | UNIQUE constraint         | `bun:",unique"`            |
| `default:value`     | Default value             | `bun:",default:0"`         |
| `type:varchar(100)` | Custom column type        | `bun:",type:varchar(100)"` |
| `nullzero`          | Treat zero values as NULL | `bun:",nullzero"`          |
| `-`                 | Ignore field              | `bun:"-"`                  |

### Advanced Model Examples

```go
// User with JSON field and custom types
type User struct {
    bun.BaseModel `bun:"table:users"`

    ID       int64                  `bun:",pk,autoincrement"`
    Name     string                 `bun:",notnull"`
    Email    string                 `bun:",unique,notnull"`
    Settings map[string]interface{} `bun:",type:jsonb"` // PostgreSQL JSONB
    Status   UserStatus            `bun:",type:varchar(20),default:'active'"`

    CreatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
    UpdatedAt time.Time `bun:",nullzero,notnull,default:current_timestamp"`
    DeletedAt time.Time `bun:",soft_delete,nullzero"` // Soft delete support
}

type UserStatus string

const (
    UserStatusActive   UserStatus = "active"
    UserStatusInactive UserStatus = "inactive"
    UserStatusBanned   UserStatus = "banned"
)

// Profile with foreign key
type Profile struct {
    bun.BaseModel `bun:"table:profiles"`

    ID     int64  `bun:",pk,autoincrement"`
    UserID int64  `bun:",notnull"`
    Bio    string
    Avatar string

    // Relationship
    User *User `bun:"rel:belongs-to,join:user_id=id"`
}
```

## Schema Management

### Creating and Dropping Tables

```go
// Create a single table
_, err := db.NewCreateTable().
    Model((*User)(nil)).
    IfNotExists().
    Exec(ctx)

// Create table with indexes
_, err := db.NewCreateTable().
    Model((*User)(nil)).
    IfNotExists().
    Exec(ctx)

// Add index after table creation
_, err = db.NewCreateIndex().
    Model((*User)(nil)).
    Index("idx_users_email").
    Column("email").
    Exec(ctx)

// Drop table
_, err := db.NewDropTable().
    Model((*User)(nil)).
    IfExists().
    Cascade(). // Drop dependent objects
    Exec(ctx)

// Reset model (drop and recreate)
err := db.ResetModel(ctx, (*User)(nil))
```

### Multiple Tables and Dependencies

```go
// Create multiple tables with proper ordering
models := []interface{}{
    (*User)(nil),
    (*Profile)(nil),
    (*Post)(nil),
}

for _, model := range models {
    _, err := db.NewCreateTable().
        Model(model).
        IfNotExists().
        Exec(ctx)
    if err != nil {
        return err
    }
}
```

## CRUD Operations

### Insert Operations

```go
// Insert single user
user := &User{Name: "John Doe", Email: "john@example.com"}
_, err := db.NewInsert().Model(user).Exec(ctx)
// user.ID is now populated

// Insert multiple users (bulk insert)
users := []*User{
    {Name: "Alice", Email: "alice@example.com"},
    {Name: "Bob", Email: "bob@example.com"},
}
_, err := db.NewInsert().Model(&users).Exec(ctx)

// Insert with ON CONFLICT handling
_, err = db.NewInsert().
    Model(user).
    On("CONFLICT (email) DO UPDATE").
    Set("name = EXCLUDED.name").
    Exec(ctx)

// Insert and return specific columns
var ids []int64
_, err = db.NewInsert().
    Model(&users).
    Returning("id").
    Exec(ctx, &ids)
```

### Update Operations

```go
// Update by primary key
user := &User{ID: 1, Name: "Updated Name"}
_, err := db.NewUpdate().
    Model(user).
    Column("name").
    WherePK().
    Exec(ctx)

// Update with WHERE clause
_, err = db.NewUpdate().
    Model((*User)(nil)).
    Set("last_login = ?", time.Now()).
    Where("status = ?", "active").
    Exec(ctx)

// Update with subquery
_, err = db.NewUpdate().
    Model((*User)(nil)).
    Set("post_count = (SELECT COUNT(*) FROM posts WHERE user_id = users.id)").
    Exec(ctx)

// Bulk update with CASE
_, err = db.NewUpdate().
    Model((*User)(nil)).
    Set("status = CASE WHEN last_login < ? THEN 'inactive' ELSE 'active' END",
        time.Now().AddDate(0, -3, 0)).
    Exec(ctx)
```

### Delete Operations

```go
// Delete by primary key
user := &User{ID: 1}
_, err := db.NewDelete().
    Model(user).
    WherePK().
    Exec(ctx)

// Delete with WHERE clause
_, err = db.NewDelete().
    Model((*User)(nil)).
    Where("created_at < ?", time.Now().AddDate(-1, 0, 0)).
    Exec(ctx)

// Soft delete (requires soft_delete tag)
_, err = db.NewDelete().
    Model(user).
    WherePK().
    Exec(ctx) // Sets deleted_at timestamp

// Force delete (bypass soft delete)
_, err = db.NewDelete().
    Model(user).
    WherePK().
    ForceDelete().
    Exec(ctx)
```

### Select Operations

```go
// Select by primary key
user := new(User)
err := db.NewSelect().
    Model(user).
    Where("id = ?", 1).
    Scan(ctx)

// Select multiple users
var users []User
err := db.NewSelect().
    Model(&users).
    Where("status = ?", "active").
    Order("created_at DESC").
    Limit(10).
    Scan(ctx)

// Select with complex conditions
err = db.NewSelect().
    Model(&users).
    Where("name ILIKE ?", "%john%").
    WhereOr("email ILIKE ?", "%admin%").
    WhereGroup(" AND ", func(q *bun.SelectQuery) *bun.SelectQuery {
        return q.Where("created_at > ?", time.Now().AddDate(0, -1, 0)).
               Where("status != ?", "banned")
    }).
    Scan(ctx)

// Select specific columns
var names []string
err = db.NewSelect().
    Model((*User)(nil)).
    Column("name").
    Where("status = ?", "active").
    Scan(ctx, &names)

// Count records
count, err := db.NewSelect().
    Model((*User)(nil)).
    Where("status = ?", "active").
    Count(ctx)
```

## Advanced Scanning Capabilities

Bun provides flexible scanning options for different use cases:

### Scanning into Structs

```go
// Single struct
user := new(User)
err := db.NewSelect().Model(user).Where("id = ?", 1).Scan(ctx)

// Slice of structs
var users []User
err := db.NewSelect().Model(&users).Limit(10).Scan(ctx)

// Nested struct scanning
type UserWithProfile struct {
    User    `bun:",embed"`
    Profile *Profile `bun:"rel:has-one"`
}

var userWithProfile UserWithProfile
err := db.NewSelect().
    Model(&userWithProfile).
    Relation("Profile").
    Where("user.id = ?", 1).
    Scan(ctx)
```

### Scanning into Maps and Scalars

```go
// Scalar values
var id int64
var name string
err := db.NewSelect().
    Model((*User)(nil)).
    Column("id", "name").
    Where("email = ?", "john@example.com").
    Scan(ctx, &id, &name)

// Map scanning
var userMap map[string]interface{}
err := db.NewSelect().
    Model((*User)(nil)).
    Where("id = ?", 1).
    Scan(ctx, &userMap)

// Slice of maps
var userMaps []map[string]interface{}
err := db.NewSelect().
    Model((*User)(nil)).
    Limit(10).
    Scan(ctx, &userMaps)

// Column slices
var ids []int64
var names []string
err := db.NewSelect().
    Model((*User)(nil)).
    Column("id", "name").
    Scan(ctx, &ids, &names)
```

### Custom Scanning

```go
// Custom destination with ScanRows
rows, err := db.NewSelect().
    Model((*User)(nil)).
    Rows(ctx)
if err != nil {
    return err
}
defer rows.Close()

for rows.Next() {
    user := new(User)
    if err := db.ScanRow(ctx, rows, user); err != nil {
        return err
    }
    // Process user...
}
```

## Table Relationships

Bun supports various relationship types with automatic JOIN generation:

### Belongs-To Relationship

```go
type Post struct {
    bun.BaseModel `bun:"table:posts"`

    ID       int64  `bun:",pk,autoincrement"`
    Title    string `bun:",notnull"`
    Content  string
    AuthorID int64  `bun:",notnull"`

    // Belongs-to relationship
    Author *User `bun:"rel:belongs-to,join:author_id=id"`
}

// Query with relationship
var posts []Post
err := db.NewSelect().
    Model(&posts).
    Relation("Author").
    Where("post.status = ?", "published").
    Scan(ctx)
```

### Has-One Relationship

```go
type User struct {
    bun.BaseModel `bun:"table:users"`

    ID   int64  `bun:",pk,autoincrement"`
    Name string `bun:",notnull"`

    // Has-one relationship
    Profile *Profile `bun:"rel:has-one,join:id=user_id"`
}

// Query with has-one
var users []User
err := db.NewSelect().
    Model(&users).
    Relation("Profile").
    Scan(ctx)
```

### Has-Many Relationship

```go
type User struct {
    bun.BaseModel `bun:"table:users"`

    ID   int64  `bun:",pk,autoincrement"`
    Name string

    // Has-many relationship
    Posts []Post `bun:"rel:has-many,join:id=author_id"`
}

// Query with has-many
var users []User
err := db.NewSelect().
    Model(&users).
    Relation("Posts", func(q *bun.SelectQuery) *bun.SelectQuery {
        return q.Where("status = ?", "published").Order("created_at DESC")
    }).
    Scan(ctx)
```

### Many-to-Many Relationship

```go
type User struct {
    bun.BaseModel `bun:"table:users"`

    ID   int64  `bun:",pk,autoincrement"`
    Name string

    // Many-to-many relationship
    Roles []Role `bun:"m2m:user_roles,join:User=Role"`
}

type Role struct {
    bun.BaseModel `bun:"table:roles"`

    ID   int64  `bun:",pk,autoincrement"`
    Name string `bun:",unique,notnull"`
}

type UserRole struct {
    bun.BaseModel `bun:"table:user_roles"`

    UserID int64 `bun:",pk"`
    RoleID int64 `bun:",pk"`
    User   *User `bun:"rel:belongs-to,join:user_id=id"`
    Role   *Role `bun:"rel:belongs-to,join:role_id=id"`
}

// Query many-to-many
var users []User
err := db.NewSelect().
    Model(&users).
    Relation("Roles").
    Scan(ctx)
```

## Query Building and Complex Queries

### Subqueries

```go
// Subquery in WHERE
subq := db.NewSelect().
    Model((*Post)(nil)).
    Column("author_id").
    Where("status = ?", "published").
    Group("author_id").
    Having("COUNT(*) > ?", 5)

var users []User
err := db.NewSelect().
    Model(&users).
    Where("id IN (?)", subq).
    Scan(ctx)

// Subquery in SELECT
err = db.NewSelect().
    Model(&users).
    ColumnExpr("(SELECT COUNT(*) FROM posts WHERE author_id = users.id) as post_count").
    Scan(ctx)
```

### Window Functions

```go
// Row number with partition
var results []struct {
    User     `bun:",embed"`
    RowNum   int `bun:"row_num"`
    PostRank int `bun:"post_rank"`
}

err := db.NewSelect().
    Model(&results).
    ColumnExpr("*, ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at) as row_num").
    ColumnExpr("RANK() OVER (ORDER BY post_count DESC) as post_rank").
    Scan(ctx)
```

### Common Table Expressions (CTEs)

```go
// Recursive CTE
cte := db.NewSelect().
    With("RECURSIVE user_hierarchy", db.NewSelect().
        ColumnExpr("id, name, manager_id, 0 as level").
        Model((*User)(nil)).
        Where("manager_id IS NULL").
        UnionAll(
            db.NewSelect().
                ColumnExpr("u.id, u.name, u.manager_id, uh.level + 1").
                TableExpr("users u").
                Join("JOIN user_hierarchy uh ON u.manager_id = uh.id"),
        ),
    ).
    Table("user_hierarchy").
    Column("*")

var hierarchy []struct {
    ID        int64  `bun:"id"`
    Name      string `bun:"name"`
    ManagerID *int64 `bun:"manager_id"`
    Level     int    `bun:"level"`
}

err := cte.Scan(ctx, &hierarchy)
```

## Error Handling and Debugging

### Common Error Patterns

```go
import (
    "errors"
    "github.com/uptrace/bun"
)

// Check for no rows error
user := new(User)
err := db.NewSelect().Model(user).Where("id = ?", 999).Scan(ctx)
if err != nil {
    if errors.Is(err, sql.ErrNoRows) {
        // Handle not found
        return fmt.Errorf("user not found")
    }
    return err
}

// Check for unique constraint violation
_, err = db.NewInsert().Model(user).Exec(ctx)
if err != nil {
    if strings.Contains(err.Error(), "duplicate key") ||
       strings.Contains(err.Error(), "UNIQUE constraint") {
        return fmt.Errorf("user already exists")
    }
    return err
}
```

### Query Debugging

```go
import "github.com/uptrace/bun/extra/bundebug"

// Add debug hook
db.AddQueryHook(bundebug.NewQueryHook(
    bundebug.WithVerbose(true),
    bundebug.FromEnv("BUNDEBUG"), // Enable with BUNDEBUG=1
))

// Or create custom debug hook
type DebugHook struct{}

func (h *DebugHook) BeforeQuery(ctx context.Context, event *bun.QueryEvent) context.Context {
    return ctx
}

func (h *DebugHook) AfterQuery(ctx context.Context, event *bun.QueryEvent) {
    fmt.Printf("Query: %s\nDuration: %s\n", event.Query, event.Dur)
}

db.AddQueryHook(&DebugHook{})
```

## Transactions

```go
// Simple transaction
err := db.RunInTx(ctx, &sql.TxOptions{}, func(ctx context.Context, tx bun.Tx) error {
    user := &User{Name: "John"}
    if _, err := tx.NewInsert().Model(user).Exec(ctx); err != nil {
        return err
    }

    profile := &Profile{UserID: user.ID, Bio: "Hello"}
    if _, err := tx.NewInsert().Model(profile).Exec(ctx); err != nil {
        return err
    }

    return nil // Commit
})

// Manual transaction control
tx, err := db.BeginTx(ctx, &sql.TxOptions{})
if err != nil {
    return err
}
defer tx.Rollback()

// Use tx instead of db for operations
_, err = tx.NewInsert().Model(user).Exec(ctx)
if err != nil {
    return err
}

return tx.Commit()
```

## Performance Tips

### Query Optimization

```go
// Use indexes effectively
_, err := db.NewCreateIndex().
    Model((*User)(nil)).
    Index("idx_users_email_status").
    Column("email", "status").
    Exec(ctx)

// Use LIMIT when appropriate
var users []User
err := db.NewSelect().
    Model(&users).
    Where("status = ?", "active").
    Order("created_at DESC").
    Limit(100). // Always limit large queries
    Scan(ctx)

// Use specific columns instead of *
var userSummaries []struct {
    ID   int64  `bun:"id"`
    Name string `bun:"name"`
}
err = db.NewSelect().
    Model((*User)(nil)).
    Column("id", "name"). // Only select needed columns
    Scan(ctx, &userSummaries)
```

### Bulk Operations

```go
// Bulk insert with batch size
const batchSize = 1000
users := make([]*User, 10000) // Large slice

for i := 0; i < len(users); i += batchSize {
    end := i + batchSize
    if end > len(users) {
        end = len(users)
    }

    batch := users[i:end]
    _, err := db.NewInsert().Model(&batch).Exec(ctx)
    if err != nil {
        return err
    }
}
```

## Testing

```go
import (
    "testing"
    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dbfixture"
)

func TestUserOperations(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)

    // Load fixtures
    fixture := dbfixture.New(db)
    if err := fixture.Load(ctx, "testdata/users.yml"); err != nil {
        t.Fatal(err)
    }

    // Test operations
    var count int
    count, err := db.NewSelect().Model((*User)(nil)).Count(ctx)
    if err != nil {
        t.Fatal(err)
    }

    if count != 3 {
        t.Errorf("expected 3 users, got %d", count)
    }
}

// testdata/users.yml
/*
model: User
rows:
  - id: 1
    name: Alice
    email: alice@example.com
  - id: 2
    name: Bob
    email: bob@example.com
  - id: 3
    name: Charlie
    email: charlie@example.com
*/
```

## Frequently Asked Questions

### Q: How do I handle database migrations?

A: Bun provides migration support through the `bun/migrate` package:

```go
import "github.com/uptrace/bun/migrate"

migrations := migrate.NewMigrations()
migrations.MustRegister(func(ctx context.Context, db *bun.DB) error {
    // Migration up
    _, err := db.NewCreateTable().Model((*User)(nil)).Exec(ctx)
    return err
}, func(ctx context.Context, db *bun.DB) error {
    // Migration down
    _, err := db.NewDropTable().Model((*User)(nil)).Exec(ctx)
    return err
})

migrator := migrate.NewMigrator(db, migrations)
if err := migrator.Init(ctx); err != nil {
    return err
}

if err := migrator.Migrate(ctx); err != nil {
    return err
}
```

### Q: Can I use Bun with existing database/sql code?

A: Absolutely! Bun is built on top of `database/sql` and can coexist with existing code. You can gradually migrate to Bun's query builder while keeping your current SQL queries.

### Q: How do I handle NULL values?

A: Use pointer types or `sql.Null*` types:

```go
type User struct {
    ID    int64   `bun:",pk,autoincrement"`
    Name  string  `bun:",notnull"`
    Email *string // NULL-able string
    Age   sql.NullInt64 // Alternative approach
}
```

### Q: What's the performance difference compared to raw SQL?

A: Bun adds minimal overhead over raw SQL. In most cases, the performance difference is negligible (< 5%), while providing significant benefits in terms of type safety and developer productivity.

### Q: How do I handle complex WHERE conditions?

A: Use WhereGroup for complex logic:

```go
err := db.NewSelect().
    Model(&users).
    Where("status = ?", "active").
    WhereGroup(" AND ", func(q *bun.SelectQuery) *bun.SelectQuery {
        return q.WhereOr("name LIKE ?", "%admin%").
                 WhereOr("email LIKE ?", "%admin%")
    }).
    Scan(ctx)
```

## Common Pitfalls and Best Practices

### ✅ Do's

- Always use placeholders (`?`) for query parameters to prevent SQL injection
- Use transactions for operations that must succeed or fail together
- Add appropriate indexes for frequently queried columns
- Use `LIMIT` for queries that might return large result sets
- Validate and sanitize input before using in queries
- Use connection pooling in production environments

### ❌ Don'ts

- Don't ignore errors from database operations
- Don't use string concatenation for building queries
- Don't forget to close database connections and transactions
- Don't use `SELECT *` when you only need specific columns
- Don't perform database operations in loops without batching

## What's Next

By now, you should have a comprehensive understanding of Bun's capabilities. To continue learning:

### Essential Next Steps

1. **Read the Core Documentation**

   - [Defining Models](models.md) - Deep dive into model configuration and struct tags
   - [Writing Queries](queries.md) - Advanced query building techniques
   - [Relationships](relations.html) - Master table relationships and joins

2. **Explore Advanced Features**

   - [Migrations](migrations.md) - Database schema versioning and management
   - [Hooks](hooks.html) - Middleware and query lifecycle hooks
   - [Fixtures](fixtures.md) - Test data management

3. **Production Considerations**
   - Connection pooling and performance tuning
   - Monitoring and observability setup
   - Error handling and logging strategies
   - Database migration deployment strategies

### Example Projects and Tutorials

- [Basic CRUD Application](https://github.com/uptrace/bun/tree/master/example/basic) - Complete example with all CRUD operations
- [REST API with Bun](https://github.com/uptrace/bun/tree/master/example/rest-api) - Building a production-ready API
- [Migration Example](https://github.com/uptrace/bun/tree/master/example/migrate) - Database migration patterns

### Related Tools and Ecosystem

- [Uptrace](https://uptrace.dev) - Distributed tracing and performance monitoring
- [Top DataDog competitors](https://uptrace.dev/blog/datadog-competitors) - APM and monitoring solutions
- [Distributed tracing tools](https://uptrace.dev/tools/distributed-tracing-tools) - Observability ecosystem
