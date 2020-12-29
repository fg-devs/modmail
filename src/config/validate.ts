/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import Conf from './conf';

/**
 * This validates the config.yml recursively
 * @function validate
 * @param {T extends Conf} ref Reference.
 * @param {any} obj Target, if obj is missing something ref has then an error
 * will be thrown
 * @throws {Error} See obj param description
 */
export default function validate<T extends Conf>(ref: T, obj: any): void {
  const reference = Object.keys(ref);
  const objKeys = Object.keys(obj);
  let hasMissingAttr = false;

  for (let i = 0; i < reference.length; i += 1) {
    const key = reference[i];
    if (key === 'name') {
      continue;
    }
    if (!(objKeys.includes(key))) {
      console.log(
        `${ref.name} is missing ${key} attribute. See (docs/config.md)`,
      );
      hasMissingAttr = true;
    }
  }

  if (hasMissingAttr) {
    throw new Error('config.yml has missing attributes see above');
  }
}
