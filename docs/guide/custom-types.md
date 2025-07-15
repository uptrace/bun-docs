# Extending Bun with custom types

Bun uses database/sql to work with different DBMS and so you can extend it with custom types using [sql.Scanner](#sql-scanner) and [driver.Valuer](#driver-valuer) interfaces.

In this tutorial we will write a simple type to work with time that does not have a date:

```go
const timeFormat = "15:04:05.999999999"

type Time struct {
	time.Time
}
```

## sql.Scanner

[sql.Scanner](https://pkg.go.dev/database/sql#Scanner) assigns a value from a database driver. The value can be one of the following types:

- `int64`
- `float64`
- `bool`
- `[]byte`
- `string`
- `time.Time`
- `nil` - for NULL values

```go
var _ sql.Scanner = (*Time)(nil)

// Scan scans the time parsing it if necessary using timeFormat.
func (tm *Time) Scan(src interface{}) (err error) {
	switch src := src.(type) {
	case time.Time:
		*tm = NewTime(src)
		return nil
	case string:
		tm.Time, err = time.ParseInLocation(timeFormat, src, time.UTC)
		return err
	case []byte:
		tm.Time, err = time.ParseInLocation(timeFormat, string(src), time.UTC)
		return err
	case nil:
		tm.Time = time.Time{}
		return nil
	default:
		return fmt.Errorf("unsupported data type: %T", src)
	}
}
```

You can find the full example at [GitHub](https://github.com/uptrace/bun/tree/master/example/custom-type).

## driver.Valuer

[driver.Valuer](https://pkg.go.dev/database/sql/driver#Valuer) returns a value for a database driver. The value must be one of the following types:

- `int64`
- `float64`
- `bool`
- `[]byte`
- `string`
- `time.Time`
- `nil` - for NULL values

```go
var _ driver.Valuer = (*Time)(nil)

// Value formats the value using timeFormat.
func (tm Time) Value() (driver.Value, error) {
	return tm.UTC().Format(timeFormat), nil
}
```

You can find the full example at [GitHub](https://github.com/uptrace/bun/tree/master/example/custom-type).

## Conclusion

You can easily extend Bun with custom types to fully utilize your DBMS capabilities, for example, [bunbig](https://github.com/uptrace/bun/tree/master/extra/bunbig) adds support for `big.Int` to Bun.

See also:

- [Model and query hooks](/guide/hooks.html)
- [PostgreSQL data types](/postgres/postgres-data-types.md)
