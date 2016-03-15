module.exports = {
  output: {
    library: 'outdatedBrowserRework'
  },
  module: {
    loaders: [
      {
        test: /\.json$/, loader: "json"
      }
    ]
  }
};
