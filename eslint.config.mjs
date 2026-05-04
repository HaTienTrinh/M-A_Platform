import nextVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'supabase/functions/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      'react-hooks/incompatible-library': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
    },
  },
]

export default eslintConfig
