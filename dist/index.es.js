var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_index_es = __commonJS({
  "index.es.js"(exports, module) {
    const { Kind, parse, visit } = require("graphql");
    function renameVariablesAndFragments(document, variables, uniqueId) {
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
              name: { kind: Kind.NAME, value: newName }
            }
          };
        },
        [Kind.VARIABLE](node) {
          const oldName = node.name.value;
          const newName = variableNameMap[oldName] || oldName;
          return {
            ...node,
            name: { kind: Kind.NAME, value: newName }
          };
        },
        [Kind.FRAGMENT_DEFINITION](node) {
          const oldName = node.name.value;
          const newName = `${oldName}_${uniqueId}`;
          fragmentNameMap[oldName] = newName;
          return {
            ...node,
            name: { kind: Kind.NAME, value: newName }
          };
        },
        [Kind.FRAGMENT_SPREAD](node) {
          const oldName = node.name.value;
          const newName = fragmentNameMap[oldName] || oldName;
          return {
            ...node,
            name: { kind: Kind.NAME, value: newName }
          };
        },
        [Kind.DIRECTIVE](node) {
          return visit(node, {
            [Kind.VARIABLE](varNode) {
              const oldName = varNode.name.value;
              const newName = variableNameMap[oldName] || oldName;
              return {
                ...varNode,
                name: { kind: Kind.NAME, value: newName }
              };
            }
          });
        }
      });
      const newVariables = {};
      for (const [key, value] of Object.entries(variables)) {
        const newKey = variableNameMap[key] || key;
        newVariables[newKey] = value;
      }
      return { document: newDocument, variables: newVariables };
    }
    class GraphQLQueryMerger {
      constructor(operationName) {
        this.operationName = operationName;
        this.documents = [];
        this.internalVariables = [];
        this.uniqueIdCounter = 1;
        this.operationType = null;
      }
      push(document, variables = {}) {
        if (typeof document === "string") {
          document = parse(document);
        }
        const uniqueId = this.uniqueIdCounter++;
        const { document: renamedDocument, variables: renamedVariables } = renameVariablesAndFragments(document, variables, uniqueId);
        const operationDefinitions = renamedDocument.definitions.filter(
          (def) => def.kind === Kind.OPERATION_DEFINITION
        );
        if (operationDefinitions.length === 0) {
          throw new Error(
            "No se encontró una definición de operación en el documento proporcionado."
          );
        }
        const operationType = operationDefinitions[0].operation;
        if (this.operationType && this.operationType !== operationType) {
          throw new Error(
            `No se pueden combinar diferentes tipos de operaciones: ${this.operationType} y ${operationType}.`
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
              allVariableDefinitions.push(...definition.variableDefinitions || []);
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
              name: { kind: Kind.NAME, value: this.operationName || "" },
              variableDefinitions: allVariableDefinitions,
              selectionSet: {
                kind: Kind.SELECTION_SET,
                selections: allSelections
              }
            },
            ...allFragmentDefinitions
          ]
        };
      }
      get variables() {
        return Object.assign({}, ...this.internalVariables);
      }
    }
    function mergeQueries(operationName = "") {
      return new GraphQLQueryMerger(operationName);
    }
    module.exports = { mergeQueries };
  }
});
export default require_index_es();
