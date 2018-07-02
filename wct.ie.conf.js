module.exports = {
  verbose: true,
  persistent: true,
  plugins: {
    local: {
      skipSeleniumInstall: false,
      browsers: ["ie"]
    },
    sauce: false
  }
}
