module.exports = {
    env: {
        browser: true,
        es6: true,
        jest: true,
    },
    extends: [
        'airbnb',
        'plugin:prettier/recommended',
        'prettier/@typescript-eslint',
        'prettier',
        'prettier/react',
        'prettier/@typescript-eslint',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/typescript',
    ],
    plugins: [
        '@typescript-eslint',
        'react',
        'react-hooks',
        'prettier',
        'unused-imports',
        '@typescript-eslint/tslint',
        'prefer-arrow',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: 'tsconfig.json',
    },
    settings: {
        'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
        },
    },
    rules: {
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'import/no-cycle': 'error',
        'react/prop-types': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/anchor-is-valid': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/media-has-caption': 'off',
        'jsx-a11y/no-autofocus': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'jsx-a11y/control-has-associated-label': 'off',
        'import/prefer-default-export': 'off',
        'no-unused-expressions': [
            'warn',
            {
                allowShortCircuit: true,
            },
        ],
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'unused-imports/no-unused-imports': 'error',
        'no-underscore-dangle': 'warn',
        'no-use-before-define': 'off',
        'react/require-default-props': 'off',
        'react/prefer-stateless-function': 'warn',
        'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }],
        'react/jsx-props-no-spreading': 'off',
        'react/no-array-index-key': 'off',
        'react/jsx-closing-bracket-location': 'off',
        'react/jsx-one-expression-per-line': 'off',
        'react/no-danger': 'error',
        'react/destructuring-assignment': 'off',
        'react-hooks/exhaustive-deps': 'error',
        'max-params': ['error', 3],
        'prefer-arrow/prefer-arrow-functions': [
            'error',
            {
                disallowPrototype: true,
                singleReturnOnly: false,
                classPropertiesAllowed: false,
            },
        ],
        'global-require': 'off',
        // 'object-curly-spacing': 1,
        'operator-linebreak': 'off',
        'no-empty-function': ['error', { allow: ['constructors'] }],
        'no-useless-constructor': 'off',
        'no-param-reassign': ['warn', { props: false }],
        'no-prototype-builtins': 'warn',
        'no-nested-ternary': 'error',
        'no-eq-null': 'warn',
        'no-shadow': 'off',
        'no-restricted-imports': [
            'error',
            {
                paths: [
                    {
                        name: '@/store/api/websocket/signalr',
                        importNames: ['initialiseSignalRClientMethods'],
                        message: 'This method should only be called in index.tsx',
                    },
                ],
            },
        ],
        camelcase: 'warn',
        curly: ['error', 'all'],
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/ban-ts-comment': 'error',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/member-ordering': 'off',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-useless-constructor': 'error',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/prefer-literal-enum-member': 'off',
        '@typescript-eslint/no-use-before-define': ['off'],
        '@typescript-eslint/explicit-member-accessibility': [
            'error',
            {
                accessibility: 'explicit',
                overrides: {
                    accessors: 'explicit',
                    constructors: 'no-public',
                    methods: 'explicit',
                    properties: 'explicit',
                    parameterProperties: 'explicit',
                },
            },
        ],
        'prettier/prettier': [
            'error',
            {
                semi: true,
                singleQuote: true,
                trailingComma: 'all',
                printWidth: 120,
                tabWidth: 4,
                endOfLine: 'auto',
            },
        ],
        '@typescript-eslint/tslint/config': [
            'error',
            {
                rulesDirectory: ['node_modules/tslint-immutable/rules'],
                rules: {
                    'readonly-keyword': ['off'],
                    'readonly-array': [true, { 'ignore-prefix': 'mutable' }],
                    'no-array-mutation': [true, 'ignore-new-array', { 'ignore-prefix': 'mutable' }],
                    'ordered-imports': [
                        true,
                        {
                            'import-sources-order': 'lowercase-first',
                            'module-source-path': 'full',
                            'grouped-imports': true,
                            groups: [
                                {
                                    match: '^react',
                                    order: 1,
                                },
                                {
                                    name: 'Root resources',
                                    match: '^@/.*(gif)$',
                                    order: 99,
                                },
                                {
                                    name: 'Root',
                                    match: '^@/',
                                    order: 98,
                                },
                                {
                                    name: 'Parent dir',
                                    match: '^[.][.]',
                                    order: 100,
                                },
                                {
                                    name: 'Styles',
                                    match: '(css|less)$',
                                    order: 120,
                                },
                                {
                                    name: 'Current dir',
                                    match: '^[.]',
                                    order: 110,
                                },
                                {
                                    match: '^[^\\.]',
                                    order: 10,
                                },
                            ],
                        },
                    ],
                },
            },
        ],
        'react/jsx-key': 'error',
    },
    overrides: [
        {
            files: ['*test.ts', '*test.tsx', '*spec.ts'],
            rules: {
                'no-console': 'off',
                'import/no-extraneous-dependencies': 'off',
            },
        },
        {
            files: ['./src/store/sagas//*.ts'],
            rules: {
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: ['@/store/store'],
                    },
                ],
            },
        },
        {
            files: ['./src/store/selectors//*.ts'],
            rules: {
                'max-params': ['off'],
            },
        },
        {
            files: ['src/index.tsx'],
            rules: {
                'no-restricted-imports': [
                    'off',

                    {
                        patterns: ['@/store/api/websocket/signalr'],
                    },
                ],
            },
        },
    ],
};
