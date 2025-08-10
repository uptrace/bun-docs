---
title: "Cursor Pagination for PostgreSQL & MySQL: Complete Developer Guide 2025"
description: Learn cursor pagination for PostgreSQL & MySQL. Improve database performance by 10x vs OFFSET. Complete guide with Go examples, best practices & code.
keywords:
  - cursor pagination
  - PostgreSQL pagination
  - MySQL pagination
  - database pagination performance
  - OFFSET vs cursor pagination
---

<UptraceCta />

# Cursor Pagination for PostgreSQL/MySQL

![Cursor pagination](/cursor-pagination/cover.png)

Learn how to implement high-performance cursor pagination for PostgreSQL and MySQL databases. This guide covers everything from basic concepts to production-ready Go implementations, helping you build scalable applications that handle millions of records efficiently.

**What you'll learn:**

- Why cursor pagination outperforms OFFSET-based pagination
- Step-by-step implementation in Go with PostgreSQL/MySQL
- Advanced patterns for complex sorting and filtering
- Performance optimization and monitoring techniques
- Common mistakes and how to avoid them

**Perfect for:** Backend developers, database architects, and teams building data-intensive applications with large datasets.

## Introduction

When building applications that display large datasets—such as social media feeds, search results, or transaction logs—pagination becomes crucial for both performance and user experience. Traditional pagination approaches can become problematic at scale, leading to slow queries and inconsistent results.

Cursor pagination solves these issues by using a pointer (cursor) to track position within the dataset, rather than calculating offsets. This approach is used by major platforms like GitHub, Twitter, and Facebook for their APIs.

## Understanding the Problem with Offset Pagination

Traditional pagination uses `LIMIT` and `OFFSET` clauses:

```sql
-- Page 1: First 10 entries
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 0;

-- Page 100: Entries 991-1000
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 990;

-- Page 10,000: Entries 99,991-100,000
SELECT * FROM entries ORDER BY id ASC LIMIT 10 OFFSET 99990;
```

### Performance Degradation

As the offset grows, performance degrades significantly:

| Page   | Offset | Rows Scanned & Discarded | Typical Response Time |
| ------ | ------ | ------------------------ | --------------------- |
| 1      | 0      | 0                        | 1ms                   |
| 100    | 990    | 990                      | 15ms                  |
| 1,000  | 9,990  | 9,990                    | 150ms                 |
| 10,000 | 99,990 | 99,990                   | 1,500ms+              |

The database must read and discard all rows before the offset, making deep pagination extremely expensive.

### Consistency Issues

Consider this scenario:

1. User views page 5 of search results
2. New entries are added to the beginning of the dataset
3. User clicks "next page" → sees duplicate results from page 5

Offset pagination cannot handle data mutations gracefully.

## How Cursor Pagination Works

Cursor pagination uses a unique identifier (cursor) to mark the position in the dataset:

```sql
-- First page: Start from the beginning
SELECT * FROM entries ORDER BY id ASC LIMIT 10;

-- Next page: Continue after the last ID from the previous page
SELECT * FROM entries WHERE id > 10 ORDER BY id ASC LIMIT 10;

-- Another page: Continue after ID 20
SELECT * FROM entries WHERE id > 20 ORDER BY id ASC LIMIT 10;
```

### Visual Representation

```
Dataset: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, ...]

Page 1: [1, 2, 3, 4, 5] → cursor_end = 5
Page 2: [6, 7, 8, 9, 10] → cursor_end = 10 (WHERE id > 5)
Page 3: [11, 12, 13, 14, 15] → cursor_end = 15 (WHERE id > 10)
```

## Cursor vs Offset Pagination

| Feature            | Offset Pagination            | Cursor Pagination               |
| ------------------ | ---------------------------- | ------------------------------- |
| **Performance**    | Degrades with depth          | Consistent O(log n)             |
| **Consistency**    | Affected by data changes     | Stable during mutations         |
| **Random access**  | ✅ Jump to any page          | ❌ Sequential only              |
| **Total count**    | ✅ Easy to calculate         | ❌ Requires separate query      |
| **Implementation** | Simple                       | Moderate complexity             |
| **Use cases**      | Small datasets, admin panels | Large datasets, real-time feeds |

### When to Use Each Approach

**Use Offset Pagination when:**

- Dataset is small (< 10,000 records)
- Users need to jump to specific pages
- Total page count is required
- Building admin interfaces or reports

**Use Cursor Pagination when:**

- Dataset is large (> 10,000 records)
- Performance is critical
- Data changes frequently
- Building feeds, APIs, or real-time applications

## Implementation Guide

### Basic Setup

First, define your data model:

```go
type Entry struct {
    ID        int64     `json:"id" bun:",pk"`
    Title     string    `json:"title"`
    Content   string    `json:"content"`
    CreatedAt time.Time `json:"created_at"`
}
```

### Cursor Structure

```go
type Cursor struct {
    Start *int64 `json:"start,omitempty"` // First item ID for previous page
    End   *int64 `json:"end,omitempty"`   // Last item ID for next page
}

func NewCursor(entries []Entry) Cursor {
    cursor := Cursor{}
    if len(entries) > 0 {
        cursor.Start = &entries[0].ID
        cursor.End = &entries[len(entries)-1].ID
    }
    return cursor
}
```

### Forward Pagination

```go
func selectNextPage(ctx context.Context, db *bun.DB, cursor *int64, limit int) ([]Entry, Cursor, error) {
    var entries []Entry
    query := db.NewSelect().
        Model(&entries).
        OrderExpr("id ASC").
        Limit(limit)

    // Add cursor condition if provided
    if cursor != nil {
        query = query.Where("id > ?", *cursor)
    }

    if err := query.Scan(ctx); err != nil {
        return nil, Cursor{}, err
    }

    return entries, NewCursor(entries), nil
}
```

### Backward Pagination

```go
func selectPrevPage(ctx context.Context, db *bun.DB, cursor *int64, limit int) ([]Entry, Cursor, error) {
    var entries []Entry
    query := db.NewSelect().
        Model(&entries).
        OrderExpr("id DESC"). // Reverse order
        Limit(limit)

    if cursor != nil {
        query = query.Where("id < ?", *cursor)
    }

    if err := query.Scan(ctx); err != nil {
        return nil, Cursor{}, err
    }

    // Reverse the results to maintain ascending order
    for i := len(entries)/2 - 1; i >= 0; i-- {
        opp := len(entries) - 1 - i
        entries[i], entries[opp] = entries[opp], entries[i]
    }

    return entries, NewCursor(entries), nil
}
```

### Complete Usage Example

```go
func main() {
    // First page
    page1, cursor, err := selectNextPage(ctx, db, nil, 10)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Page 1: %d entries\n", len(page1))

    // Second page
    page2, cursor, err := selectNextPage(ctx, db, cursor.End, 10)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Page 2: %d entries\n", len(page2))

    // Go back to first page
    page1Again, _, err := selectPrevPage(ctx, db, cursor.Start, 10)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Back to page 1: %d entries\n", len(page1Again))
}
```

## Advanced Patterns

### Multi-Column Cursors

For complex sorting, you may need composite cursors:

```go
type TimestampCursor struct {
    CreatedAt time.Time `json:"created_at"`
    ID        int64     `json:"id"` // Tie-breaker for uniqueness
}

func selectByTimestamp(ctx context.Context, db *bun.DB, cursor *TimestampCursor, limit int) ([]Entry, error) {
    query := db.NewSelect().
        Model(&entries).
        Order("created_at DESC", "id DESC").
        Limit(limit)

    if cursor != nil {
        query = query.Where("(created_at, id) < (?, ?)", cursor.CreatedAt, cursor.ID)
    }

    return query.Scan(ctx)
}
```

### Encoding Cursors

For API responses, encode cursors to prevent tampering:

```go
import (
    "encoding/base64"
    "encoding/json"
)

func (c Cursor) Encode() (string, error) {
    data, err := json.Marshal(c)
    if err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(data), nil
}

func DecodeCursor(encoded string) (Cursor, error) {
    var cursor Cursor
    data, err := base64.URLEncoding.DecodeString(encoded)
    if err != nil {
        return cursor, err
    }
    err = json.Unmarshal(data, &cursor)
    return cursor, err
}
```

### Filtering with Cursors

Combine cursors with filters:

```go
func selectFilteredPage(ctx context.Context, db *bun.DB, status string, cursor *int64, limit int) ([]Entry, Cursor, error) {
    var entries []Entry
    query := db.NewSelect().
        Model(&entries).
        Where("status = ?", status). // Filter condition
        OrderExpr("id ASC").
        Limit(limit)

    if cursor != nil {
        query = query.Where("id > ?", *cursor)
    }

    if err := query.Scan(ctx); err != nil {
        return nil, Cursor{}, err
    }

    return entries, NewCursor(entries), nil
}
```

## Common Pitfalls

### 1. Non-Unique Sort Keys

**Problem:** Using non-unique columns as cursors can cause inconsistent results.

```sql
-- BAD: created_at might not be unique
SELECT * FROM entries WHERE created_at > '2023-01-01' ORDER BY created_at;
```

**Solution:** Always include a unique tie-breaker:

```sql
-- GOOD: Include ID as tie-breaker
SELECT * FROM entries
WHERE (created_at, id) > ('2023-01-01', 12345)
ORDER BY created_at, id;
```

### 2. Missing Indexes

Ensure proper indexes exist for cursor columns:

```sql
-- For single-column cursor
CREATE INDEX idx_entries_id ON entries(id);

-- For multi-column cursor
CREATE INDEX idx_entries_created_id ON entries(created_at, id);
```

### 3. Null Values

Handle null values in cursor columns:

```go
// Place nulls last in ordering
query.OrderExpr("COALESCE(created_at, '1970-01-01') DESC, id DESC")
```

### 4. Cursor Validation

Always validate cursors from clients:

```go
func validateCursor(cursor *int64) error {
    if cursor != nil && *cursor < 0 {
        return errors.New("invalid cursor: must be positive")
    }
    return nil
}
```

## Performance Monitoring

To monitor cursor pagination performance, use OpenTelemetry instrumentation:

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
)

func selectNextPageWithTracing(ctx context.Context, db *bun.DB, cursor *int64, limit int) ([]Entry, Cursor, error) {
    tracer := otel.Tracer("pagination")
    ctx, span := tracer.Start(ctx, "select_next_page")
    defer span.End()

    span.SetAttributes(
        attribute.Bool("has_cursor", cursor != nil),
        attribute.Int("limit", limit),
    )

    if cursor != nil {
        span.SetAttributes(attribute.Int64("cursor", *cursor))
    }

    entries, newCursor, err := selectNextPage(ctx, db, cursor, limit)

    span.SetAttributes(
        attribute.Int("results_count", len(entries)),
        attribute.Bool("has_more", newCursor.End != nil),
    )

    if err != nil {
        span.RecordError(err)
    }

    return entries, newCursor, err
}
```

### Key Metrics to Monitor

- Query execution time
- Number of results per page
- Cursor depth (how far users paginate)
- Error rates for invalid cursors

For comprehensive monitoring, consider using [Uptrace](https://uptrace.dev), an [OpenTelemetry APM](https://uptrace.dev/opentelemetry/apm) that supports distributed tracing, metrics, and logs.

![Uptrace Overview](/uptrace/home.png)

## FAQ

### Q: Can I implement cursor pagination with non-integer IDs?

**A:** Yes! You can use any unique, sortable value:

```go
// Using UUIDs (requires special handling for ordering)
SELECT * FROM entries WHERE id > 'uuid-value' ORDER BY id;

// Using timestamps
SELECT * FROM entries WHERE created_at > '2023-01-01T10:30:00Z' ORDER BY created_at, id;
```

### Q: How do I get the total count with cursor pagination?

**A:** You need a separate query:

```sql
SELECT COUNT(*) FROM entries WHERE status = 'active';
```

Note: This can be expensive for large tables. Consider:

- Caching the count
- Using approximate counts
- Showing "Load More" instead of page numbers

### Q: Can users bookmark or share cursor-based URLs?

**A:** Yes, encode the cursor in the URL:

```
https://api.example.com/entries?cursor=eyJlbmQiOjEyMzQ1fQ%3D%3D&limit=20
```

### Q: What happens if the cursor points to a deleted record?

**A:** The pagination continues normally. The query `WHERE id > deleted_id` will start from the next available record. This is one of cursor pagination's advantages—it handles data mutations gracefully.

### Q: How do I implement "Load More" functionality?

**A:** Store the current cursor on the client side:

```javascript
let currentCursor = null;
let allEntries = [];

async function loadMore() {
    const response = await fetch(`/api/entries?cursor=${currentCursor || ''}&limit=20`);
    const data = await response.json();

    allEntries.push(...data.entries);
    currentCursor = data.cursor.end;

    // Hide "Load More" if no more data
    if (!data.cursor.end) {
        document.getElementById('load-more').style.display = 'none';
    }
}
```

### Q: Can I use cursor pagination with joins?

**A:** Yes, but ensure the cursor column comes from the main table:

```sql
SELECT e.*, u.username
FROM entries e
JOIN users u ON e.user_id = u.id
WHERE e.id > ?
ORDER BY e.id ASC
LIMIT 10;
```

---

For a complete working example, see the [Bun cursor pagination example](https://github.com/uptrace/bun/tree/master/example/cursor-pagination) on GitHub.
