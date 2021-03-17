module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/next-terminal-ssh/'
    : '/',
  chainWebpack: config => {
    const svgRule = config.module.rule('svg');

    svgRule.uses.clear();

    svgRule
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
    config.module.rule('md')
      .test(/\.md/)
      .use('vue-loader')
      .loader('vue-loader')
      .end()
      .use('vue-markdown-loader')
      .loader('vue-markdown-loader/lib/markdown-compiler')
      .options({
        raw: true
      })
  },
  css: {
    loaderOptions: {
      sass: {
        prependData: `@import "~@/assets/scss/variables.scss";`
      }
    }
  },
  devServer: {
    host: '0.0.0.0'
  }
}