# Fixtures

You can use fixtures to provide initial data for testing and development purposes. You write
fixtures in YAML format and load them on demand from tests or migrations.

## Creating fixtures

A fixture is a plain YAML file with the only exception being that you can use
[text/template](https://golang.org/pkg/text/template/) expressions to generate values. Here is how a
fixture for a User model might look like:

```yaml
- model: User
  rows:
      name: John Smith
      email: john@smith.com
      created_at: '{{ now }}'
    - name: Jonh Doe
      email: john@doe.com
      created_at: '{{ now }}'
```

A single fixture can contain data for multiple models. You can also use the `_id` field to name rows
and reference them from other models using text/template syntax:

```yaml
- model: User
  rows:
    - _id: smith
      name: John Smith
      email: john@smith.com
      created_at: '{{ now }}'
    - _id: doe
      name: Jonh Doe
      email: john@doe.com
      created_at: '{{ now }}'

- model: Org
  rows:
    - name: "{{ $.User.smith.Name }}'s Org"
      owner_id: '{{ $.User.smith.ID }}'
    - name: "{{ $.User.doe.Name }}'s Org"
      owner_id: '{{ $.User.doe.ID }}'
```

## Loading fixtures

Assuming the fixture is stored in `testdata/fixture.yaml`, you can load it with the following code:

```go
// Let the db know about the models.
db.RegisterModel((*User)(nil), (*Org)(nil))

fixture := dbfixture.New(db)
err := fixture.Load(ctx, os.DirFS("testdata"), "fixture.yaml")
```

By using `fixture.WithRecreateTables()` option, you can make bun drop existing tables and replace
them with new ones. Or you can use `fixture.WithTruncateTables()` option to truncate tables.

```go
fixture := dbfixture.New(db, dbfixture.WithRecreateTables())
fixture := dbfixture.New(db, dbfixture.WithTruncateTables())
```

You can also register and use in fixtures custom template functions:

```go
funcMap := template.FuncMap{
	"now": func() string {
		return time.Now().Format(time.RFC3339Nano)
	},
}

fixture := dbfixture.New(db, dbfixture.WithTemplateFuncs(funcMap))
```

## Retrieving fixture data

Later you can retrieve the loaded models using `Row` and `MustRow` methods:

```go
fmt.Println("Smith", fixture.MustRow("User.smith").(*User))
```

You can also retrieve the rows without the `_id` field by their primary key:

```go
fmt.Println("Org with id=1", fixture.MustRow("Org.pk1").(*Org))
```

## Source code

You can find the source code for the example above on
[GitHub](https://github.com/uptrace/bun/tree/master/example/fixture).
