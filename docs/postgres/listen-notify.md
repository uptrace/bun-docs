---
title: Listen and notify
---

# PostgreSQL listen and notify

## Listen/notify

PostgreSQL supports publish/subscribe messaging pattern using [NOTIFY](https://www.postgresql.org/docs/current/sql-notify.html) and [LISTEN](https://www.postgresql.org/docs/current/sql-listen.html) commands, for example, you can subscribe for notifications using `LISTEN` command:

```sql
LISTEN channel_name;
```

And then send notifications with optional textual payload:

```sql
NOTIFY channel_name, 'optional payload';
```

Together with table triggers, you can send notifications whenever rows are updated/deleted to invalidate a cache or reindex the table:

```sql
CREATE FUNCTION users_after_update_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('users:updated', NEW.id::text);
  RETURN NULL;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER users_after_update_trigger
AFTER UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE users_after_update_trigger();
```

## pgdriver.Listener

[pgdriver](/postgres/) provides [Listener](https://pkg.go.dev/github.com/uptrace/bun/driver/pgdriver#Listener) which allows to listen for notifications and automatically re-subscribes to channels when the database connection is lost:

```go
ln := pgdriver.NewListener(db)
if err := ln.Listen(ctx, "users:updated"); err != nil {
	panic(err)
}

for notif := range ln.Channel() {
	fmt.Println(notif.Channel, notif.Payload)
}
```

You can send notifications using [Notify](https://pkg.go.dev/github.com/uptrace/bun/driver/pgdriver#Notify) method:

```go
if err := pgdriver.Notify(ctx, db, "channel_name", "optional payload"); err != nil {
	panic(err)
}
```

See [example](https://github.com/uptrace/bun/tree/master/example/pg-listen) for details.
