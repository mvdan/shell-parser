import { IStructDef } from '../../../types';
import assert from 'assert';
import { renderDoc } from '../helpers';
import Dependencies from '../../Dependencies';
import renderMethod from './method';
import renderField from './field';

export default function renderStruct(
  obj: IStructDef,
  dependencies: Dependencies
): string {
  assert(obj.kind === 'struct');

  const fields = obj.fields
    .map((field) => renderField(field, dependencies))
    .join('\n');

  const methods = obj.methods
    .map((method) => renderMethod(method, dependencies))
    .join('\n');

  obj.implements.forEach((type) => dependencies.addCustom(type, 'interface'));
  const implement = obj.implements.length
    ? 'implements ' + obj.implements.join(', ')
    : '';

  return (
    renderDoc(obj.doc) +
    `
      export class ${obj.is} ${implement} {
        ${fields}
        ${methods}
      }
    `
  );
}