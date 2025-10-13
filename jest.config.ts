import path from 'node:path';
import type { Config } from 'jest';

const root = path.join(__dirname);

const unitConfig: Config = {
  displayName: 'unit',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  preset: 'ts-jest',
  rootDir: root,
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/*spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

const e2eConfig: Config = {
  displayName: 'e2e',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: root,
  testEnvironment: 'node',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/test/**/*e2e-spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
};

const config: Config = {
  projects: [unitConfig, e2eConfig],
};

export default config;
