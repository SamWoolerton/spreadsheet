// per docs https://tailwindcss.com/docs/controlling-file-size
const purgecss = require("@fullhuman/postcss-purgecss")({
  content: ["./src/**/*.vue"],

  // Include any special characters you're using in this regular expression
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
})

module.exports = {
  plugins: [
    require("tailwindcss"),
    require("autoprefixer"),
    ...(process.env.NODE_ENV === "production" ? [purgecss] : []),
  ],
}
