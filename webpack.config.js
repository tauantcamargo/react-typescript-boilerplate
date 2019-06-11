const { join, resolve }     = require('path')
const webpack               = require('webpack')
const ExtractTextPlugin     = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin     = require('html-webpack-plugin')
const UglifyJsPlugin        = require('uglifyjs-webpack-plugin')
const OpenBrowserPlugin     = require('open-browser-webpack-plugin')
const koutoSwiss            = require('kouto-swiss')
const jeet                  = require('jeet')
const rupture               = require('rupture')

const PROD                  = process.env.NODE_ENV ? process.env.NODE_ENV === 'production' && true : false

const webpackConfig         = {
  mode: PROD ? 'production' : 'development',
  devtool: PROD ? 'source-map' : 'cheap-module-source-map',

  entry: [
    '@babel/polyfill',
    'webpack-dev-server/client?http://localhost:8080', // WebpackDevServer host and port
    'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
    'react-hot-loader/patch', // RHL patch
    './main.tsx'
  ],

  context: resolve(__dirname, 'app'),

  devServer: {
    hot: true,
    contentBase: resolve(__dirname, 'build'),
    historyApiFallback: true,
    publicPath: '/'
  },

  resolve: {
    alias: {
      '@components': resolve('app/components'),
      '@containers': resolve('app/containers'),
      '@core': resolve('app/core'),
      '@assets': resolve('app/assets'),
      '@routes': resolve('app/core/routes')
    },
    extensions: ['*', '.ts', '.tsx', '.json']
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loaders: [
          'ts-loader'
        ]
      },
      {
        test: /\.(styl|component.styl|container.styl)$/,
        exclude: /node_modules/,
        use: PROD ? ['css-hot-loader'].concat(ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            'style-loader',
            'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
            {
              loader: 'stylus-loader',
              options: {
                use: [koutoSwiss(), jeet(), rupture()]
              }
            }
          ]
        })) : [
          'style-loader',
          'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
          {
            loader: 'stylus-loader',
            options: {
              use: [koutoSwiss(), jeet(), rupture()]
            }
          }
        ]
      },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
      { test: /\.(png|jpg|gif)$/, loader: 'url-loader?limit=8192' }
    ]
  }
}

const commonPlugins         = [
  new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify(process.env.NODE_ENV) } }),
  new webpack.optimize.ModuleConcatenationPlugin(),
  new HtmlWebpackPlugin({ // Create HTML file that includes references to bundled CSS and JS.
    title: 'React App',
    template: resolve(__dirname, '.ejs'),
    minify: {
      removeComments: true,
      collapseWhitespace: true
    },
    inject: true
  })
]

if (PROD) {
  webpackConfig.output = {
    filename: '[name].[chunkhash].js',
    chunkFilename: '[name].[chunkhash].js',
    path: join(__dirname, 'dist'),
    publicPath: '/'
  }

  webpackConfig.optimization = {
    runtimeChunk: false,
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    },
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      })
    ]
  }

  webpackConfig.plugins = [
    ...commonPlugins,
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    })
  ]
} else {
  webpackConfig.output = {
    filename: 'bundle.js',
    path: join(__dirname, 'dist'),
    publicPath: '/',
    devtoolModuleFilenameTemplate: '/[absolute-resource-path]'
  }

  webpackConfig.plugins = [
    ...commonPlugins,
    new webpack.LoaderOptionsPlugin({
      test: /\.jsx?$/,
      options: {
        eslint: {
          configFile: resolve(__dirname, '.eslintrc'),
          cache: false,
        }
      },
    }),
    new OpenBrowserPlugin({ url: 'http://localhost:8080' }),
    new webpack.HotModuleReplacementPlugin()
  ]
}

module.exports = webpackConfig