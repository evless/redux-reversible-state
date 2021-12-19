import { Config } from '@jest/types'

const config: Config.InitialOptions = {
    verbose: true,
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    testMatch: ['**/__tests__/**/*.test.+(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
};

export default config;
