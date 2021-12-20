const path = require('path')

module.exports = {
  entry: ['babel-polyfill', './src/js/index.jsx'],
  output: {
    path: path.resolve('.', 'build'),
    filename: 'imbi.js'
  },
  devServer: {
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  performance: { hints: false },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.(svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'images/'
        }
      },
      {
        test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'fonts/'
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  watchOptions: {
    aggregateTimeout: 1000,
    ignored: 'node_modules/**',
    poll: 1000
  }
}
