module.exports = {
  roots: [
    '<rootDir>',
  ],
  testMatch: [
    '**/__tests__/**/*.+(ts)',
    '**/?(*.)+(spec|test).+(ts)',
  ],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
}
