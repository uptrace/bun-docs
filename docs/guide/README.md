# What is Bun?

Bun is a SQL-first database client for Go that bridges the gap between raw SQL and Go's type system. The "SQL-first" philosophy means that Bun prioritizes SQL familiarity while providing the safety and convenience of Go's type system.

## Key Features

- **SQL-first approach**: Write queries that look and feel like SQL
- **Type-safe scanning**: Automatically scan results into Go structs, maps, slices, and scalars
- **Multi-database support**: Works with PostgreSQL, MySQL, SQLite, and SQL Server
- **Query builder**: Fluent API for constructing complex queries programmatically
- **Hook system**: Middleware for logging, metrics, and custom query processing
- **Schema management**: Built-in migrations and fixtures support

## Quick Start

Here's a simple example to get you started:

```go
package main

import (
    "context"
    "database/sql"
    "fmt"

    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/pgdialect"
    "github.com/uptrace/bun/driver/pgdriver"
)

type User struct {
    ID    int64  `bun:"id,pk,autoincrement"`
    Name  string `bun:"name,notnull"`
    Email string `bun:"email,unique"`
}

func main() {
    // Connect to database
    sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN("postgres://user:pass@localhost/dbname")))
    db := bun.NewDB(sqldb, pgdialect.New())
    defer db.Close()

    ctx := context.Background()

    // Create a user
    user := &User{Name: "John Doe", Email: "john@example.com"}
    _, err := db.NewInsert().Model(user).Exec(ctx)
    if err != nil {
        panic(err)
    }

    // Query users
    var users []User
    err = db.NewSelect().Model(&users).Where("name LIKE ?", "%John%").Scan(ctx)
    if err != nil {
        panic(err)
    }

    fmt.Printf("Found %d users\n", len(users))
}
```

## How Bun Works

### Architecture Overview

Bun is built on top of Go's standard `sql.DB`, extending it with additional functionality while maintaining full compatibility:

```go
type DB struct {
    *sql.DB  // Embedded standard database connection
    dialect  schema.Dialect
    hooks    []QueryHook
    // ... other fields
}
```

This design means you can:

- Use Bun alongside existing `database/sql` code
- Access the underlying `sql.DB` via `db.DB` when needed
- Gradually migrate existing projects to use Bun's features

### Database Dialects

Bun uses dialects to handle database-specific features and SQL syntax differences:

| Database   | Driver Package                           | Dialect               |
| ---------- | ---------------------------------------- | --------------------- |
| PostgreSQL | `github.com/uptrace/bun/driver/pgdriver` | `pgdialect.New()`     |
| MySQL      | `github.com/go-sql-driver/mysql`         | `mysqldialect.New()`  |
| SQLite     | `github.com/mattn/go-sqlite3`            | `sqlitedialect.New()` |
| SQL Server | `github.com/microsoft/go-mssqldb`        | `mssqldialect.New()`  |

Example with different databases:

```go
// PostgreSQL
sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN("postgres://...")))
db := bun.NewDB(sqldb, pgdialect.New())

// MySQL
sqldb := sql.Open("mysql", "user:password@tcp(localhost:3306)/dbname")
db := bun.NewDB(sqldb, mysqldialect.New())

// SQLite
sqldb := sql.Open("sqlite3", ":memory:")
db := bun.NewDB(sqldb, sqlitedialect.New())
```

## Query Building Examples

### Basic CRUD Operations

**Create (Insert)**

```go
user := &User{Name: "Alice", Email: "alice@example.com"}

// Single insert
_, err := db.NewInsert().Model(user).Exec(ctx)

// Bulk insert
users := []*User{
    {Name: "Bob", Email: "bob@example.com"},
    {Name: "Carol", Email: "carol@example.com"},
}
_, err := db.NewInsert().Model(&users).Exec(ctx)
```

**Read (Select)**

```go
// Select by primary key
user := new(User)
err := db.NewSelect().Model(user).Where("id = ?", 1).Scan(ctx)

// Select multiple with conditions
var users []User
err := db.NewSelect().
    Model(&users).
    Where("created_at > ?", time.Now().AddDate(0, -1, 0)).
    Order("name ASC").
    Limit(10).
    Scan(ctx)

// Count records
count, err := db.NewSelect().Model((*User)(nil)).Count(ctx)
```

**Update**

```go
// Update specific user
_, err := db.NewUpdate().
    Model(&user).
    Set("name = ?", "New Name").
    Where("id = ?", user.ID).
    Exec(ctx)

// Bulk update
_, err := db.NewUpdate().
    Model((*User)(nil)).
    Set("updated_at = ?", time.Now()).
    Where("last_login < ?", time.Now().AddDate(0, 0, -30)).
    Exec(ctx)
```

**Delete**

```go
// Delete by ID
_, err := db.NewDelete().Model((*User)(nil)).Where("id = ?", 1).Exec(ctx)

// Soft delete (if using soft delete fields)
_, err := db.NewUpdate().
    Model((*User)(nil)).
    Set("deleted_at = ?", time.Now()).
    Where("id = ?", 1).
    Exec(ctx)
```

### Advanced Query Examples

**Joins and Relationships**

```go
type Order struct {
    ID     int64 `bun:"id,pk"`
    UserID int64 `bun:"user_id"`
    User   *User `bun:"rel:belongs-to,join:user_id=id"`
    Amount int   `bun:"amount"`
}

// Select with join
var orders []Order
err := db.NewSelect().
    Model(&orders).
    Relation("User").
    Where("order.amount > ?", 100).
    Scan(ctx)
```

**Subqueries**

```go
// Using subquery in WHERE clause
subquery := db.NewSelect().
    Model((*Order)(nil)).
    Column("user_id").
    Where("amount > ?", 1000)

var users []User
err := db.NewSelect().
    Model(&users).
    Where("id IN (?)", subquery).
    Scan(ctx)
```

**Aggregations and Grouping**

```go
type SalesReport struct {
    Region     string `bun:"region"`
    TotalSales int64  `bun:"total_sales"`
    OrderCount int    `bun:"order_count"`
}

var reports []SalesReport
err := db.NewSelect().
    Model((*Order)(nil)).
    Column("region").
    ColumnExpr("SUM(amount) AS total_sales").
    ColumnExpr("COUNT(*) AS order_count").
    Group("region").
    Having("SUM(amount) > ?", 10000).
    Order("total_sales DESC").
    Scan(ctx, &reports)
```

## Why Choose Bun?

### Complex Query Example

Here's the original complex query example with additional context:

```go
// This example demonstrates a business intelligence query
// that finds top-performing products in high-revenue regions

// Step 1: Calculate regional sales totals
regionalSales := db.NewSelect().
    ColumnExpr("region").
    ColumnExpr("SUM(amount) AS total_sales").
    TableExpr("orders").
    GroupExpr("region")

// Step 2: Identify top-performing regions (above average)
topRegions := db.NewSelect().
    ColumnExpr("region").
    TableExpr("regional_sales").
    Where("total_sales > (SELECT SUM(total_sales) / 10 FROM regional_sales)")

// Step 3: Generate product performance report for top regions
var results []ProductSalesReport
err := db.NewSelect().
    With("regional_sales", regionalSales).
    With("top_regions", topRegions).
    ColumnExpr("region").
    ColumnExpr("product").
    ColumnExpr("SUM(quantity) AS product_units").
    ColumnExpr("SUM(amount) AS product_sales").
    TableExpr("orders").
    Where("region IN (SELECT region FROM top_regions)").
    GroupExpr("region").
    GroupExpr("product").
    OrderExpr("product_sales DESC").
    Scan(ctx, &results)
```

This generates clean, readable SQL:

```sql
WITH regional_sales AS (
    SELECT region, SUM(amount) AS total_sales
    FROM orders
    GROUP BY region
), top_regions AS (
    SELECT region
    FROM regional_sales
    WHERE total_sales > (SELECT SUM(total_sales)/10 FROM regional_sales)
)
SELECT region,
       product,
       SUM(quantity) AS product_units,
       SUM(amount) AS product_sales
FROM orders
WHERE region IN (SELECT region FROM top_regions)
GROUP BY region, product
ORDER BY product_sales DESC
```

## Migration and Schema Management

### Migrations

```go
import "github.com/uptrace/bun/migrate"

// Define migration
func init() {
    Migrations.MustRegister(func(ctx context.Context, db *bun.DB) error {
        _, err := db.Exec(`CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )`)
        return err
    }, func(ctx context.Context, db *bun.DB) error {
        _, err := db.Exec(`DROP TABLE users`)
        return err
    })
}

// Run migrations
migrator := migrate.NewMigrator(db, Migrations)
err := migrator.Lock(ctx)
if err != nil {
    return err
}
defer migrator.Unlock(ctx)

group, err := migrator.Migrate(ctx)
```

### Fixtures

```go
import "github.com/uptrace/bun/dbfixture"

// Load test data
fixture := dbfixture.New(db, dbfixture.WithRecreateTables())
err := fixture.Load(ctx, os.DirFS("."), "fixtures/users.yml")
```

## Comparison with Other ORMs

### vs GORM

| Feature                        | Bun                               | GORM                     |
| ------------------------------ | --------------------------------- | ------------------------ |
| **SQL-first approach**         | ✅ Queries look like SQL          | ❌ Active Record pattern |
| **Learning curve**             | 📈 Low (if you know SQL)          | 📈 Medium (new concepts) |
| **Complex queries**            | ✅ Excellent support              | ⚠️ Can be challenging    |
| **Performance**                | ✅ Lightweight, fast              | ⚠️ More overhead         |
| **Auto-migrations**            | ❌ Manual migrations              | ✅ Automatic             |
| **Database-specific features** | ✅ Excellent (arrays, JSON, etc.) | ⚠️ Limited               |

**When to choose Bun:**

- You're comfortable with SQL
- Need to write complex queries
- Performance is critical
- Want database-specific features

**When to choose GORM:**

- Prefer Active Record pattern
- Want automatic migrations
- Need extensive plugin ecosystem

### vs Ent

| Aspect              | Bun                            | Ent                            |
| ------------------- | ------------------------------ | ------------------------------ |
| **Philosophy**      | Enhance SQL, don't replace it  | Graph-based schema-first       |
| **Code generation** | Minimal/optional               | Required                       |
| **Type safety**     | Good                           | Excellent                      |
| **Flexibility**     | High (use raw SQL when needed) | Medium (framework constraints) |

## Best Practices

### Model Definition

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID        int64     `bun:"id,pk,autoincrement"`
    Name      string    `bun:"name,notnull"`
    Email     string    `bun:"email,unique,notnull"`
    CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
    UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`

    // Relations
    Orders []*Order `bun:"rel:has-many,join:id=user_id"`
}
```

### Error Handling

```go
err := db.NewSelect().Model(&user).Where("id = ?", id).Scan(ctx)
if err != nil {
    if errors.Is(err, sql.ErrNoRows) {
        // Handle not found case
        return nil, ErrUserNotFound
    }
    // Handle other database errors
    return nil, fmt.Errorf("failed to get user: %w", err)
}
```

### Transaction Management

```go
err := db.RunInTx(ctx, nil, func(ctx context.Context, tx bun.Tx) error {
    // All operations within this function are part of the transaction
    _, err := tx.NewInsert().Model(&user).Exec(ctx)
    if err != nil {
        return err // This will rollback the transaction
    }

    _, err = tx.NewInsert().Model(&orders).Exec(ctx)
    return err
})
```

## Common Use Cases

### 1. REST API Backend

Bun excels at powering REST APIs where you need efficient database operations with type safety.

### 2. Data Analytics

The query builder makes it easy to construct complex analytical queries with CTEs, window functions, and aggregations.

### 3. Microservices

Lightweight nature makes it perfect for microservices where you want database access without heavy ORM overhead.

### 4. Legacy Database Integration

SQL-first approach makes it easy to work with existing databases and complex schemas.

## Frequently Asked Questions

**Q: Can I use raw SQL with Bun?**
A: Yes! You can always fall back to raw SQL when needed:

```go
var users []User
err := db.NewRaw("SELECT * FROM users WHERE complex_condition(?)", param).Scan(ctx, &users)
```

**Q: How does Bun handle database connections?**
A: Bun wraps the standard `sql.DB`, so it uses Go's built-in connection pooling. You can configure pool settings on the underlying `sql.DB`.

**Q: Can I use Bun with an existing database?**
A: Absolutely! Bun works great with existing databases. You just need to define Go structs that match your table schemas.

**Q: Is Bun suitable for high-traffic applications?**
A: Yes, Bun is designed for performance and has minimal overhead compared to heavier ORMs.

## Next Steps

1. **Installation**: `go get -u github.com/uptrace/bun`
2. **Choose your driver**: Install the appropriate database driver
3. **Follow the [starter guide](starter-kit.md)** for a complete example
4. **Explore advanced features**: [Hooks](hooks.md), [Relations](relations.md), [Migrations](migrations.md)

## Additional Resources

- [GitHub Repository](https://github.com/uptrace/bun)
- [API Documentation](https://pkg.go.dev/github.com/uptrace/bun)
- [Migration from go-pg](pg-migration.md)
- [Performance Guide](performance.md)
- [Examples Repository](https://github.com/uptrace/bun/tree/master/example)
