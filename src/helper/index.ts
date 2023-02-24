import { Field } from '@apitable/widget-sdk';

export * as jsonpointer from './jsonpointer';
export * from './use_resize';

export const getFieldFormEnum = (fields: Field[]) => {
  const _enum = fields.map(field => field.id);
  const enumNames = fields.map(field => field.name);
  return {
    enum: _enum, enumNames,
  };
};