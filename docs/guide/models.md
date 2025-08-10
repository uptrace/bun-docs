---
title: 'Bun: Defining models'
---

<CoverImage title="Defining models" />

Models in Bun are Go structs that represent database tables. They serve as the bridge between your Go application and the database, defining how data is structured, validated, and manipulated. This guide covers everything you need to know about creating and working with Bun models.

## Quick Start

The simplest model maps a Go struct to a database table:

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID   int64  `bun:"id,pk,autoincrement"`
    Name string `bun:"name,notnull"`
    Email string `bun:"email,unique"`
}
```

This creates a `users` table with three columns: `id` (primary key), `name` (required), and `email` (unique).

## Mapping Tables to Structs

For each database table, you define a corresponding Go struct (model). Bun automatically maps exported struct fields to table columns while ignoring unexported fields.

### Basic Model Structure

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    // Exported fields become database columns
    ID       int64     `bun:"id,pk,autoincrement"`
    Name     string    `bun:"name,notnull"`
    Email    string    `bun:"email,unique"`
    IsActive bool      `bun:"is_active,default:true"`

    // Unexported fields are ignored by Bun
    password string
    cache    map[string]interface{}
}
```

### Why Use bun.BaseModel?

The `bun.BaseModel` field provides:

- Table name and alias configuration
- Consistent interface across all models
- Support for advanced features like soft deletes
- Better error handling and debugging information

## Complete Struct Tags Reference

Bun uses sensible defaults but allows fine-grained control through struct tags. Here's the complete reference:

### Table-Level Tags

| Tag           | Example                   | Description                            |
| ------------- | ------------------------- | -------------------------------------- |
| `table:name`  | `bun:"table:users"`       | Override default table name            |
| `alias:name`  | `bun:"alias:u"`           | Set table alias for queries            |
| `select:name` | `bun:"select:users_view"` | Use different table for SELECT queries |

### Field-Level Tags

| Tag           | Example              | Description                            |
| ------------- | -------------------- | -------------------------------------- |
| `bun:"-"`     | `bun:"-"`            | Completely ignore this field           |
| `column_name` | `bun:"user_name"`    | Override column name                   |
| `alt:name`    | `bun:"alt:old_name"` | Alternative column name for migrations |

### Primary Keys and Identity

| Tag             | Example                | Description                                   |
| --------------- | ---------------------- | --------------------------------------------- |
| `pk`            | `bun:",pk"`            | Mark as primary key (implies `notnull`)       |
| `autoincrement` | `bun:",autoincrement"` | Auto-incrementing column (implies `nullzero`) |

```go
// Single primary key
type User struct {
    ID int64 `bun:"id,pk,autoincrement"`
}

// Composite primary key
type UserRole struct {
    UserID int64 `bun:"user_id,pk"`
    RoleID int64 `bun:"role_id,pk"`
}
```

### Data Types and Validation

| Tag             | Example                           | Description              |
| --------------- | --------------------------------- | ------------------------ |
| `type:sql_type` | `bun:"type:uuid"`                 | Override SQL column type |
| `notnull`       | `bun:",notnull"`                  | Add NOT NULL constraint  |
| `unique`        | `bun:",unique"`                   | Add unique constraint    |
| `unique:group`  | `bun:",unique:email_domain"`      | Group unique constraint  |
| `default:value` | `bun:"default:gen_random_uuid()"` | Set DEFAULT expression   |

### Special Behaviors

| Tag               | Example                  | Description                                            |
| ----------------- | ------------------------ | ------------------------------------------------------ |
| `nullzero`        | `bun:",nullzero"`        | Convert Go zero values to SQL NULL                     |
| `scanonly`        | `bun:",scanonly"`        | Only use for scanning results, ignore in modifications |
| `array`           | `bun:",array"`           | Use PostgreSQL arrays                                  |
| `json_use_number` | `bun:",json_use_number"` | Use precise numbers in JSON decoding                   |
| `msgpack`         | `bun:",msgpack"`         | Use MessagePack encoding                               |
| `soft_delete`     | `bun:",soft_delete"`     | Enable soft deletion                                   |

## Advanced Examples

### E-commerce Product Model

```go
type Product struct {
    bun.BaseModel `bun:"table:products,alias:p"`

    ID          int64           `bun:"id,pk,autoincrement"`
    SKU         string          `bun:"sku,unique,notnull"`
    Name        string          `bun:"name,notnull"`
    Description *string         `bun:"description"` // nullable
    Price       decimal.Decimal `bun:"type:decimal(10,2),notnull"`
    Stock       int             `bun:"stock,default:0"`
    Tags        []string        `bun:"tags,array"` // PostgreSQL array
    Metadata    map[string]any  `bun:"metadata,type:jsonb"`

    CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
    UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
    DeletedAt bun.NullTime `bun:"deleted_at,soft_delete"`
}
```

### User Profile with Relationships

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID       int64  `bun:"id,pk,autoincrement"`
    Username string `bun:"username,unique,notnull"`
    Email    string `bun:"email,unique,notnull"`

    // Profile relationship
    ProfileID *int64  `bun:"profile_id"`
    Profile   *Profile `bun:"rel:belongs-to,join:profile_id=id"`

    // Posts relationship
    Posts []Post `bun:"rel:has-many,join:id=user_id"`
}

type Profile struct {
    bun.BaseModel `bun:"table:profiles,alias:prof"`

    ID        int64   `bun:"id,pk,autoincrement"`
    FirstName string  `bun:"first_name,notnull"`
    LastName  string  `bun:"last_name,notnull"`
    Bio       *string `bun:"bio"`
    Avatar    *string `bun:"avatar"`
}
```

## Table and Column Names

### Naming Convention Best Practices

Bun automatically converts struct names to table names and field names to column names using these rules:

1. **CamelCase to snake_case**: `UserProfile` → `user_profile`
2. **Pluralization**: `User` → `users`
3. **Field conversion**: `FirstName` → `first_name`

```go
// Struct name: ArticleCategory
// Generated table: article_categories
// Generated alias: article_category

type ArticleCategory struct {
    ID          int64  `bun:"id,pk,autoincrement"`          // Column: id
    Title       string `bun:"title,notnull"`                // Column: title
    CategoryID  int64  `bun:"category_id"`                  // Column: category_id
    PublishedAt *time.Time `bun:"published_at"`             // Column: published_at
}
```

### Custom Names

Override defaults when needed:

```go
type User struct {
    bun.BaseModel `bun:"table:app_users,alias:au"`

    ID       int64  `bun:"user_id,pk,autoincrement"`
    FullName string `bun:"display_name,notnull"`
}
```

### Dynamic Table Names with ModelTableExpr

Use `ModelTableExpr` for runtime table selection while maintaining consistent aliases:

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`
    ID   int64  `bun:"id,pk"`
    Name string `bun:"name"`
}

// ✅ Correct - same alias 'u'
db.NewSelect().Model(&User{}).ModelTableExpr("active_users AS u")
db.NewSelect().Model(&User{}).ModelTableExpr("archived_users AS u")

// ❌ Wrong - different aliases break relationships
db.NewSelect().Model(&User{}).ModelTableExpr("active_users AS active")
```

**Use Cases for ModelTableExpr:**

- Table partitioning: `users_2024`, `users_2025`
- Views: `active_users`, `premium_users`
- A/B testing: `users_test`, `users_control`

## Working with NULL Values

### Pointer Types (Recommended)

```go
type User struct {
    Name     *string    // NULL when nil
    Age      *int       // NULL when nil
    IsActive *bool      // NULL when nil
    JoinedAt *time.Time // NULL when nil
}

// Usage
user := User{
    Name: &"John Doe",        // NOT NULL
    Age: nil,                 // NULL
    IsActive: &true,          // NOT NULL, true
}
```

### sql.Null\* Types

```go
import "database/sql"

type User struct {
    Name     sql.NullString
    Age      sql.NullInt64
    IsActive sql.NullBool
    JoinedAt sql.NullTime
}

// Usage
user := User{
    Name:     sql.NullString{String: "John", Valid: true},  // NOT NULL
    Age:      sql.NullInt64{},                              // NULL (Valid: false)
    IsActive: sql.NullBool{Bool: true, Valid: true},        // NOT NULL, true
}
```

### Bun-Specific NULL Types

```go
type User struct {
    Name     bun.NullString
    JoinedAt bun.NullTime
}
```

## Zero Values and NULL Handling

### The nullzero Tag

Convert Go zero values to SQL NULL:

```go
type User struct {
    Name  string `bun:"name,nullzero"`     // "" becomes NULL
    Age   int    `bun:"age,nullzero"`      // 0 becomes NULL
    Score *int   `bun:"score,nullzero"`    // nil becomes NULL, 0 becomes NULL
}
```

### Complex DEFAULT Expressions

```go
type User struct {
    ID        int64     `bun:"id,pk,autoincrement"`
    Name      string    `bun:"name,nullzero,notnull,default:'Anonymous'"`
    Email     string    `bun:"email,unique,notnull"`
    CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
    UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
    Score     int       `bun:"score,default:0"`
    UUID      string    `bun:"uuid,type:uuid,default:gen_random_uuid()"`
}
```

Generated SQL:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Anonymous',
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp,
    score INTEGER DEFAULT 0,
    uuid UUID DEFAULT gen_random_uuid()
);
```

## Automatic Timestamps

### Method 1: Database Defaults (Recommended)

```go
type User struct {
    CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
    UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
}
```

### Method 2: Application-Level with Hooks

```go
type User struct {
    ID        int64        `bun:"id,pk,autoincrement"`
    Name      string       `bun:"name,notnull"`
    CreatedAt time.Time    `bun:"created_at,nullzero,notnull"`
    UpdatedAt bun.NullTime `bun:"updated_at,nullzero"`
}

// Implement the hook interface
var _ bun.BeforeAppendModelHook = (*User)(nil)

func (u *User) BeforeAppendModel(ctx context.Context, query bun.Query) error {
    switch query.(type) {
    case *bun.InsertQuery:
        u.CreatedAt = time.Now()
        u.UpdatedAt = bun.NullTime{Time: time.Now(), Valid: true}
    case *bun.UpdateQuery:
        u.UpdatedAt = bun.NullTime{Time: time.Now(), Valid: true}
    }
    return nil
}
```

### Method 3: Manual Control

```go
type User struct {
    CreatedAt bun.NullTime `bun:"created_at"`
    UpdatedAt bun.NullTime `bun:"updated_at"`
}

// Set manually when needed
user.CreatedAt = bun.NullTime{Time: time.Now(), Valid: true}
```

## Model Composition and Inheritance

### Extending Models

Create variations of existing models:

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID   int64  `bun:"id,pk,autoincrement"`
    Name string `bun:"name,notnull"`
    Email string `bun:"email,unique"`
}

// Extended model for analytics
type UserWithStats struct {
    User `bun:",extend"`

    // Override/remove fields from base model
    Email string `bun:"-"` // Remove email from this view

    // Add new computed fields
    PostCount    int       `bun:"post_count"`
    LastLogin    time.Time `bun:"last_login"`
    TotalRevenue float64   `bun:"total_revenue"`
}
```

### Embedded Structs with Prefixes

Create flattened table structures:

```go
type Address struct {
    Street  string `bun:"street"`
    City    string `bun:"city"`
    State   string `bun:"state"`
    ZipCode string `bun:"zip_code"`
}

type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID              int64   `bun:"id,pk,autoincrement"`
    Name            string  `bun:"name,notnull"`

    HomeAddress     Address `bun:"embed:home_"`
    BillingAddress  Address `bun:"embed:billing_"`
    ShippingAddress Address `bun:"embed:shipping_"`
}
```

Generated table structure:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,

    -- Home address fields
    home_street TEXT,
    home_city TEXT,
    home_state TEXT,
    home_zip_code TEXT,

    -- Billing address fields
    billing_street TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_zip_code TEXT,

    -- Shipping address fields
    shipping_street TEXT,
    shipping_city TEXT,
    shipping_state TEXT,
    shipping_zip_code TEXT
);
```

## Advanced Column Types

### JSON and JSONB

```go
type Product struct {
    ID       int64          `bun:"id,pk,autoincrement"`
    Metadata map[string]any `bun:"metadata,type:jsonb"`
    Config   ProductConfig  `bun:"config,type:json"`
    Tags     []string       `bun:"tags,type:json"`
}

type ProductConfig struct {
    Enabled  bool     `json:"enabled"`
    Features []string `json:"features"`
    Limits   struct {
        MaxUsers int `json:"max_users"`
        Storage  int `json:"storage_gb"`
    } `json:"limits"`
}
```

### Arrays (PostgreSQL)

```go
type Article struct {
    ID       int64    `bun:"id,pk,autoincrement"`
    Title    string   `bun:"title,notnull"`
    Tags     []string `bun:"tags,array"`            // TEXT[]
    Scores   []int    `bun:"scores,array"`          // INTEGER[]
    Metadata []byte   `bun:"metadata,type:jsonb"`   // JSONB
}
```

### Custom Types

```go
import "github.com/google/uuid"

type User struct {
    ID      uuid.UUID `bun:"id,pk,type:uuid,default:gen_random_uuid()"`
    Name    string    `bun:"name,notnull"`
    Balance decimal.Decimal `bun:"balance,type:decimal(15,2),default:0.00"`
}
```

## Common Patterns and Best Practices

### Base Model Pattern

```go
type BaseModel struct {
    ID        int64        `bun:"id,pk,autoincrement"`
    CreatedAt time.Time    `bun:"created_at,nullzero,notnull,default:current_timestamp"`
    UpdatedAt time.Time    `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
    DeletedAt bun.NullTime `bun:"deleted_at,soft_delete"`
}

type User struct {
    BaseModel
    bun.BaseModel `bun:"table:users,alias:u"`

    Username string `bun:"username,unique,notnull"`
    Email    string `bun:"email,unique,notnull"`
}

type Post struct {
    BaseModel
    bun.BaseModel `bun:"table:posts,alias:p"`

    Title   string `bun:"title,notnull"`
    Content string `bun:"content,type:text"`
    UserID  int64  `bun:"user_id,notnull"`
}
```

### Audit Trail Pattern

```go
type AuditableModel struct {
    CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp"`
    CreatedBy int64     `bun:"created_by,notnull"`
    UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp"`
    UpdatedBy int64     `bun:"updated_by,notnull"`
    Version   int       `bun:"version,default:1"`
}

type Document struct {
    AuditableModel
    bun.BaseModel `bun:"table:documents,alias:d"`

    ID      int64  `bun:"id,pk,autoincrement"`
    Title   string `bun:"title,notnull"`
    Content string `bun:"content,type:text"`
}
```

## Validation and Constraints

### Database-Level Constraints

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID       int64  `bun:"id,pk,autoincrement"`
    Email    string `bun:"email,unique,notnull"`
    Username string `bun:"username,unique,notnull"`
    Age      int    `bun:"age,notnull"` // Add CHECK constraint via migration
}
```

### Application-Level Validation with Hooks

```go
import "net/mail"

var _ bun.BeforeAppendModelHook = (*User)(nil)

func (u *User) BeforeAppendModel(ctx context.Context, query bun.Query) error {
    // Validate email format
    if u.Email != "" {
        if _, err := mail.ParseAddress(u.Email); err != nil {
            return fmt.Errorf("invalid email format: %w", err)
        }
    }

    // Validate age range
    if u.Age < 13 || u.Age > 120 {
        return fmt.Errorf("age must be between 13 and 120")
    }

    return nil
}
```

## SQL Naming Conventions

### Recommended Naming

Use **snake_case** for all database identifiers:

```go
// ✅ Good
type UserProfile struct {
    ID          int64  `bun:"id,pk"`              // id
    FirstName   string `bun:"first_name"`         // first_name
    LastName    string `bun:"last_name"`          // last_name
    PhoneNumber string `bun:"phone_number"`       // phone_number
}
```

### Avoid These Patterns

```go
// ❌ Bad - SQL keywords
type Order struct {
    User string `bun:"user"` // 'user' is a SQL keyword
}

// ❌ Bad - Case-sensitive names get folded
type User struct {
    UserID string `bun:"UserID"` // becomes 'userid', not 'UserID'
}

// ❌ Bad - Mixed naming conventions
type User struct {
    firstName string `bun:"firstName"` // Use first_name instead
}
```

### Handling SQL Keywords

When you must use SQL keywords, quote them:

```sql
-- PostgreSQL/SQLite
CREATE TABLE "order" ("user" TEXT);

-- MySQL
CREATE TABLE `order` (`user` TEXT);
```

## Troubleshooting Common Issues

### Issue: "Column not found" errors

**Cause**: Mismatch between struct field names and database columns.

**Solution**:

```go
// Check field visibility and tags
type User struct {
    ID   int64  `bun:"id,pk"`     // ✅ Exported field
    name string `bun:"name"`      // ❌ Unexported - won't work
    Name string `bun:"user_name"` // ✅ Custom column name
}
```

### Issue: Zero values not handling correctly

**Cause**: Missing `nullzero` tag or incorrect NULL handling.

**Solution**:

```go
type User struct {
    Name  string `bun:"name,nullzero"`        // "" becomes NULL
    Score *int   `bun:"score"`                // Use pointer for optional
    Count int    `bun:"count,default:0"`      // Explicit default
}
```

### Issue: Primary key not working with autoincrement

**Cause**: Database-specific autoincrement syntax.

**Solution**:

```go
type User struct {
    // PostgreSQL: SERIAL/BIGSERIAL
    ID int64 `bun:"id,pk,autoincrement"`

    // Or specify the exact type
    ID int64 `bun:"id,pk,type:bigserial"`
}
```

## Performance Considerations

### Index-Friendly Models

```go
type User struct {
    bun.BaseModel `bun:"table:users,alias:u"`

    ID        int64     `bun:"id,pk,autoincrement"`
    Email     string    `bun:"email,unique"`           // Automatic index
    Username  string    `bun:"username,unique"`        // Automatic index
    Status    string    `bun:"status"`                 // Add index via migration
    CreatedAt time.Time `bun:"created_at,nullzero,default:current_timestamp"` // Index for time queries

    // Composite indexes via migration:
    // CREATE INDEX idx_users_status_created ON users(status, created_at);
}
```

### Selective Field Loading

```go
type UserSummary struct {
    ID       int64  `bun:"id"`
    Username string `bun:"username"`
    Email    string `bun:"email"`
    // Omit heavy fields like bio, avatar_data, etc.
}

// Use for listing operations
var users []UserSummary
err := db.NewSelect().Model(&users).Limit(100).Scan(ctx)
```

## FAQ

**Q: When should I use pointers vs sql.Null\* types?**
A: Use pointers for simplicity and when you control the data flow. Use `sql.Null*` when you need to distinguish between zero values and NULL, or when working with existing APIs that use these types.

**Q: Can I have multiple primary keys?**
A: Yes, Bun supports composite primary keys:

```go
type UserRole struct {
    UserID int64 `bun:"user_id,pk"`
    RoleID int64 `bun:"role_id,pk"`
}
```

**Q: How do I handle database migrations with model changes?**
A: Use Bun's migration system. When you change model fields, create corresponding migration files to alter the database schema.

**Q: What's the difference between `nullzero` and using pointers?**
A: `nullzero` converts Go zero values to SQL NULL at query time. Pointers represent NULL as `nil` and allow distinguishing between zero values and NULL.

**Q: Can I use the same struct for different tables?**
A: Yes, use `ModelTableExpr()` to specify different tables at runtime while keeping the same struct definition.

**Q: How do I debug struct tag issues?**
A: Enable Bun's debug mode to see generated SQL queries:

```go
db := bun.NewDB(sqldb, bunpgdriver.New())
db.AddQueryHook(bundebug.NewQueryHook(bundebug.WithVerbose(true)))
```

## Related Topics

- [Relationships and Associations](relations.md) - Define relationships between models
- [Hooks and Lifecycle Events](hooks.md) - Execute code during model operations
- [Migrations](migrations.md) - Manage database schema changes
- [Query Building](queries.md) - Build and execute database queries
