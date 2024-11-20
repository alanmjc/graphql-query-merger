import { parse as p, Kind as i, visit as N } from "graphql";
const d = (u, a, r) => {
  const o = {}, l = {}, s = N(u, {
    [i.VARIABLE_DEFINITION](e) {
      const n = e.variable.name.value, t = `${n}_${r}`;
      return o[n] = t, {
        ...e,
        variable: {
          ...e.variable,
          name: { kind: i.NAME, value: t }
        }
      };
    },
    [i.VARIABLE](e) {
      const n = e.name.value, t = o[n] || n;
      return {
        ...e,
        name: { kind: i.NAME, value: t }
      };
    },
    [i.FRAGMENT_DEFINITION](e) {
      const n = e.name.value, t = `${n}_${r}`;
      return l[n] = t, {
        ...e,
        name: { kind: i.NAME, value: t }
      };
    },
    [i.FRAGMENT_SPREAD](e) {
      const n = e.name.value, t = l[n] || n;
      return {
        ...e,
        name: { kind: i.NAME, value: t }
      };
    },
    [i.DIRECTIVE](e) {
      return N(e, {
        [i.VARIABLE](n) {
          const t = n.name.value, m = o[t] || t;
          return {
            ...n,
            name: { kind: i.NAME, value: m }
          };
        }
      });
    }
  }), c = {};
  for (const [e, n] of Object.entries(a)) {
    const t = o[e] || e;
    c[t] = n;
  }
  return { document: s, variables: c };
};
class E {
  constructor(a) {
    this.operationName = a, this.documents = [], this.internalVariables = [], this.uniqueIdCounter = 1, this.operationType = null;
  }
  push(a, r = {}) {
    typeof a == "string" && (a = p(a));
    const o = this.uniqueIdCounter++, { document: l, variables: s } = d(a, r, o), c = l.definitions.filter(
      (n) => n.kind === i.OPERATION_DEFINITION
    );
    if (c.length === 0)
      throw new Error(
        "No se encontró una definición de operación en el documento proporcionado."
      );
    const e = c[0].operation;
    if (this.operationType && this.operationType !== e)
      throw new Error(
        `No se pueden combinar diferentes tipos de operaciones: ${this.operationType} y ${e}.`
      );
    return this.operationType = e, this.documents.push(l), this.internalVariables.push(s), this;
  }
  get query() {
    const a = [], r = [], o = [];
    for (const l of this.documents)
      for (const s of l.definitions)
        s.kind === i.OPERATION_DEFINITION ? (a.push(...s.variableDefinitions || []), r.push(...s.selectionSet.selections)) : s.kind === i.FRAGMENT_DEFINITION && o.push(s);
    return {
      kind: i.DOCUMENT,
      definitions: [
        {
          kind: i.OPERATION_DEFINITION,
          operation: this.operationType,
          name: { kind: i.NAME, value: this.operationName || "" },
          variableDefinitions: a,
          selectionSet: {
            kind: i.SELECTION_SET,
            selections: r
          }
        },
        ...o
      ]
    };
  }
  get variables() {
    return Object.assign({}, ...this.internalVariables);
  }
}
const h = (u = "") => new E(u);
export {
  h as mergeQueries
};
