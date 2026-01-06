const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (webpackConfig) => {
      // Keep build stable: remove ForkTsChecker if present
      webpackConfig.plugins = (webpackConfig.plugins || []).filter(
        (p) => !(p && p.constructor && p.constructor.name === "ForkTsCheckerWebpackPlugin")
      );
      return webpackConfig;
    },
  },
};
