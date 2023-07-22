# Fixtures

You can use fixtures to load initial data into a database for testing or demonstration purposes. You can write fixtures in YAML format and load them on demand from tests or Go-based [migrations](migrations.md).

## Creating fixtures

A fixture is a plain YAML file with the ability to use [text/template](https://golang.org/pkg/text/template/) expressions to generate values. Bun unmarshals YAML data into Go models using [yaml.v3](https://gopkg.in/yaml.v3) and then saves the model in a database.

Here is how a fixture for a User model might look like:

```yaml
- model: User
  rows:
    - name: John Smith
      email: john@smith.com
      created_at: '{{ now }}'
    - name: Jonh Doe
      email: john@doe.com
      created_at: '{{ now }}'
```

A single fixture can contain data for multiple models. You can also use the `_id` field to name rows and reference them from other models using text/template syntax:

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

Assuming the fixture is stored in `testdata/fixture.yml`, you can load it with the following code:

```go
// Let the db know about the models.
db.RegisterModel((*User)(nil), (*Org)(nil))

fixture := dbfixture.New(db)
err := fixture.Load(ctx, os.DirFS("testdata"), "fixture.yml")
```

By using `fixture.WithRecreateTables()` option, you can make bun drop existing tables and replace them with new ones. Or you can use `fixture.WithTruncateTables()` option to truncate tables.

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

You can also retrieve rows without `_id` field by a primary key:

```go
fmt.Println("Org with id=1", fixture.MustRow("Org.pk1").(*Org))
```

## Field names

Bun uses SQL column names to find the matching struct field and then calls [yaml.v3](https://gopkg.in/yaml.v3) to unmarshal the data. So when unmarshaling into a struct field, you may need to use `yaml` tag to override the default YAML field name.

```go{3,7-8}
type User struct {
    ID     int64      `bun:",pk,autoincrement"`
    Params UserParams `bun:"type:jsonb"`
}

type UserParams struct {
    Param1 string `yaml:"param1"`
    Param2 string `yaml:"param2"`
}
```

## Source code

You can find the source code for the example above on [GitHub](https://github.com/uptrace/bun/tree/master/example/fixture).
