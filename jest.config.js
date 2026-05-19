module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "<rootDir>/**/*.{js,jsx,ts,tsx}",
    "!<rootDir>/**/node_modules/**",
    "!<rootDir>/**/.expo/**",
    "!<rootDir>/app-example/**",
    "!<rootDir>/coverage/**",
  ],
  coverageReporters: ["text-summary", "lcov", "json-summary"],
  testPathIgnorePatterns: ["/node_modules/", "/.expo/"],
};
