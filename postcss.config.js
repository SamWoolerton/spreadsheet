// per docs https://tailwindcss.com/docs/controlling-file-size
const purgecss = require("@fullhuman/postcss-purgecss")({
  content: ["./public/index.html", "./src/**/*.vue"],

  // these are dynamically put together from formatting tree
  whitelist: ["text-left", "text-center", "text-right"],

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
