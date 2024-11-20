# GraphQL Query Merger

**GraphQL Query Merger** is a utility library designed to merge multiple GraphQL queries into a single, cohesive query. This helps developers streamline their GraphQL requests by combining related operations efficiently, avoiding redundancy and improving maintainability.

---

## Table of Contents

- [GraphQL Query Merger](#graphql-query-merger)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Importing the Library](#importing-the-library)
    - [Combining Queries](#combining-queries)
      - [Basic Query Combination](#basic-query-combination)
      - [Combining Queries with Variables](#combining-queries-with-variables)
      - [Conditional Query Combination](#conditional-query-combination)
  - [Features](#features)
  - [Notes](#notes)

---

## Installation

To install the library, use npm or yarn:

```bash
npm install graphql-query-merger graphql
```

> **Note**: `graphql-query-merger` has a peer dependency on `graphql`. Ensure that the `graphql` package is installed alongside it.

---

## Usage

### Importing the Library

To use the library, import the necessary functions:

```javascript
const { mergeQueries } = require('graphql-query-merger');
const { print } = require('graphql');
const { gql } = require('graphql-tag');
```

- **`mergeQueries()`**: Initializes a new query merger instance.
- **`push(query, variables?)`**: Adds a query to the merger. Optionally accepts a variables object.
- **`print()`**: Converts the resulting query to a printable string format.

### Combining Queries

#### Basic Query Combination

You can combine queries written as strings or `gql`-tagged templates.

```javascript
const query_1 = /* GraphQL */ `
  {
    user {
      id
      name
    }
  }
`;

const query_2 = /* GraphQL */ gql`
  {
    post {
      id
      title
    }
  }
`;

const combined = mergeQueries().push(query_1).push(query_2);

console.log(print(combined.query));
```

**Output**:

```graphql
{
  user {
    id
    name
  }
  post {
    id
    title
  }
}
```

#### Combining Queries with Variables

When combining queries that include variables, the library automatically renames conflicting variable names to maintain uniqueness.

```javascript
const query_1 = /* GraphQL */ gql`
  query ($id: ID!) {
    user(id: $id) {
      id
      name
    }
  }
`;

const query_2 = /* GraphQL */ `
  query ($id: ID!) {
    post(id: $id) {
      id
      title
    }
  }
`;

const combined = mergeQueries().push(query_1, { id: 1 }).push(query_2, { id: 2 });

console.log(print(combined.query));
console.log(combined.variables);
```

**Output**:

```graphql
query ($id_1: ID!, $id_2: ID!) {
  user(id: $id_1) {
    id
    name
  }
  post(id: $id_2) {
    id
    title
  }
}
```

**Variables**:

```json
{
  "id_1": 1,
  "id_2": 2
}
```

- **Automatic Variable Renaming**: Conflicting variable names (`id`) are renamed (`id_1`, `id_2`).

#### Conditional Query Combination

You can dynamically add queries based on runtime conditions.

```javascript
const combined = mergeQueries('optionalQueryName');

combined.push(
  /* GraphQL */ `
    query ($email: String!) {
      user(email: $email) {
        id
        name
      }
    }
  `,
  { email: 'example@test.com' },
);

if (true) {
  combined.push(
    /* GraphQL */ `
      query ($id: ID!) {
        post(id: $id) {
          id
          title
          date
        }
      }
    `,
    { id: 10 },
  );
}

console.log(print(combined.query));
console.log(combined.variables);
```

**Output**:

```graphql
query optionalQueryName($email_1: String!, $id_2: ID!) {
  user(email: $email_1) {
    id
    name
  }
  post(id: $id_2) {
    id
    title
    date
  }
}
```

**Variables**:

```json
{
  "email_1": "example@test.com",
  "id_2": 10
}
```

---

## Features

- **Merge GraphQL Queries**: Seamlessly combine multiple queries into one.
- **Variable Deduplication**: Automatically handles conflicts by renaming variables.
- **Supports Conditional Queries**: Add queries dynamically based on runtime logic.
- **Customizable Query Names**: Optionally name the resulting query.

---

## Notes

1. **Variable Scope**: The library renames variables in the combined query to ensure no conflicts occur between different queries.
2. **Query Formats**: Queries can be provided as:
   - String literals
   - `gql`-tagged templates (recommended for syntax highlighting and validation).
3. **Error Handling**: Ensure all variables required by the queries are provided when invoking `push()`. Missing variables will lead to runtime errors.
