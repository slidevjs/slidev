module.exports = {
  roots: [
    '<rootDir>/test',
  ],
  testMatch: [
    '**/?(*.)+(spec|test).+(ts)',
  ],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
}
