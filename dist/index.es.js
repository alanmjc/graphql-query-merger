import { parse as p, Kind as t, print as d, visit as m } from "graphql";
const E = (c, a, s) => {
  const o = {}, l = {}, r = m(c, {
    [t.VARIABLE_DEFINITION](e) {
      const n = e.variable.name.value, i = `${n}_${s}`;
      return o[n] = i, {
        ...e,
        variable: {
          ...e.variable,
          name: { kind: t.NAME, value: i }
        }
      };
    },
    [t.VARIABLE](e) {
      const n = e.name.value, i = o[n] || n;
      return {
        ...e,
        name: { kind: t.NAME, value: i }
      };
    },
    [t.FRAGMENT_DEFINITION](e) {
      const n = e.name.value, i = `${n}_${s}`;
      return l[n] = i, {
        ...e,
        name: { kind: t.NAME, value: i }
      };
    },
    [t.FRAGMENT_SPREAD](e) {
      const n = e.name.value, i = l[n] || n;
      return {
        ...e,
        name: { kind: t.NAME, value: i }
      };
    },
    [t.DIRECTIVE](e) {
      return m(e, {
        [t.VARIABLE](n) {
          const i = n.name.value, N = o[i] || i;
          return {
            ...n,
            name: { kind: t.NAME, value: N }
          };
        }
      });
    }
  }), u = {};
  for (const [e, n] of Object.entries(a)) {
    const i = o[e] || e;
    u[i] = n;
  }
  return { document: r, variables: u };
};
class h {
  constructor(a) {
    this.operationName = a, this.documents = [], this.internalVariables = [], this.uniqueIdCounter = 1, this.operationType = null;
  }
  push(a, s = {}) {
    typeof a == "string" && (a = p(a));
    const o = this.uniqueIdCounter++, { document: l, variables: r } = E(a, s, o), u = l.definitions.filter(
      (n) => n.kind === t.OPERATION_DEFINITION
    );
    if (u.length === 0)
      throw new Error(
        "No operation definition found in the provided document."
      );
    const e = u[0].operation;
    if (this.operationType && this.operationType !== e)
      throw new Error(
        `Cannot merge different operation types: ${this.operationType} and ${e}.`
      );
    return this.operationType = e, this.documents.push(l), this.internalVariables.push(r), this;
  }
  get query() {
    const a = [], s = [], o = [];
    for (const l of this.documents)
      for (const r of l.definitions)
        r.kind === t.OPERATION_DEFINITION ? (a.push(
          ...r.variableDefinitions || []
        ), s.push(...r.selectionSet.selections)) : r.kind === t.FRAGMENT_DEFINITION && o.push(r);
    return {
      kind: t.DOCUMENT,
      definitions: [
        {
          kind: t.OPERATION_DEFINITION,
          operation: this.operationType,
          name: { kind: t.NAME, value: this.operationName || "" },
          variableDefinitions: a,
          selectionSet: {
            kind: t.SELECTION_SET,
            selections: s
          }
        },
        ...o
      ]
    };
  }
  getQueryString() {
    return d(this.query);
  }
  get variables() {
    return Object.assign({}, ...this.internalVariables);
  }
}
const f = (c = "") => new h(c);
export {
  f as mergeQueries
};
