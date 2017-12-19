var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var GitRevisionPlugin = require('git-revision-webpack-plugin');
var WebpackShellPlugin = require('webpack-shell-plugin');
var pkg = require('./package.json');

var gitPlugin = new GitRevisionPlugin();
var bundleCss = ('production' === process.env.NODE_ENV) ? 'css/main-[hash:6].css' : 'css/main.css';
var pluginsWebpack = [
    new ExtractTextPlugin(bundleCss),
    new HtmlWebpackPlugin({
        filename: '../templates/index.html',
        template: 'shadowcraft_ui/templates/webpack-index.ejs',
        cache: true,
        inject: false
    }),
    new webpack.DefinePlugin({
        __COMMIT_HASH__: JSON.stringify(gitPlugin.version())
    }),
    new WebpackShellPlugin({
        // This will rm anything except the last four bundles and CSS builds so that we
        // don't fill up the disk full of crap.
        onBuildStart: ['ls -1t shadowcraft_ui/static/bundle-*.js | tail -n +5 | xargs rm -f',
                       'ls -1t shadowcraft_ui/static/css/main-*.css | tail -n +5 | xargs rm -f']
    })
];

if ('production' === process.env.NODE_ENV) {
    var prodEnv = [
        new webpack.optimize.OccurrenceOrderPlugin(true),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.optimize.DedupePlugin()
    ];

    pluginsWebpack.concat(pluginsWebpack, prodEnv);
}

module.exports = {
    entry: './shadowcraft_ui/js/app.js',
    output: {
        path: __dirname + '/shadowcraft_ui/static',
        filename: ('production' === process.env.NODE_ENV) ? 'bundle-[hash:6].js' : 'bundle.js'
    },
    devtool: 'inline-source-map',
    module: {
        loaders: [
            {
                test: /\.js?$/,
                loader: 'babel',
                exclude: /node_modules/
            },
            {
                test: /\.sass$/,
                loader: ExtractTextPlugin.extract('css!sass')
            },
        ]
    },
    plugins: pluginsWebpack
};
