export default {
  testEnvironment: "node",
  transform: {}, // For .mjs modules, you usually don't transform
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.mjs"],
  verbose: true
};
