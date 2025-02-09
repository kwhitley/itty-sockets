import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import bundleSize from 'rollup-plugin-bundle-size'
import copy from 'rollup-plugin-copy'

export default [
  {
    input: './src/connect.ts',
    output: [
      {
        format: 'esm',
        file: './dist/connect.mjs',
        sourcemap: false,
      },
      {
        format: 'cjs',
        file: './dist/connect.js',
        sourcemap: false,
      },
    ],
    plugins: [
      typescript({ sourceMap: false }),
      terser(),
      bundleSize(),
      copy({
        targets: [
          {
            src: ['LICENSE'],
            dest: 'dist',
          },
        ],
      }),
    ],
  },
  {
    input: 'src/connect.ts',
    output: {
      file: 'dist/connect.snippet.js',
      format: 'esm',
      name: 'connect'
    },
    plugins: [
      typescript(),
      terser()
    ]
  }
]
