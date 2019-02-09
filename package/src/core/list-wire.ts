import { List, toArray } from 'list';

// @ts-ignore
List.prototype.toJSON = function<A>(): A[] {
  return toArray(this);
};
