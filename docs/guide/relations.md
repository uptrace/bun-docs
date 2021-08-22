# Table relationships

## Introduction

Bun can help you join and select other tables if you are using one of 4 supported table relations:

- [has-one](#has-one-relation)
- [belongs-to](#belongs-to-relation)
- [has-many](#has-many-relation)
- [many-to-many](#many-to-many-relation)

For example, if you define `User` has-one `Profile` relation:

```go
err := db.NewSelect().
	Model(user).
	Relation("Profile").
	Where("user.id = 1").
	Scan(ctx)
```

```sql
SELECT * FROM users AS user
LEFT JOIN profiles AS profile ON profile.user_id = user.id
WHERE user.id = 1
```

## Has one relation

To define a has-one relationship, add `bun:"rel:has-one"` tag to the field. In the following
[example](https://github.com/uptrace/bun/tree/master/example/has-one) we have `User` model that has
one `Profile` model.

```go
type Profile struct {
	ID	   int64
	Lang   string
	UserID int64
}

type User struct {
	ID		int64
	Name	string
	Profile *Profile `bun:"rel:has-one"`
}
```

To override join columns, use `join:base_column=join_column` field tag, for example,
`bun:"rel:has-one,join:id=user_id"`.

## Belongs to relation

To define a belongs-to relationship, you need to add `bun:"rel:belongs-to"` tag to the field. In the
the following [example](https://github.com/uptrace/bun/tree/master/example/belongs-to) we define
`Profile` model that belongs to `User` model.

```go
type Profile struct {
	ID	 int64
	Lang string
}

type User struct {
	ID		  int64
	Name	  string
	ProfileID int64
	Profile	  *Profile `bun:"rel:belongs-to"`
}
```

To override join columns, use `join:base_column=join_column` field tag, for example,
`bun:"rel:belongs-to,join:profile_id=id"`.

## Has many relation

To define a has-many relationship, add `bun:"rel:has-many"` to the field. In the following
[example](https://github.com/uptrace/bun/tree/master/example/has-many) we have `User` model that has
many `Profile` models.

```go
type Profile struct {
    ID     int64
    Lang   string
    Active bool
    UserID int64
}

// User has many profiles.
type User struct {
    ID       int64
    Name     string
    Profiles []*Profile `bun:"rel:has-many"`
}
```

To override join columns, use `join:base_column=join_column` field tag, for example,
`bun:"rel:has-many,join:id=user_id"`.

## Many to many relation

To define a many-to-many relationship, add `bun:"m2m:order_to_items"` to the field. You also need to
define two has-one relationships on the intermediary model and manually register the model
(`db.RegisterModel`).

In the following [example](https://github.com/uptrace/bun/tree/master/example/many-to-many) we have
`Order` model that has many `Item` models. Because the same item can be added to multiple orders, we
need the intermediary `OrderToItem` model.

```go
func init() {
    // Register many to many model so bun can better recognize m2m relation.
    // This should be done before you use the model for the first time.
    db.RegisterModel((*OrderToItem)(nil))
}

type Order struct {
    ID    int64
    Items []Item `bun:"m2m:order_to_items"`
}

type Item struct {
    ID int64
}

type OrderToItem struct {
    OrderID int64
	Order   *Order `bun:"rel:has-one"`
    ItemID  int64
	Item    *Item `bun:"rel:has-one"`
}
```
