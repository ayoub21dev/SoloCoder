import { TestCase } from "./curriculum";

export interface TestResult {
  id: string;
  passed: boolean;
  error?: string;
}

/**
 * Parses user code against a set of test cases
 * Note: We're using `new Function()` here to evaluate the testLogic string.
 * This is acceptable because the testLogic is trusted (we define it).
 * If user-submitted testLogic were allowed, we'd need a safer sandbox.
 */
export const runTests = (code: string, testCases: TestCase[]): TestResult[] => {
  return testCases.map((tc) => {
    try {
      // Create a function from the string logic
      // testLogic is expected to be a string representing the function body that returns a boolean
      const validator = new Function("code", tc.testLogic);
      const passed = validator(code);
      return { id: tc.id, passed: !!passed };
    } catch (err: any) {
      console.error(`Error running test ${tc.id}:`, err);
      return { id: tc.id, passed: false, error: err.message };
    }
  });
};
