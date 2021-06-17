---
title: Zero-downtime migrations
---

# Zero-downtime PostgreSQL migrations

Follow these simple rules to avoid common pitfalls and apply changes to your database without
_unplanned_ downtime.

## Avoid long-running transactions

Running a migration in a transaction means that changes made within a transaction are not visible
until the end of a transaction. That is exactly what we need when we apply a migration, but in
practise it does not work well.

Using a transaction causes PostgreSQL to maintain two versions of a database for the duration of a
transaction. One version with your changes and one without. PostgreSQL
[transactions](https://www.postgresql.org/docs/13/tutorial-transactions.html) are well-suited for
such task but they have their limits too.

PostgreSQL also has to hold all the locks ackquired during a migration. For example, updating a row
locks the row so your changes are not overwritten by another transaction. PostgreSQL releases the
lock only in the end of a transaction. And if a concurrent transaction actually changes the same row
migrations fails.

Using transactions only works well if your migration is small and fast (less than 5-10 seconds).
Even for a medium database, using long transactions either makes a migration slower (in some cases
10x slower) or causes a migration to fail.

## Split long-running queries into smaller batches

PostgreSQL runs every query in a transaction. So not using `BEGIN` and `COMMIT` does not imply that
you are not using transactions. Meaning that you need to split long running queries into smaller
ones and avoid large transactions for the reasons we discussed above.

For example, you need to update 1 million rows. Don't do it with a single `UPDATE` query. Instead
split the job into 10 batches each containing 100k rows. And execute the same `UPDATE` query
separately on each batch. Now you have 10 queries instead of 1, but you can be sure that migration
will succeed.

## Update rows in a consistent order

When possible, update rows in a consistent order. This helps avoiding deadlocks when 2 conurrent
transactions try to update the same rows but in a different order.

For example, deadlock happens when transaction 1 locks row #1 and transaction 2 locks row #2. Now
transaction 1 waits for a lock on row #2 and transaction 2 waits for a lock on row #1. They lock
each other and PostgreSQL has to kill one of them.

Bad:

```sql
-- transaction 1
UPDATE test WHERE id IN (1, 2)

-- transaction 2
UPDATE test WHERE id IN (2, 1)
```

Good:

```sql
-- transaction 1
UPDATE test WHERE id IN (1, 2)

-- transaction 2
UPDATE test WHERE id IN (1, 2)
```

The same rule applies when you are using `INSERT ON CONFLICT DO UPDATE`. In this case you may need
to sort rows before inserting them.

## Don't add column with NOT NULL

Queries like `ADD column NOT NULL` fail on tables that already have some rows. Because existing rows
do not have values for the newly added column, PostgreSQL refuses to add the column.

```sql
> ALTER TABLE test ADD COLUMN foo text NOT NULL;

ERROR:  column "foo" of relation "test" contains null values
```

Your alternatives are:

1. Add a default value, for example, `foo text NOT NULL DEFAULT ''`.
2. Drop `NOT NULL` althogether and add some validation against `NULL` elsewhere.
3. Split the query into multiple migrations:

```sql
-- migration 1
ALTER TABLE test ADD COLUMN foo text;

-- migration 2
UPDATE test SET foo = '';

-- migration 3
ALTER TABLE test ALTER COLUMN foo SET NOT NULL;
```
