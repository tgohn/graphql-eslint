import { GraphQLRuleTester, ParserOptions } from '../src';
import rule, { SelectionSetDepthRuleConfig } from '../src/rules/selection-set-depth';

const WITH_SIBLINGS = {
  parserOptions: <ParserOptions>{
    operations: 'fragment AlbumFields on Album { id }',
  },
};

const WITH_SIBLINGS_DEEP = {
  parserOptions: <ParserOptions>{
    operations: `
      fragment AlbumFields on Album {
        id
        modifier {
          date
        }
      }
    `,
  },
};

const ruleTester = new GraphQLRuleTester();

ruleTester.runGraphQLTests<[SelectionSetDepthRuleConfig]>('selection-set-depth', rule, {
  valid: [
    {
      options: [{ maxDepth: 2 }],
      code: `
        query {
          viewer { # Level 0
            albums { # Level 1
              title # Level 2
            }
          }
        }
      `,
    },
    {
      ...WITH_SIBLINGS,
      options: [{ maxDepth: 2 }],
      code: /* GraphQL */ `
        query deep2 {
          viewer {
            albums {
              ...AlbumFields
            }
          }
        }
      `,
    },
    {
      ...WITH_SIBLINGS,
      options: [{ maxDepth: 1, ignore: ['albums'] }],
      code: /* GraphQL */ `
        query deep2 {
          viewer {
            albums {
              ...AlbumFields
            }
          }
        }
      `,
    },
  ],
  invalid: [
    {
      options: [{ maxDepth: 1 }],
      errors: [{ message: "'deep2' exceeds maximum operation depth of 1" }],
      code: /* GraphQL */ `
        query deep2 {
          viewer {
            albums {
              title
            }
          }
        }
      `,
    },
    {
      ...WITH_SIBLINGS,
      options: [{ maxDepth: 1 }],
      errors: [{ message: "'deep2' exceeds maximum operation depth of 1" }],
      code: /* GraphQL */ `
        query deep2 {
          viewer {
            albums {
              ...AlbumFields
            }
          }
        }
      `,
    },
    {
      name: 'suggestions should work with inline fragments',
      ...WITH_SIBLINGS,
      options: [{ maxDepth: 1 }],
      errors: [{ message: "'' exceeds maximum operation depth of 1" }],
      code: /* GraphQL */ `
        query {
          viewer {
            albums {
              ... on Album {
                id
              }
            }
          }
        }
      `,
    },
    {
      name: 'suggestions should work with error depth in inline fragments',
      ...WITH_SIBLINGS_DEEP,
      options: [{ maxDepth: 2 }],
      errors: [{ message: "'' exceeds maximum operation depth of 2" }],
      code: /* GraphQL */ `
        query {
          viewer {
            albums {
              ...AlbumFields
            }
          }
        }
      `,
    },
  ],
});
