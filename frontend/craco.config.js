module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.plugins = (webpackConfig.plugins || []).filter(
        (p) => !(p && p.constructor && p.constructor.name === "ForkTsCheckerWebpackPlugin")
      );
      return webpackConfig;
    },
  },
};
