import pkg from "./package.json";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import nodePolyfills from "rollup-plugin-node-polyfills";

export default [
  // browser-friendly UMD build
  {
    input: "src/index.js",
    output: {
      name: "millicast",
      file: pkg.browser,
      format: "umd",
      globals: {
        events: "EventEmmiter",
      },
    },
    plugins: [nodePolyfills(), nodeResolve(), commonjs()],
  },

  {
    input: "src/index.js",
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" },
    ],
    plugins: [nodePolyfills(), nodeResolve(), commonjs()],
  },
];
