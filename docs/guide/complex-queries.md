---
title: Complex parameterized queries
---

# Writing complex parameterized queries

A parameterized query is a query that is built dynamically based on incoming request params. Building complex database queries can be challenging but you can achieve better results by following the recommendations presented in this article.

## Divide and conquer

The first and the main recommendation is to split the whole process into isolated steps:

[[toc]]

## Parsing request params

The first think you need to do is to create a data structure that will hold incoming params, for example:

```go
type ArticleFilter struct {
	CategoryID int64
	Search	   string
	Page	   int
}
```

And a factory method that will parse the params from an `http.Request` or JSON payload:

```go
func articleFilterFromRequest(req *http.Request) (*ArticleFilter, error) {
	query := req.URL.Query()

	f := new(ArticleFilter)
	f.Search = query.Get("search")

	categoryID, err := strconv.ParseInt(query.Get("category_id"), 10, 64)
	if err != nil {
		return nil, err
	}
	f.CategoryID = categoryID

	page, err := strconv.Atoi(query.Get("page"))
	if err != nil {
		return nil, err
	}
	f.Page = page

	return f, nil
}
```

## Params validation

The purpose of this step is to ensure you have enough data to build a query or to set default values:

```go
func (f *ArticleFilter) Validate() error {
	if f.CategoryID == 0 {
		return errors.New("category id is required")
	}
	if f.Page == 0 {
		f.Page = 1
	} else f.Page > 1000 {
		return errors.New("you can't paginate past page #1000")
	}
	return nil
}
```

## Query generation

At this step you have enough data to build a query using Bun API. It is best to keep all query generation logic in a single method so it can be easily followed.

```go
func articleFilterQuery(q *bun.SelectQuery, f *ArticleFilter) (*bun.SelectQuery, error) {
	q = q.Where("category_id = ?", f.CategoryID).
		Limit(10).
		Offset(10 * (f.Page - 1))
	if f.Search != "" {
		q = q.Where("title LIKE ?", "%"+f.Search+"%")
	}
	return q, nil
}
```

## Query execution

Lastly, you need to execute the generated query and, optionally, do some post-processing. The end result may look like this:

```go
func handler(w http.ResponseWriter, req *http.Request) {
	f, err := articleFilterFromRequest(req)
	if err != nil {
		panic(err)
	}

	if err := f.Validate(); err != nil {
		panic(err)
	}

	var articles []Article

	q, err := articleFilterQuery(db.NewSelect().Model(&articles), f)
	if err != nil {
		panic(err)
	}

	if err := q.Scan(req.Context()); err != nil {
		panic(err)
	}

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"articles": articles,
	}); err != nil {
		panic(err)
	}
}
```
