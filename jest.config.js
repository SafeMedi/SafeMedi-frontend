module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "<rootDir>/**/*.{js,jsx,ts,tsx}",
    "!<rootDir>/**/*.d.ts",
    "!<rootDir>/**/index.ts",
    "!<rootDir>/**/types.ts",
    "!<rootDir>/coverage/**",
    "!<rootDir>/api/mock/**",
    "!<rootDir>/scripts/**",
    "!<rootDir>/tests/**",
    "!<rootDir>/babel.config.js",
    "!<rootDir>/metro.config.js",
    "!<rootDir>/jest.config.js",
    "!<rootDir>/tamagui.config.ts",
  ],
  coverageReporters: ["text-summary", "lcov", "json-summary"],
  coverageThreshold: {
    global: {
      lines: 60,
      statements: 60,
      functions: 60,
      branches: 60,
    },
  },
  testPathIgnorePatterns: ["/node_modules/", "/.expo/"],
};
