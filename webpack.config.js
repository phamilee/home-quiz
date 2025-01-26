module.exports = {
  // ... other webpack config options ...
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [/@mediapipe/]
      }
    ]
  }
}; 