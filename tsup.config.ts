import {defineConfig} from 'tsup';

const tsupConfig = defineConfig({
  name: '@koa/body-parser',
  entry: ['src/*.ts'],
  target: 'esnext',
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  platform: 'node',
});

export default tsupConfig;
