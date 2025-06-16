import { Kind, parse, visit, print } from 'graphql';

const renameVariablesAndFragments = (document, variables, uniqueId) => {
  const variableNameMap = {};
  const fragmentNameMap = {};

  const newDocument = visit(document, {
    [Kind.VARIABLE_DEFINITION](node) {
      const oldName = node.variable.name.value;
      const newName = `${oldName}_${uniqueId}`;
      variableNameMap[oldName] = newName;
      return {
        ...node,
        variable: {
          ...node.variable,
          name: { kind: Kind.NAME, value: newName },
        },
      };
    },
    [Kind.VARIABLE](node) {
      const oldName = node.name.value;
      const newName = variableNameMap[oldName] || oldName;
      return {
        ...node,
        name: { kind: Kind.NAME, value: newName },
      };
    },
    [Kind.FRAGMENT_DEFINITION](node) {
      const oldName = node.name.value;
      const newName = `${oldName}_${uniqueId}`;
      fragmentNameMap[oldName] = newName;
      return {
        ...node,
        name: { kind: Kind.NAME, value: newName },
      };
    },
    [Kind.FRAGMENT_SPREAD](node) {
      const oldName = node.name.value;
      const newName = fragmentNameMap[oldName] || oldName;
      return {
        ...node,
        name: { kind: Kind.NAME, value: newName },
      };
    },
    [Kind.DIRECTIVE](node) {
      return visit(node, {
        [Kind.VARIABLE](varNode) {
          const oldName = varNode.name.value;
          const newName = variableNameMap[oldName] || oldName;
          return {
            ...varNode,
            name: { kind: Kind.NAME, value: newName },
          };
        },
      });
    },
  });

  const newVariables = {};
  for (const [key, value] of Object.entries(variables)) {
    const newKey = variableNameMap[key] || key;
    newVariables[newKey] = value;
  }

  return { document: newDocument, variables: newVariables };
};

class GraphQLQueryMerger {
  constructor(operationName) {
    this.operationName = operationName;
    this.documents = [];
    this.internalVariables = [];
    this.uniqueIdCounter = 1;
    this.operationType = null;
  }

  push(document, variables = {}) {
    if (typeof document === 'string') {
      document = parse(document);
    }

    const uniqueId = this.uniqueIdCounter++;

    const { document: renamedDocument, variables: renamedVariables } =
      renameVariablesAndFragments(document, variables, uniqueId);

    const operationDefinitions = renamedDocument.definitions.filter(
      (def) => def.kind === Kind.OPERATION_DEFINITION,
    );

    if (operationDefinitions.length === 0) {
      throw new Error(
        'No operation definition found in the provided document.',
      );
    }

    const operationType = operationDefinitions[0].operation;

    if (this.operationType && this.operationType !== operationType) {
      throw new Error(
        `Cannot merge different operation types: ${this.operationType} and ${operationType}.`,
      );
    }

    this.operationType = operationType;

    this.documents.push(renamedDocument);
    this.internalVariables.push(renamedVariables);
    return this;
  }

  get query() {
    const allVariableDefinitions = [];
    const allSelections = [];
    const allFragmentDefinitions = [];

    for (const doc of this.documents) {
      for (const definition of doc.definitions) {
        if (definition.kind === Kind.OPERATION_DEFINITION) {
          allVariableDefinitions.push(
            ...(definition.variableDefinitions || []),
          );
          allSelections.push(...definition.selectionSet.selections);
        } else if (definition.kind === Kind.FRAGMENT_DEFINITION) {
          allFragmentDefinitions.push(definition);
        }
      }
    }

    return {
      kind: Kind.DOCUMENT,
      definitions: [
        {
          kind: Kind.OPERATION_DEFINITION,
          operation: this.operationType,
          name: { kind: Kind.NAME, value: this.operationName || '' },
          variableDefinitions: allVariableDefinitions,
          selectionSet: {
            kind: Kind.SELECTION_SET,
            selections: allSelections,
          },
        },
        ...allFragmentDefinitions,
      ],
    };
  }

  getQueryString() {
    return print(this.query);
  }

  get variables() {
    return Object.assign({}, ...this.internalVariables);
  }
}

const mergeQueries = (operationName = '') =>
  new GraphQLQueryMerger(operationName);

export { mergeQueries };
