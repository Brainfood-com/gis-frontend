const objectPath = require('object-path')
const fs = require('fs')
var path = require('path');
var escapeRegExp = require('lodash/escapeRegExp')
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CompressionPlugin = require('compression-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

var devOverrides = {
    'lodash-es': 'lodash',
    'lodash.memoize': 'lodash/memoize',
    'lodash.uniq': 'lodash/uniq',
    'lodash.camelcase': 'lodash/camelcase',
    'material-ui': 'material-ui/es',
    webworkify: 'webworkify-webpack-dropin',
    'react-material-tags': 'react-material-tags/src/tags.js',
}

let plugins = [
  new webpack.DefinePlugin({
    'process.env.GIS_GA_ID': JSON.stringify(process.env['GIS_GA_ID']),
  }),
  new HtmlWebpackPlugin({
    template: 'src/index.html',
  }),
  new BundleAnalyzerPlugin({
    openAnalyzer: false,
    analyzerMode: 'static',
    reportFilename: 'bundle-report.html',
    generateStatsFile: true,
    statsFilename: 'bundle-stats.json',
  }),
  new CompressionPlugin({
    asset: "[path].gz[query]",
    algorithm: "gzip",
    test: /\.js$|\.css$|\.html$/,
    threshold: 10240,
    minRatio: 0.8,
  }),
]

console.log('GIS_BUILD_TARGET', process.env.GIS_BUILD_TARGET)
console.log('VHOST_SUFFIX', process.env.VHOST_SUFFIX)
console.log('GIS_GA_ID', process.env.GIS_GA_ID)
const gisHostBase = process.env.GIS_BUILD_TARGET ? process.env['VHOST_SUFFIX'] || 'gis.localhost' : undefined
const gisHost = gisHostBase ? 'www.' + gisHostBase : undefined

if (gisHost) {
    console.log('Using ' + gisHost + ' for deployment in ' + process.env.GIS_BUILD_TARGET)
}

module.exports = {
    mode: 'development',
    entry: ['babel-polyfill', 'whatwg-fetch', './src/index.js'],
    module: {
        rules: [
            {
                test: /node_modules\/(react-leaflet-iiif-viewer|relider)\/.*\.jsx?$/,
                loader: 'babel-loader',
            }, {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            }, {
                test: /\.json$/,
                loader: 'json-loader'
            }, {
                test: /\.css$/,
                use: [
                    "style-loader",
                    "css-loader"
                ]
            }, {
                test: /\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader"
                ]
            },
            { test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/octet-stream' },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
            { test: /\.png(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
            { test: /\.gif(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
            {
                test: /\.svg$/,
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                oneOf: [
                    {
                        issuer: /\.jsx?$/,
                        use: [
                            {
                                loader: 'babel-loader',
                                query: {
                                    presets: ['react', 'es2015', 'stage-2'],
                                },
                            },
                            {
                                loader: 'react-svg-loader',
                                options: {
                                    svgo: {
                                        plugins: [
                                            {inlineStyles: {onlyMatchedOnce: false}},
                                            {convertColors: {currentColor: '#fff'}},
                                            {removeUselessStrokeAndFill: true},
                                            {convertShapeToPath: false},
                                            {convertStyleToAttrs: true},
                                        ],
                                    },
                                    jsx: true,
                                },
                            },
                        ],
                    },
                    {
                        loader: 'url-loader?limit=10000&mimetype=image/svg+xml',
                    },
                ],
            },
        ]
    },
    resolve: {
        alias: devOverrides,
        extensions: ['*', '.js', '.jsx', '.css']
    },
    plugins: plugins,
    output: { 
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/',
        chunkFilename: '[name].[id].[chunkhash].bundle.js',
        filename: '[name].[id].[hash].entry.js',
    },
    devtool: 'sourcemap',
    watchOptions: {
      //poll: true,
    },
    devServer: {
      compress: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      disableHostCheck: true,
      historyApiFallback: {
        index: '/index.html'
      },
      historyApiFallback: true,
      contentBase: 'dist',
      public: gisHost || '',
      host: '0.0.0.0',
      port: 8080,
    },
}
