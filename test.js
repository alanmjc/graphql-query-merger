const { mergeQueries } = require('./src/index');
const { print } = require('graphql');
const { gql } = require('graphql-tag');

test('Combine 2 queries', () => {
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

  const expected = /* GraphQL */ gql`
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
  `;

  expect(print(combined.query)).toBe(print(expected));
});

test('Combine 2 queries with variables', () => {
  const query_1 = /* GraphQL */ gql`
    query ($id: ID!) {
      user(id: $id) {
        id
        name
      }
    }
  `;

  const query_2 = /* GraphQL */ gql`
    query ($id: ID!) {
      post(id: $id) {
        id
        title
      }
    }
  `;

  const combined = mergeQueries().push(query_1, { id: 1 }).push(query_2, { id: 2 });

  const expected = /* GraphQL */ gql`
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
  `;

  expect(print(combined.query)).toBe(print(expected));
  expect(combined.variables).toEqual({ id_1: 1, id_2: 2 });
});
