---
title: 'Bun: Drivers and dialects'
---

<CoverImage title="Drivers and dialects" />

# Bun: Supported Drivers and Dialects

Bun is a lightweight Go ORM that works with multiple database systems through a unified interface. To connect to any database, you need two key components:

1. **Database Driver** - A `database/sql` compatible driver that handles the low-level database communication
2. **Bun Dialect** - A Bun-specific module that translates Bun's query builder syntax into the appropriate SQL dialect for your database

This two-layer architecture allows Bun to provide a consistent API while supporting the unique features and syntax of different database systems.

## PostgreSQL

PostgreSQL is Bun's primary supported database with full feature compatibility.

See the dedicated [PostgreSQL](/postgres/) section for comprehensive setup instructions, advanced configuration options, and PostgreSQL-specific features.

**Key Features:**

- Full JSON/JSONB support
- Advanced indexing (GIN, GiST, etc.)
- Window functions and CTEs
- `ON CONFLICT DO UPDATE` (upsert) support

## MySQL

Bun supports MySQL 5.0+ and MariaDB using the popular [go-sql-driver/mysql](https://github.com/go-sql-driver/mysql) driver.

```go
import (
    "database/sql"

    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/mysqldialect"
    _ "github.com/go-sql-driver/mysql"
)

func connectMySQL() *bun.DB {
    // Basic connection
    sqldb, err := sql.Open("mysql", "root:password@tcp(localhost:3306)/mydb?parseTime=true")
    if err != nil {
        panic(err)
    }

    return bun.NewDB(sqldb, mysqldialect.New())
}
```

### Connection String Options

Common MySQL connection parameters:

- `parseTime=true` - Parse `DATE` and `DATETIME` values to `time.Time`
- `charset=utf8mb4` - Use UTF-8 encoding (recommended)
- `timeout=30s` - Connection timeout
- `readTimeout=30s` - Read timeout
- `writeTimeout=30s` - Write timeout

**Example with additional options:**

```go
dsn := "user:pass@tcp(localhost:3306)/dbname?parseTime=true&charset=utf8mb4&timeout=30s"
sqldb, err := sql.Open("mysql", dsn)
```

### MySQL-Specific Features

- `ON DUPLICATE KEY UPDATE` for upserts
- Full-text search capabilities
- JSON column support (MySQL 5.7+)

## SQL Server (MSSQL)

Bun supports Microsoft SQL Server v2019.CU4 and later, starting from Bun v1.1.x.

```go
import (
    "database/sql"

    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/mssqldialect"
    _ "github.com/denisenkom/go-mssqldb"
)

func connectSQLServer() *bun.DB {
    // Using connection string format
    dsn := "sqlserver://sa:MyPassword123@localhost:1433?database=mydb&connection+timeout=30"
    sqldb, err := sql.Open("sqlserver", dsn)
    if err != nil {
        panic(err)
    }

    return bun.NewDB(sqldb, mssqldialect.New())
}
```

### Alternative Connection Formats

SQL Server supports multiple connection string formats:

```go
// URL format (recommended)
"sqlserver://user:pass@localhost:1433?database=mydb"

// ADO.NET format
"server=localhost;user id=sa;password=MyPass;database=mydb"

// ODBC format
"driver=sql server;server=localhost;database=mydb;uid=sa;pwd=MyPass"
```

### SQL Server Features

- Window functions and CTEs
- `MERGE` statements for complex upserts
- Hierarchical data types
- Full-text search

## SQLite

SQLite is perfect for development, testing, and lightweight applications. Bun uses a smart shim driver that automatically selects the best SQLite implementation for your platform.

```go
import (
    "database/sql"

    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/sqlitedialect"
    "github.com/uptrace/bun/driver/sqliteshim"
)

func connectSQLite() *bun.DB {
    // File database
    sqldb, err := sql.Open(sqliteshim.ShimName, "file:myapp.db?cache=shared&mode=rwc")
    if err != nil {
        panic(err)
    }

    return bun.NewDB(sqldb, sqlitedialect.New())
}

func connectSQLiteMemory() *bun.DB {
    // In-memory database (great for testing)
    sqldb, err := sql.Open(sqliteshim.ShimName, "file::memory:?cache=shared")
    if err != nil {
        panic(err)
    }

    // Critical: Configure connection pool for in-memory databases
    sqldb.SetMaxIdleConns(1000)
    sqldb.SetConnMaxLifetime(0)

    return bun.NewDB(sqldb, sqlitedialect.New())
}
```

### SQLite Connection Options

- `file:path/to/db.sqlite` - File-based database
- `file::memory:` - In-memory database
- `?cache=shared` - Enable shared cache mode
- `?mode=rwc` - Read-write-create mode
- `?_busy_timeout=5000` - Set busy timeout (milliseconds)
- `?_journal_mode=WAL` - Enable WAL mode for better concurrency

### Important: In-Memory Database Configuration

When using SQLite in-memory databases, you **must** configure the connection pool to prevent the database from being destroyed when connections close:

```go
// Prevent connection closure from destroying in-memory database
sqldb.SetMaxIdleConns(1000)        // Keep connections alive
sqldb.SetConnMaxLifetime(0)        // No connection expiry
sqldb.SetMaxOpenConns(1)           // Single connection for consistency
```

### Driver Selection Logic

The `sqliteshim` automatically chooses between:

- **modernc.org/sqlite** - Pure Go implementation (default on most platforms)
- **mattn/go-sqlite3** - CGO-based implementation (faster but requires CGO)

## Oracle

Oracle Database support allows integration with enterprise Oracle systems.

```go
import (
    "database/sql"

    "github.com/uptrace/bun"
    "github.com/uptrace/bun/dialect/oracledialect"
    _ "github.com/mattn/go-oci8"
)

func connectOracle() *bun.DB {
    // Basic connection
    dsn := "user/password@localhost:1521/xe"
    sqldb, err := sql.Open("oci8", dsn)
    if err != nil {
        panic(err)
    }

    return bun.NewDB(sqldb, oracledialect.New())
}
```

### Oracle Connection Formats

```go
// Basic format
"username/password@host:port/service_name"

// With SID instead of service name
"username/password@host:port:sid"

// TNS format
"username/password@(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=host)(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=xe)))"
```

**Note:** Oracle support requires CGO and the Oracle Client libraries to be installed on your system.

## Writing Database-Specific Code

Bun provides elegant ways to handle differences between database systems while keeping your code maintainable.

### Feature Detection

Use feature detection to write portable code that adapts to database capabilities:

```go
import "github.com/uptrace/bun/dialect/feature"

func insertOrUpdate(db *bun.DB, user *User) error {
    if db.HasFeature(feature.InsertOnConflict) {
        // PostgreSQL, SQLite: Use ON CONFLICT
        _, err := db.NewInsert().
            Model(user).
            On("CONFLICT (email) DO UPDATE").
            Set("updated_at = EXCLUDED.updated_at").
            Exec(ctx)
        return err
    } else if db.HasFeature(feature.InsertOnDuplicateKey) {
        // MySQL, MariaDB: Use ON DUPLICATE KEY UPDATE
        _, err := db.NewInsert().
            Model(user).
            On("DUPLICATE KEY UPDATE updated_at = VALUES(updated_at)").
            Exec(ctx)
        return err
    } else {
        // Fallback: Separate insert/update logic
        return insertOrUpdateFallback(db, user)
    }
}
```

### Available Features

| Feature                | Description                      | Supported Databases              |
| ---------------------- | -------------------------------- | -------------------------------- |
| `InsertOnConflict`     | `ON CONFLICT DO UPDATE` syntax   | PostgreSQL, SQLite               |
| `InsertOnDuplicateKey` | `ON DUPLICATE KEY UPDATE` syntax | MySQL, MariaDB                   |
| `InsertReturning`      | `RETURNING` clause in INSERT     | PostgreSQL, SQLite               |
| `UpdateReturning`      | `RETURNING` clause in UPDATE     | PostgreSQL                       |
| `DeleteReturning`      | `RETURNING` clause in DELETE     | PostgreSQL                       |
| `CTE`                  | Common Table Expressions         | PostgreSQL, SQLite, SQL Server   |
| `Window`               | Window functions                 | PostgreSQL, MySQL 8+, SQL Server |

### Direct Dialect Checking

For more complex database-specific logic, check the dialect directly:

```go
import "github.com/uptrace/bun/dialect"

func optimizeQuery(db *bun.DB, query *bun.SelectQuery) *bun.SelectQuery {
    switch db.Dialect().Name() {
    case dialect.PG:
        // PostgreSQL: Use advanced indexing hints
        return query.QueryHint("/*+ IndexScan(table_name idx_name) */")

    case dialect.MySQL:
        // MySQL: Use query hints
        return query.QueryHint("USE INDEX (idx_name)")

    case dialect.SQLite:
        // SQLite: Simpler approach
        return query

    case dialect.MSSQL:
        // SQL Server: Use query plans
        return query.QueryHint("OPTION (RECOMPILE)")

    default:
        return query
    }
}
```

## Connection Pool Configuration

Proper connection pool configuration is crucial for production applications:

```go
func configureDB(db *bun.DB) {
    sqldb := db.DB

    // Connection pool settings
    sqldb.SetMaxOpenConns(25)                 // Maximum open connections
    sqldb.SetMaxIdleConns(25)                 // Maximum idle connections
    sqldb.SetConnMaxLifetime(5 * time.Minute) // Connection lifetime
    sqldb.SetConnMaxIdleTime(5 * time.Minute) // Idle connection timeout
}
```

### Database-Specific Recommendations

| Database   | Max Open | Max Idle | Lifetime     | Notes                       |
| ---------- | -------- | -------- | ------------ | --------------------------- |
| PostgreSQL | 25-100   | 25       | 5-15 min     | Handle connection limits    |
| MySQL      | 25-100   | 10-25    | 5-15 min     | Watch `max_connections`     |
| SQL Server | 25-50    | 10-25    | 5-10 min     | Consider connection pooling |
| SQLite     | 1        | 1        | 0 (no limit) | Single writer limitation    |
| Oracle     | 10-50    | 10-25    | 5-15 min     | License considerations      |

## Troubleshooting

### Common Issues and Solutions

**"driver: bad connection" errors:**

```go
// Add connection validation
sqldb.SetConnMaxLifetime(5 * time.Minute)

// Test connection
if err := sqldb.Ping(); err != nil {
    log.Fatal("Database connection failed:", err)
}
```

**SQLite "database is locked" errors:**

```go
// Enable WAL mode for better concurrency
dsn := "file:myapp.db?cache=shared&_journal_mode=WAL&_busy_timeout=5000"
```

**MySQL charset/encoding issues:**

```go
// Always specify UTF-8 encoding
dsn := "user:pass@tcp(host:port)/db?charset=utf8mb4&parseTime=true"
```

**SQL Server connection timeout:**

```go
// Increase connection timeout
dsn := "sqlserver://user:pass@host:port?database=db&connection+timeout=60"
```

## Testing with Multiple Databases

Use build tags and interfaces to test against multiple databases:

```go
// +build integration

func TestUserOperations(t *testing.T) {
    databases := []struct {
        name string
        db   *bun.DB
    }{
        {"postgres", setupPostgreSQL(t)},
        {"mysql", setupMySQL(t)},
        {"sqlite", setupSQLite(t)},
    }

    for _, tc := range databases {
        t.Run(tc.name, func(t *testing.T) {
            testUserCRUD(t, tc.db)
        })
    }
}
```

## Migration Considerations

When switching between databases, consider:

1. **Data Type Mapping** - Different databases have different type systems
2. **SQL Syntax** - Each database has unique SQL extensions
3. **Performance Characteristics** - Query optimization varies by database
4. **Feature Availability** - Not all databases support the same features

## Frequently Asked Questions

**Q: Can I use multiple databases in the same application?**
A: Yes! Create separate `*bun.DB` instances for each database:

```go
pgDB := bun.NewDB(pgSQLDB, pgdialect.New())
mysqlDB := bun.NewDB(mySQLDB, mysqldialect.New())
```

**Q: How do I handle database-specific SQL functions?**
A: Use the dialect checking or wrap functions in helper methods:

```go
func currentTimestamp(db *bun.DB) string {
    switch db.Dialect().Name() {
    case dialect.PG:
        return "NOW()"
    case dialect.MySQL:
        return "NOW()"
    case dialect.MSSQL:
        return "GETDATE()"
    case dialect.SQLite:
        return "datetime('now')"
    default:
        return "CURRENT_TIMESTAMP"
    }
}
```

**Q: Which database should I choose for my project?**

- **PostgreSQL**: Complex applications, JSON data, full-text search
- **MySQL**: Web applications, high read loads, replication needs
- **SQLite**: Development, testing, embedded applications, small projects
- **SQL Server**: Enterprise Windows environments, existing MS infrastructure
- **Oracle**: Large enterprise systems, complex business logic

## Additional Resources

### Performance and Monitoring

- [OpenTelemetry PostgreSQL Guide](https://uptrace.dev/guides/opentelemetry-postgresql)
- [OpenTelemetry MySQL Guide](https://uptrace.dev/guides/opentelemetry-mysql)
- [Database Performance Monitoring](performance-monitoring.md)
