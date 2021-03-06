import types from './raw';
import define from './define';
import { queue } from './types-map';
import { ITypeMap, ITypeDefMap } from '../types';
import assert from 'assert';
// TODO: replace replaceMap in docs
// import { replaceMap } from './get-name';

export default function resolve(): ITypeDefMap {
  // Entry point is Node
  // We'll only process types dependent on it
  queue.push('Node');

  const acc: ITypeDefMap = {};

  while (queue.length) {
    const next = queue.shift();
    if (!next) throw Error('No next item in queue');

    // Check whether it's already been processed
    if (acc.hasOwnProperty(next)) continue;

    acc[next] = define(next, types[next]);
  }

  // Root names to def.is instead of def.was
  const ans: ITypeDefMap = Object.keys(acc).reduce(
    (res: ITypeMap, was: string) => {
      const def = acc[was];
      res[def.is] = def;
      return res;
    },
    {}
  );

  // Add implements to structs
  Object.values(ans).forEach((item) => {
    if (item.kind !== 'interface') return;
    item.implementedBy.forEach((name) => {
      assert(typeof ans[name] === 'object');

      const struct = ans[name];
      if (struct.kind !== 'struct') {
        throw Error(`${name} implemented by ${item.is} is not a struct.`);
      }
      struct.implements.push(item.is);
    });
  });

  return ans;
}
