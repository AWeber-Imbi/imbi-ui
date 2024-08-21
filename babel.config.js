module.exports = function babel(api) {
  const BABEL_ENV = api.env()
  const presets = ['@babel/preset-env', '@babel/preset-react']
  const plugins = [
    'babel-plugin-dynamic-import-webpack',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-syntax-dynamic-import',
    'transform-regenerator'
  ]
  if (BABEL_ENV === 'development') {
    plugins.push('react-refresh/babel')
  }
  return {
    presets,
    plugins
  }
}
