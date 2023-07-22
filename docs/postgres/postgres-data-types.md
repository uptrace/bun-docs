# PostgreSQL data types

[[toc]]

## timestamptz vs timestamp

**TLDR** You should prefer using `timestamptz` over `timestamp`. None of the types store the provided timezone, but `timestamptz` at least properly parses the time with a timezone. To save user timezone, create a separate column for it.

---

Let's use the following table as an example:

```sql
CREATE TABLE test (
  t1 timestamptz,
  t2 timestamp
);
```

The first difference between `timestamptz` and `timestamp` is that `timestamp` discards/ignores the provided timezone:

```sql
INSERT INTO test VALUES ('2021-01-01 02:00:00+02', '2021-01-01 02:00:00+02') RETURNING *;

           t1           |         t2
------------------------+---------------------
 2021-01-01 00:00:00+00 | 2021-01-01 02:00:00
```

`timestamp` also ignores the server/session timezone:

```sql
SET timezone = 'America/Los_Angeles';
```

The result:

```sql
SELECT * FROM test;

           t1           |         t2
------------------------+---------------------
 2020-12-31 16:00:00-08 | 2021-01-01 02:00:00
```

## JSONB

Bun uses `JSONB` data type to store maps and slices. To change the default type, use `type` struct tag option:

```go
type Model struct {
	Data map[string]interface{} `bun:"type:jsonb"`
}
```

To enable `json.Decoder.UseNumber` option:

```go
type Model struct {
	Data map[string]interface{} `bun:",json_use_number"`
}
```

You can also use `json.RawMessage` to work with raw bytes:

```go
type Model struct {
	Data json.RawMessage `bun:"type:jsonb"`
}
```

## Arrays

See [Working with PostgreSQL arrays](postgres-arrays.md).

## UUID

See [Generating UUIDs in PostgreSQL](postgres-uuid-generate.md).

## See also

See [Don't do this](https://wiki.postgresql.org/wiki/Don%27t_Do_This) for more tips.
