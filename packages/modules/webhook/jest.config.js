module.exports = {
  transform: { "^.+\\.[jt]s?$": "@swc/jest" },
  modulePathIgnorePatterns: ["__fixtures__", "node_modules", "dist"],
  testEnvironment: `node`,
  moduleFileExtensions: [`js`, `ts`],
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
}

