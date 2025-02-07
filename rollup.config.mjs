import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import bundleSize from 'rollup-plugin-bundle-size'
import copy from 'rollup-plugin-copy'

export default [
  {
    input: './src/getRoom.ts',
    output: [
      {
        format: 'esm',
        file: './dist/getRoom.mjs',
        sourcemap: false,
      },
      {
        format: 'cjs',
        file: './dist/getRoom.js',
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
    input: 'src/getRoom.ts',
    output: {
      file: 'dist/getRoom.snippet.js',
      format: 'esm',
      name: 'getRoom'
    },
    plugins: [
      typescript(),
      terser()
    ]
  }
]
