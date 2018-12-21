const path = require("path");

module.exports = {
  entry: "./src/index.ts",
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, 'dist'),
    library: 'Planner',
    libraryTarget: 'umd',
    libraryExport: 'default',
  }
};