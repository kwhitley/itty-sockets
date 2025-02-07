import fs from 'fs'

const transformCode = code => code
  .replace(/^const\s+(\w+)\s*=/, 'window.getRoom=')
  .replace(/;export\s*{[^}]+};?\s*$/, ';')

const snippet = fs.readFileSync('dist/getRoom.snippet.js', 'utf-8')
const transformed = transformCode(snippet).trim()

// Write transformed code to both files
fs.writeFileSync('dist/getRoom.snippet.js', transformed)

const readme = fs.readFileSync('README.md', 'utf-8')
const newReadme = readme.replace(
  /(<!-- BEGIN SNIPPET -->[\r\n]+```(?:js|ts)[\r\n]).*?([\r\n]```[\r\n]+<!-- END SNIPPET -->)/s,
  `$1${transformed}$2`
)

fs.writeFileSync('README.md', newReadme) 