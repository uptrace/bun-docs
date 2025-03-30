# ORM: Table relationships

## Introduction

Bun can help you join and query other tables if you are using one of the 4 supported table relations:

- [has-one](#has-one-relation)
- [belongs-to](#belongs-to-relation)
- [has-many](#has-many-relation)
- [polymorphic-has-many](#polymorphic-has-many-relation)
- [many-to-many](#many-to-many-relation)

For example, you can define `Author` belongs to `Book` relation:

```go
type Book struct {
	ID		 int64
	AuthorID int64
	Author	 Author `bun:"rel:belongs-to,join:author_id=id"`
}

type Author struct {
	ID int64
}
```

And then use `Relation` method to join tables:

```go
err := db.NewSelect().
	Model(book).
	Relation("Author").
	Where("id = 1").
	Scan(ctx)
```

```sql
SELECT
  "book"."id", "book"."title", "book"."text",
  "author"."id" AS "author__id", "author"."name" AS "author__name"
FROM "books"
LEFT JOIN "users" AS "author" ON "author"."id" = "book"."author_id"
WHERE id = 1
```

You can query from parent the child and vice versa in an `has-one`/`belongs-to` relation:

```go
type Profile struct {
	ID     int64 `bun:",pk"`
	Lang   string
	UserID int64
	User *User `bun:"rel:belongs-to"`
}

type User struct {
	ID      int64 `bun:",pk"`
	Name    string
	Profile *Profile `bun:"rel:has-one"`
}

err := db.NewSelect().
	Model(&user).
	Where("id = 1").
	Relation("Profile").
	Scan(ctx)

err := db.NewSelect().
	Model(&profile).
	Where("id = 1").
	Relation("User").
	Scan(ctx)
```

To select only book ID and the associated author id:

```go
err := db.NewSelect().
	Model(book).
	Column("book.id").
	Relation("Author", func (q *bun.SelectQuery) *bun.SelectQuery {
		return q.Column("id")
	}).
    Where("id = 1").
	Scan(ctx)
```

```sql
SELECT "book"."id", "author"."id" AS "author__id"
FROM "books"
LEFT JOIN "users" AS "author" ON "author"."id" = "book"."author_id"
WHERE id = 1
```

To select a book and join the author without selecting it:

```go
err := db.NewSelect().
	Model(book).
	Relation("Author", func (q *bun.SelectQuery) *bun.SelectQuery {
		return q.Exclude("*")
	}).
    Where("id = 1").
	Scan(ctx)
```

```sql
SELECT "book"."id"
FROM "books"
LEFT JOIN "users" AS "author" ON "author"."id" = "book"."author_id"
WHERE id = 1
```

To simulate `INNER JOIN` instead of `LEFT JOIN`:

```go
err := db.NewSelect().
	Model(book).
	Relation("Author").
    Where("id = 1").
    Where("author.id IS NOT NULL").
	Scan(ctx)
```

## Has one relation

To define a has-one relationship, add `bun:"rel:has-one"` tag to the field. In the following [example](https://github.com/uptrace/bun/tree/master/example/rel-has-one), we have `User` model that has one `Profile` model.

```go
// Profile belongs to User.
type Profile struct {
	ID     int64 `bun:",pk"`
	Lang   string
	UserID int64
}

type User struct {
	ID      int64 `bun:",pk"`
	Name    string
	Profile *Profile `bun:"rel:has-one,join:id=user_id"`
}
```

You can specify multiple join columns, for example, `join:id=user_id,join:vendor_id=vendor_id`.

## Belongs to relation

To define a belongs-to relationship, you need to add `bun:"rel:belongs-to"` tag to the field. In the the following [example](https://github.com/uptrace/bun/tree/master/example/rel-belongs-to) we define `Profile` model that belongs to `User` model.

```go
type Profile struct {
	ID   int64 `bun:",pk"`
	Lang string
}

// User has one profile.
type User struct {
	ID        int64 `bun:",pk"`
	Name      string
	ProfileID int64
	Profile   *Profile `bun:"rel:belongs-to,join:profile_id=id"`
}
```

You can specify multiple join columns, for example, `join:profile_id=id,join:vendor_id=vendor_id`.

## Has many relation

To define a has-many relationship, add `bun:"rel:has-many"` to the field. In the following [example](https://github.com/uptrace/bun/tree/master/example/rel-has-many), we have `User` model that has many `Profile` models.

```go
type Profile struct {
	ID     int64 `bun:",pk"`
	Lang   string
	Active bool
	UserID int64
}

// User has many profiles.
type User struct {
	ID       int64 `bun:",pk"`
	Name     string
	Profiles []*Profile `bun:"rel:has-many,join:id=user_id"`
}
```

You can specify multiple join columns, for example, `join:id=user_id,join:vendor_id=vendor_id`.

## Polymorphic has many relation

You can also define a polymorphic has-many relationship by using `type` virtual column and `polymorphic` option.

In the following [example](https://github.com/uptrace/bun/tree/master/example/rel-has-many-polymorphic), we store all comments in a single table but use `trackable_type` column to save the model table to which this comment belongs to.

```go
type Article struct {
	ID   int64
	Name string

	Comments []Comment `bun:"rel:has-many,join:id=trackable_id,join:type=trackable_type,polymorphic"`
}

type Post struct {
	ID   int64
	Name string

	Comments []Comment `bun:"rel:has-many,join:id=trackable_id,join:type=trackable_type,polymorphic"`
}

type Comment struct {
	TrackableID   int64  // Article.ID or Post.ID
	TrackableType string // "article" or "post"
	Text          string
}
```

To override polymorphic model name that Bun stores in the database, you can use `polymorphic:model_name`:

```go
type Article struct {
	ID   int64
	Name string

	Comments []Comment `bun:"rel:has-many,join:id=trackable_id,join:type=trackable_type,polymorphic:mycomment"`
}
```

The Bun will generate the following query:

```sql
SELECT "comment"."trackable_id", "comment"."trackable_type", "comment"."text"
FROM "comments" AS "comment"
WHERE ("comment"."trackable_id" IN (1)) AND ("trackable_type" = 'mycomment')
```

## Many to many relation

To define a many-to-many relationship, add `bun:"m2m:order_to_items"` to the field. You also need to define two has-one relationships on the intermediary model and manually register the model (`db.RegisterModel`).

In the following [example](https://github.com/uptrace/bun/tree/master/example/rel-many-to-many), we have `Order` model that can have many items and each `Item` can be added to multiple orders. We also use `OrderToItem` model as an intermediary table to join orders and items.

```go
func init() {
    // Register many to many model so bun can better recognize m2m relation.
    // This should be done before you use the model for the first time.
    db.RegisterModel((*OrderToItem)(nil))
}

type Order struct {
	ID    int64  `bun:",pk"`
    // Order and Item in join:Order=Item are fields in OrderToItem model
	Items []Item `bun:"m2m:order_to_items,join:Order=Item"`
}

type Item struct {
	ID int64 `bun:",pk"`
}

type OrderToItem struct {
	OrderID int64  `bun:",pk"`
	Order   *Order `bun:"rel:belongs-to,join:order_id=id"`
	ItemID  int64  `bun:",pk"`
	Item    *Item  `bun:"rel:belongs-to,join:item_id=id"`
}
```
