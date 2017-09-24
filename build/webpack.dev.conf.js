const path = require('path');
const utils = require('./utils');
const webpack = require('webpack');
const config = require('../config');

const glob = require('glob');

// webpack-merge是一个可以合并数组和对象的插件
const merge = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.conf');

// html-webpack-plugin用于将webpack编译打包后的产品文件注入到html模板中
// 即自动在index.html里面加上<link>和<script>标签引用webpack打包后的文件
const HtmlWebpackPlugin = require('html-webpack-plugin');

// friendly-errors-webpack-plugin用于更友好地输出webpack的警告、错误等信息
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

// add hot-reload related code to entry chunks
// 给每个入口页面(应用)加上dev-client，用于跟dev-server的热重载插件通信，实现热更新
Object.keys(baseWebpackConfig.entry).forEach(function (name) {
  baseWebpackConfig.entry[name] = ['./build/dev-client'].concat(baseWebpackConfig.entry[name])
});

module.exports = merge(baseWebpackConfig, {
  module: {
    // 样式文件的处理规则，对css/sass/scss等不同内容使用相应的styleLoaders
    // 由utils配置出各种类型的预处理语言所需要使用的loader，例如sass需要使用sass-loader
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
  },
  // cheap-module-eval-source-map is faster for development
  // 使用这种source-map更快
  devtool: '#cheap-module-eval-source-map',

  // webpack插件
  plugins: [
    new webpack.DefinePlugin({
      'process.env': config.dev.env
    }),
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    // 开启webpack热更新功能
    new webpack.HotModuleReplacementPlugin(),
    // webpack编译过程中出错的时候跳过报错阶段，不会阻塞编译，在编译结束后报错
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    // 自动将依赖注入html模板，并输出最终的html文件到目标文件夹
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    }),
    new FriendlyErrorsPlugin()
  ]
});

function getEntry(globPath) {
  let entries = {},basename,tmp,pathname;
  if (typeof (globPath) !== "object") {
    globPath = [globPath]
  }
  globPath.forEach((itemPath) => {
    glob.sync(itemPath).forEach(function (entry) {
      basename = path.basename(entry, path.extname(entry));
      if (entry.split('/').length > 4) {
        tmp = entry.split('/').splice(-3);
        pathname = tmp.splice(0, 1) + '/' + basename; // 正确输出js和html的路径
        entries[pathname] = entry;
      } else {
        entries[basename] = entry;
      }
    });
  });
  return entries;
}

/**
 * 方式2，直接从路径modules/往后截取
 * @param globPath
 * @returns {{}}
 */
function getEntry2(globPath) {
  let entries = {},basename,pathname,fileArray;
  if (typeof (globPath) !== "object") {
    globPath = [globPath]
  }
  //ES 6的写法
  globPath.forEach((itemPath) => {
    glob.sync(itemPath).forEach(function (entry) {
      basename = path.basename(entry, path.extname(entry));
      fileArray = entry.split('/');
      if (fileArray.length > 4) {
        fileArray.splice(0,3);//删除fileArray前三个 即./src/modules/
        fileArray.pop();//删除fileArray最后一个 即文件
        pathname = fileArray.join("/");//用join方法通过"/"拼接成字符串
        entries[pathname] = entry;
      } else {
        entries[basename] = entry;
      }
    });
  });
  console.log(entries);
  return entries;
}

let pages = getEntry2('./src/modules/**/*.html');

for (let pathname in pages){
  // 配置生成的html文件，定义路径等
  let conf = {
    filename: pathname + '.html',
    template: pages[pathname],//模板路径
    inject: true,//js插入位置
    minify: {
      //removeComments: true,
      //collapseWhitespace: true,
      //removeAttributeQuotes: true
    },
    chunksSortMode: 'dependency'
  };

  if(pathname in module.exports.entry){
    conf.chunks = ['manifest','vendor',pathname];
    conf.hash = true;
  }

  module.exports.plugins.push(new HtmlWebpackPlugin(conf));
}
