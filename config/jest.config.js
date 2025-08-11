module.exports = {
  "testEnvironment": "node",
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "testMatch": [
    "**/tests/**/*.test.js",
    "**/tests/**/*.spec.js"
  ],
  "collectCoverageFrom": [
    "src/**/*.js",
    "core/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 0,
      "functions": 0,
      "lines": 0,
      "statements": 0
    }
  }
};