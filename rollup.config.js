import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'main.ts',
  output: {
    file: 'main.js',
    format: 'cjs',
    sourcemap: true,
    exports: 'default',
  },
  external: ['obsidian', '@codemirror/view', '@codemirror/state'], // <- @codemirror/language を外す
  plugins: [
    typescript(),
  ],
};
