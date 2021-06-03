module.exports = {
  roots: [
    '<rootDir>',
  ],
  testMatch: [
    '<rootDir>/test/**/?(*.)+(spec|test).+(ts)',
  ],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
}
