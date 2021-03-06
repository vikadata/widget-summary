// https://github.com/janl/node-jsonpointer

const hasExcape = /~/;
const escapeMatcher = /~[01]/g;
const escapeReplacer = (m) => {
  switch (m) {
    case '~1': return '/';
    case '~0': return '~';
  }
  throw new Error('Invalid tilde escape: ' + m);
};

const untilde = (str: string) => {
  if (!hasExcape.test(str)) return str;
  return str.replace(escapeMatcher, escapeReplacer);
};

function setter(obj, pointer, value) {
  let part;
  let hasNextPart;

  if (pointer[1] === 'constructor' && pointer[2] === 'prototype') return obj;
  if (pointer[1] === '__proto__') return obj;

  for (let p = 1, len = pointer.length; p < len;) {
    part = untilde(pointer[p++]);
    hasNextPart = len > p;

    if (typeof obj[part] === 'undefined') {
      // support setting of /-
      if (Array.isArray(obj) && part === '-') {
        part = obj.length;
      }

      // support nested objects/array when setting values
      if (hasNextPart) {
        if ((pointer[p] !== '' && pointer[p] < Infinity) || pointer[p] === '-') obj[part] = [];
        else obj[part] = {};
      }
    }

    if (!hasNextPart) break;
    obj = obj[part];
  }

  const oldValue = obj[part];
  if (value === undefined) delete obj[part];
  else obj[part] = value;
  return oldValue;
}

function compilePointer(pointer) {
  if (typeof pointer === 'string') {
    pointer = pointer.split('/');
    if (pointer[0] === '') return pointer;
    throw new Error('Invalid JSON pointer.');
  } else if (Array.isArray(pointer)) {
    return pointer;
  }

  throw new Error('Invalid JSON pointer.');
}

function get(obj, pointer) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.');
  pointer = compilePointer(pointer);
  const len = pointer.length;
  if (len === 1) return obj;

  for (let p = 1; p < len;) {
    obj = obj[untilde(pointer[p++])];
    if (len === p) return obj;
    if (typeof obj !== 'object') return undefined;
  }
}

function set(obj, pointer, value) {
  if (typeof obj !== 'object') throw new Error('Invalid input object.');
  pointer = compilePointer(pointer);
  if (pointer.length === 0) throw new Error('Invalid JSON pointer for set.');
  return setter(obj, pointer, value);
}

function compile(pointer) {
  const compiled = compilePointer(pointer);
  return {
    get: function(object) {
      return get(object, compiled);
    },
    set: function(object, value) {
      return set(object, compiled, value);
    },
  };
}

export {
  get,
  set,
  compile,
};