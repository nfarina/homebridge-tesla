import babel from "rollup-plugin-babel";
import resolve from "rollup-plugin-node-resolve";

const extensions = [".ts", ".js"];

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "cjs",
  },
  plugins: [
    resolve({
      jsnext: true,
      extensions,
    }),
    babel({
      extensions,
      exclude: "node_modules/**", // only transpile our source code
    }),
  ],
};
