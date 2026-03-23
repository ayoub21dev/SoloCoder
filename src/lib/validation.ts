import { Step } from './curriculum';
import { buildPreviewDocument } from './curriculum';

export interface TestResult {
  id: string;
  passed: boolean;
  error?: string;
}

type AssertFn = (condition: unknown, message?: string) => void;

function fail(message: unknown): never {
  throw new Error(typeof message === 'string' ? message : String(message));
}

function normalizeValue(value: unknown) {
  if (value instanceof Element) {
    return value.outerHTML;
  }

  return value;
}

function createAssert() {
  const assert = ((condition: unknown, message = 'Assertion failed') => {
    if (!condition) {
      fail(message);
    }
  }) as AssertFn & Record<string, (...args: unknown[]) => void>;

  assert.match = (actual: unknown, expected: unknown, message = 'Expected value to match pattern') => {
    if (!(expected instanceof RegExp)) {
      fail('assert.match expects a regular expression');
    }

    if (!expected.test(String(actual ?? ''))) {
      fail(message);
    }
  };

  assert.notMatch = (actual: unknown, expected: unknown, message = 'Expected value not to match pattern') => {
    if (!(expected instanceof RegExp)) {
      fail('assert.notMatch expects a regular expression');
    }

    if (expected.test(String(actual ?? ''))) {
      fail(message);
    }
  };

  assert.exists = (value: unknown, message = 'Expected value to exist') => {
    if (value === null || value === undefined) {
      fail(message);
    }
  };

  assert.notExists = (value: unknown, message = 'Expected value not to exist') => {
    if (value !== null && value !== undefined) {
      fail(message);
    }
  };

  assert.equal = (actual: unknown, expected: unknown, message = 'Expected values to be equal') => {
    if (actual != expected) {
      fail(`${message}: ${normalizeValue(actual)} !== ${normalizeValue(expected)}`);
    }
  };

  assert.strictEqual = (actual: unknown, expected: unknown, message = 'Expected values to be strictly equal') => {
    if (actual !== expected) {
      fail(`${message}: ${normalizeValue(actual)} !== ${normalizeValue(expected)}`);
    }
  };

  assert.notEqual = (actual: unknown, expected: unknown, message = 'Expected values to be different') => {
    if (actual == expected) {
      fail(message);
    }
  };

  assert.deepEqual = (actual: unknown, expected: unknown, message = 'Expected values to be deeply equal') => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      fail(message);
    }
  };

  assert.lengthOf = (value: unknown, expectedLength: unknown, message = 'Unexpected length') => {
    const actualLength = (value as { length?: number })?.length;

    if (typeof actualLength !== 'number' || actualLength !== expectedLength) {
      fail(message);
    }
  };

  assert.isString = (value: unknown, message = 'Expected a string') => {
    if (typeof value !== 'string') {
      fail(message);
    }
  };

  assert.isNumber = (value: unknown, message = 'Expected a number') => {
    if (typeof value !== 'number') {
      fail(message);
    }
  };

  assert.isBoolean = (value: unknown, message = 'Expected a boolean') => {
    if (typeof value !== 'boolean') {
      fail(message);
    }
  };

  assert.isFunction = (value: unknown, message = 'Expected a function') => {
    if (typeof value !== 'function') {
      fail(message);
    }
  };

  assert.isArray = (value: unknown, message = 'Expected an array') => {
    if (!Array.isArray(value)) {
      fail(message);
    }
  };

  assert.isObject = (value: unknown, message = 'Expected an object') => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      fail(message);
    }
  };

  assert.isTrue = (value: unknown, message = 'Expected true') => {
    if (value !== true) {
      fail(message);
    }
  };

  assert.isFalse = (value: unknown, message = 'Expected false') => {
    if (value !== false) {
      fail(message);
    }
  };

  assert.isDefined = (value: unknown, message = 'Expected value to be defined') => {
    if (value === undefined) {
      fail(message);
    }
  };

  assert.isUndefined = (value: unknown, message = 'Expected value to be undefined') => {
    if (value !== undefined) {
      fail(message);
    }
  };

  assert.isNull = (value: unknown, message = 'Expected null') => {
    if (value !== null) {
      fail(message);
    }
  };

  assert.isNotNull = (value: unknown, message = 'Expected value not to be null') => {
    if (value === null) {
      fail(message);
    }
  };

  assert.isEmpty = (value: unknown, message = 'Expected an empty value') => {
    const length = (value as { length?: number })?.length;

    if (typeof value === 'string' || Array.isArray(value)) {
      if (length !== 0) {
        fail(message);
      }

      return;
    }

    if (value && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length !== 0) {
      fail(message);
    }
  };

  assert.isNotEmpty = (value: unknown, message = 'Expected a non-empty value') => {
    if (value === null || value === undefined) {
      fail(message);
    }

    if (typeof value === 'string' || Array.isArray(value)) {
      if (value.length === 0) {
        fail(message);
      }
    }
  };

  assert.include = (container: unknown, value: unknown, message = 'Expected value to be included') => {
    if (typeof container === 'string') {
      if (!container.includes(String(value))) {
        fail(message);
      }

      return;
    }

    if (Array.isArray(container)) {
      if (!container.includes(value)) {
        fail(message);
      }

      return;
    }

    if (container && typeof container === 'object') {
      if (!(String(value) in (container as Record<string, unknown>))) {
        fail(message);
      }

      return;
    }

    fail(message);
  };

  assert.notInclude = (container: unknown, value: unknown, message = 'Expected value not to be included') => {
    if (typeof container === 'string' && container.includes(String(value))) {
      fail(message);
    }

    if (Array.isArray(container) && container.includes(value)) {
      fail(message);
    }
  };

  assert.isAtLeast = (actual: unknown, expected: unknown, message = 'Expected value to be at least target') => {
    if (typeof actual !== 'number' || typeof expected !== 'number' || actual < expected) {
      fail(message);
    }
  };

  assert.isAtMost = (actual: unknown, expected: unknown, message = 'Expected value to be at most target') => {
    if (typeof actual !== 'number' || typeof expected !== 'number' || actual > expected) {
      fail(message);
    }
  };

  assert.isAbove = (actual: unknown, expected: unknown, message = 'Expected value to be above target') => {
    if (typeof actual !== 'number' || typeof expected !== 'number' || actual <= expected) {
      fail(message);
    }
  };

  assert.isBelow = (actual: unknown, expected: unknown, message = 'Expected value to be below target') => {
    if (typeof actual !== 'number' || typeof expected !== 'number' || actual >= expected) {
      fail(message);
    }
  };

  assert.property = (value: unknown, propertyName: unknown, message = 'Expected property to exist') => {
    if (!value || typeof value !== 'object' || !(String(propertyName) in (value as Record<string, unknown>))) {
      fail(message);
    }
  };

  assert.propertyVal = (
    value: unknown,
    propertyName: unknown,
    expected: unknown,
    message = 'Expected property value to match'
  ) => {
    assert.property(value, propertyName, message);

    if ((value as Record<string, unknown>)[String(propertyName)] !== expected) {
      fail(message);
    }
  };

  assert.oneOf = (value: unknown, values: unknown, message = 'Expected value to be one of the allowed options') => {
    if (!Array.isArray(values) || !values.includes(value)) {
      fail(message);
    }
  };

  assert.ok = (value: unknown, message = 'Expected value to be truthy') => {
    if (!value) {
      fail(message);
    }
  };

  assert.isOk = assert.ok;

  assert.fail = (message = 'Forced assertion failure') => {
    fail(message);
  };

  assert.notStrictEqual = (actual: unknown, expected: unknown, message = 'Expected values to be different') => {
    if (actual === expected) {
      fail(message);
    }
  };

  assert.notDeepEqual = (actual: unknown, expected: unknown, message = 'Expected values to be deeply different') => {
    if (JSON.stringify(actual) === JSON.stringify(expected)) {
      fail(message);
    }
  };

  assert.deepStrictEqual = assert.deepEqual;
  assert.notEmpty = assert.isNotEmpty;

  assert.instanceOf = (value: unknown, constructor: unknown, message = 'Expected value to be instance of constructor') => {
    if (typeof constructor !== 'function' || !(value instanceof constructor)) {
      fail(message);
    }
  };

  assert.isNotNaN = (value: unknown, message = 'Expected value not to be NaN') => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      fail(message);
    }
  };

  assert.approximately = (actual: unknown, expected: unknown, delta: unknown, message = 'Expected value to be approximately equal') => {
    if (
      typeof actual !== 'number' ||
      typeof expected !== 'number' ||
      typeof delta !== 'number' ||
      Math.abs(actual - expected) > delta
    ) {
      fail(message);
    }
  };

  assert.closeTo = assert.approximately;

  assert.hasAllKeys = (value: unknown, keys: unknown, message = 'Expected object to have all keys') => {
    if (!value || typeof value !== 'object' || !Array.isArray(keys)) {
      fail(message);
    }

    const actualKeys = Object.keys(value as Record<string, unknown>);

    if (!keys.every(key => actualKeys.includes(String(key)))) {
      fail(message);
    }
  };

  assert.containsAllKeys = assert.hasAllKeys;

  assert.includeMembers = (actual: unknown, expected: unknown, message = 'Expected array to include all members') => {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      fail(message);
    }

    if (!expected.every(item => actual.includes(item))) {
      fail(message);
    }
  };

  assert.sameMembers = (actual: unknown, expected: unknown, message = 'Expected arrays to contain the same members') => {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      fail(message);
    }

    const actualValues = [...actual].sort();
    const expectedValues = [...expected].sort();

    if (actualValues.length !== expectedValues.length || JSON.stringify(actualValues) !== JSON.stringify(expectedValues)) {
      fail(message);
    }
  };

  assert.sameOrderedMembers = (actual: unknown, expected: unknown, message = 'Expected arrays to contain the same ordered members') => {
    if (!Array.isArray(actual) || !Array.isArray(expected) || JSON.stringify(actual) !== JSON.stringify(expected)) {
      fail(message);
    }
  };

  assert.sameDeepMembers = (actual: unknown, expected: unknown, message = 'Expected arrays to contain the same deep members') => {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      fail(message);
    }

    const normalize = (input: unknown[]) => input.map(item => JSON.stringify(item)).sort();

    if (JSON.stringify(normalize(actual)) !== JSON.stringify(normalize(expected))) {
      fail(message);
    }
  };

  assert.sameDeepOrderedMembers = (
    actual: unknown,
    expected: unknown,
    message = 'Expected arrays to contain the same deep ordered members'
  ) => {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      fail(message);
    }

    const actualSerialized = actual.map(item => JSON.stringify(item));
    const expectedSerialized = expected.map(item => JSON.stringify(item));

    if (JSON.stringify(actualSerialized) !== JSON.stringify(expectedSerialized)) {
      fail(message);
    }
  };

  assert.deepInclude = (container: unknown, value: unknown, message = 'Expected container to deeply include value') => {
    if (Array.isArray(container)) {
      const serializedValue = JSON.stringify(value);

      if (!container.some(item => JSON.stringify(item) === serializedValue)) {
        fail(message);
      }

      return;
    }

    if (container && typeof container === 'object' && value && typeof value === 'object') {
      for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
        if (JSON.stringify((container as Record<string, unknown>)[key]) !== JSON.stringify(entry)) {
          fail(message);
        }
      }

      return;
    }

    fail(message);
  };

  assert.doesNotThrow = (fn: unknown, message = 'Expected function not to throw') => {
    if (typeof fn !== 'function') {
      fail(message);
    }

    try {
      fn();
    } catch {
      fail(message);
    }
  };

  assert.notThrow = assert.doesNotThrow;

  assert.throws = (fn: unknown, expected?: unknown, message = 'Expected function to throw') => {
    if (typeof fn !== 'function') {
      fail(message);
    }

    let thrownError: unknown;
    let didThrow = false;

    try {
      fn();
    } catch (error) {
      didThrow = true;
      thrownError = error;
    }

    if (!didThrow) {
      fail(message);
    }

    if (expected instanceof RegExp && !expected.test(String(thrownError instanceof Error ? thrownError.message : thrownError))) {
      fail(message);
    }
  };

  return new Proxy(assert, {
    get(target, property, receiver) {
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      }

      return () => {
        fail(`Unsupported assert method: ${String(property)}`);
      };
    }
  });
}

function removeJSComments(code: string) {
  return code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
}

function spyOn(target: Record<string, (...args: unknown[]) => unknown>, methodName: string) {
  const original = target[methodName];
  const calls: unknown[][] = [];

  target[methodName] = (...args: unknown[]) => {
    calls.push(args);
    return undefined;
  };

  return {
    calls,
    restore() {
      target[methodName] = original;
    }
  };
}

function createHelpers() {
  const consoleProxy = {
    log: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    info: () => undefined
  };

  return {
    console: consoleProxy,
    spyOn,
    removeJSComments
  };
}

function createHiddenFrame(srcDoc: string) {
  return new Promise<HTMLIFrameElement>((resolve, reject) => {
    const iframe = document.createElement('iframe');

    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    document.body.appendChild(iframe);

    const frameDocument = iframe.contentDocument ?? iframe.contentWindow?.document;

    if (!frameDocument) {
      iframe.remove();
      reject(new Error('Failed to initialize validation iframe document'));
      return;
    }

    try {
      frameDocument.open();
      frameDocument.write(srcDoc);
      frameDocument.close();
    } catch (error) {
      iframe.remove();
      reject(error instanceof Error ? error : new Error('Failed to write validation iframe document'));
      return;
    }

    const waitForReady = () => {
      const readyDocument = iframe.contentDocument ?? iframe.contentWindow?.document;

      if (!readyDocument) {
        iframe.remove();
        reject(new Error('Validation iframe lost access to its document'));
        return;
      }

      if (readyDocument.readyState === 'interactive' || readyDocument.readyState === 'complete') {
        window.requestAnimationFrame(() => resolve(iframe));
        return;
      }

      window.requestAnimationFrame(waitForReady);
    };

    waitForReady();
  });
}

function finalizeResult(id: string, callback: () => void): TestResult {
  try {
    callback();
    return { id, passed: true };
  } catch (error) {
    return {
      id,
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function runLegacyTests(code: string, step: Step): Promise<TestResult[]> {
  return step.testCases.map(testCase =>
    finalizeResult(testCase.id, () => {
      const validator = new Function('code', testCase.testLogic);
      const passed = validator(code);

      if (!passed) {
        fail('Legacy validation returned false');
      }
    })
  );
}

async function runFreeCodeCampMarkupTests(code: string, step: Step): Promise<TestResult[]> {
  const iframe = await createHiddenFrame(buildPreviewDocument(step, code));
  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument;

  if (!frameWindow || !frameDocument) {
    iframe.remove();
    throw new Error('Validation iframe did not expose a document');
  }

  const assert = createAssert();
  const helpers = createHelpers();

  try {
    return step.testCases.map(testCase =>
      finalizeResult(testCase.id, () => {
        const validator = new Function(
          'assert',
          '__helpers',
          'code',
          'document',
          'window',
          `${testCase.testLogic}\nreturn true;`
        );

        validator(assert, helpers, code, frameDocument, frameWindow);
      })
    );
  } finally {
    iframe.remove();
  }
}

async function runFreeCodeCampJavascriptTests(code: string, step: Step): Promise<TestResult[]> {
  const baseDocument = buildPreviewDocument(step, '');
  const iframe = await createHiddenFrame(baseDocument);
  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument;

  if (!frameWindow || !frameDocument) {
    iframe.remove();
    throw new Error('Validation iframe did not expose a document');
  }

  const assert = createAssert();
  const helpers = createHelpers();

  try {
    return step.testCases.map(testCase =>
      finalizeResult(testCase.id, () => {
        const validator = new Function(
          '__sourceCode',
          'assert',
          '__helpers',
          'document',
          'window',
          `
          with ({ code: __sourceCode, assert, __helpers, document, window, console: __helpers.console }) {
            ${step.testSetup ?? ''}
            ${code}
            ${testCase.testLogic}
            return true;
          }
        `
        );

        validator(code, assert, helpers, frameDocument, frameWindow);
      })
    );
  } finally {
    iframe.remove();
  }
}

export async function runTests(code: string, step: Step): Promise<TestResult[]> {
  if (step.validationMode !== 'freecodecamp') {
    return runLegacyTests(code, step);
  }

  if (step.editorLanguage === 'javascript') {
    return runFreeCodeCampJavascriptTests(code, step);
  }

  return runFreeCodeCampMarkupTests(code, step);
}
