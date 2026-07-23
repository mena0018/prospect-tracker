import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      '.output',
      '.nitro',
      '.vercel',
      'dist',
      'src/routeTree.gen.ts',
      'src/i18n/paraglide',
      'drizzle/meta'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Global language options + unused-vars override (all TS files)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },

  // React (JSX/TSX only)
  {
    files: ['**/*.tsx'],
    ...react.configs.flat.recommended,
    settings: { react: { version: '19' } },
    plugins: {
      ...react.configs.flat.recommended.plugins,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': 'warn',
      'react/no-unescaped-entities': 'off'
    }
  },

  // Disable setState in useEffect for theme-provider.tsx (shadcn pattern).
  {
    files: ['src/components/theme/theme-provider.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off'
    }
  },

  prettier
)
