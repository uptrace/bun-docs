# Tips on writing JSON REST API

## Use anonymous types to parse JSON

Instead of declaring global types:

```go
type ArticleRequest struct {
    Name string
}

func handler(w http.ResponseWriter, req *http.Request) {
    article := new(ArticleRequest)
    if err := json.NewDecoder(req.Body).Decode(article); err != nil {
        panic(err)
    }
}
```

You can declare an anonymous inline type instead:

```go
func handler(w http.ResponseWriter, req *http.Request) {
    var in struct {
        Name string
    }
    if err := json.NewDecoder(req.Body).Decode(&in); err != nil {
        panic(err)
    }
}
```

## Use http.MaxBytesReader to limit requests length

By default, Go does not impose any limits on the length of incoming requests. You should take care
of that yourself using [MaxBytesReader](https://pkg.go.dev/net/http#MaxBytesReader).

```go
func handler(w http.ResponseWriter, req *http.Request) {
    req.Body = http.MaxBytesReader(w, req.Body, 1<<20) // 1MB
}
```

To quickly and correctly calculate number of bytes, use this trick:

- `3 << 10` - 3 kilobytes.
- `3 << 20` - 3 megabytes.
- `3 << 30` - 3 gigabytes.

## Use map[string]interface{} to generate JSON

It is usually not worth it to declare a struct to generate a JSON response. It is easier to use a
map and it is only a tiny bit slower. Some frameworks even a provide a short type alias for
`map[string]interface{}`, for example, [gin.H](https://pkg.go.dev/github.com/gin-gonic/gin#H) or
[treemux.H](https://pkg.go.dev/github.com/vmihailenco/treemux#H).

```go
type H map[string]interface{}

func handler(w http.ResponseWriter, req *http.Request) {
    if err := json.NewEncoder(w).Encode(H{"foo": "bar"}); err != nil {
        panic(err)
    }
}
```

## Use MarshalJSON to customize JSON output

You could write the following code to customize JSON output, but it fails with
`fatal error: stack overflow` error.

```go
type User struct{
    Name string
}

func (u *User) MarshalMsgpack() ([]byte, error) {
    if u.Name == "" {
        u.Name = "anonymous"
    }
    // This call causes infinite recursion.
    return json.Marshal(u)
}
```

You can fix it by declaring a new type using the original type as a base:

```go
type jsonUser User

func (u *User) MarshalMsgpack() ([]byte, error) {
    if u.Name == "" {
        u.Name = "anonymous"
    }
    return json.Marshal((*jsonUser)(u))
}
```

## Use middlewares to handle errors

Instead of writing code like this:

```go
func handler(w http.ResponseWriter, req *http.Request) {
    if processRequest(req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    if err := json.NewEncoder(w).Encode(H{}); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}
```

You could create a middleware that handles errors for you:

```go
func handler(w http.ResponseWriter, req *http.Request) error {
    if processRequest(req); err != nil {
        return err
    }
    if err := json.NewEncoder(w).Encode(H{}); err != nil {
        return err
    }
    return nil
}

func errorHandler(next func(w http.ResponseWriter, req *http.Request) error) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
        if err := next(w, req); err != nil {
            // You should change status code depending on the error.
            http.Error(w, err.Error(), http.StatusBadRequest)
        }
    })
}
```

Or you could use [echo](https://echo.labstack.com/) or
[treemux](https://github.com/vmihailenco/treemux) which provide such functionality out-of-the-box.

## Use structs to group handlers

Instead of using plain functions:

```go
const rowLimit = 100
const rateLimit = 10

func showUser(w http.ResponseWriter, req *http.Request) {}
func listUsers(w http.ResponseWriter, req *http.Request) {}
func delUser(w http.ResponseWriter, req *http.Request) {}
```

It is better to define a struct and store all related state there:

```go
type UserHandler struct{
    rowLimit  int
    rateLimit int
}

func (h *UserHandler) Show(w http.ResponseWriter, req *http.Request) {}
func (h *UserHandler) List(w http.ResponseWriter, req *http.Request) {}
func (h *UserHandler) Del(w http.ResponseWriter, req *http.Request) {}
```

## Use segmentio/encoding

[segmentio/encoding](https://github.com/segmentio/encoding) is a drop-in replacement for
`encoding/json` which is 2-3x faster than the original package. All you need to do to start using it
is to update import path:

```diff
-import "encoding/json"
+import "github.com/segmentio/encoding/json"
```

It also provides lower-level API that works directly with `[]byte` and is even more effecient:

```go
func Append(b []byte, x interface{}, flags AppendFlags) ([]byte, error)
func Parse(b []byte, x interface{}, flags ParseFlags) ([]byte, error)
```
