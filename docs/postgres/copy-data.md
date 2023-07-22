# Copy data between tables and files

PostgreSQL allows to efficiently copy data between tables and files using [COPY TO](#copy-to) and [COPY FROM](#copy-from) commands.

## COPY TO

To copy data from a table to an `io.Writer`:

```go
import "github.com/uptrace/bun/driver/pgdriver"

conn, err := db.Conn(ctx)
if err != nil {
	panic(err)
}
defer conn.Close()

var buf bytes.Buffer

res, err := pgdriver.CopyTo(ctx, conn, &buf, "COPY table_name TO STDOUT")
if err != nil {
	panic(err)
}

fmt.Println(buf.String())
```

## COPY FROM

To copy data from an `io.Reader` to a table:

```go
import "github.com/uptrace/bun/driver/pgdriver"

conn, err := db.Conn(ctx)
if err != nil {
	panic(err)
}
defer conn.Close()

file, err := os.Open("data.csv")
if err != nil {
	panic(err)
}

res, err := pgdriver.CopyFrom(ctx, conn, file, "COPY table_name FROM STDIN")
if err != nil {
	panic(err)
}
```
