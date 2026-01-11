export default {
  testEnvironment: "node",
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testMatch: ["**/tests/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
