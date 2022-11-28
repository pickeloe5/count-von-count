const path = require('path')
const fs = require('fs')
const express = require('express')

const CONFIG = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../config.json')))

const data = {
  path: path.join(__dirname, '../data.json'),
  $: {},
  count(key) {
    if (!(key in this.$))
      return this.$[key] = 1
    return ++this.$[key]
  },
  async save() {
    await this.write()
    return this.$
  },
  async load() {
    let $ = {}
    if (await this.exists())
      $ = await this.read()
    return this.$ = $
  },
  async exists() {
    return await new Promise((resolve, reject) => {
      fs.exists(this.path, exists => {resolve(exists)})
    })
  },
  async read() {
    return await new Promise((resolve, reject) => {
      fs.readFile(this.path, (e, buffer) => {
        if (e) {
          reject(e)
          return;
        }
        resolve(JSON.parse(buffer.toString()))
      })
    })
  },
  async write() {
    return await new Promise((resolve, reject) => {
      fs.writeFile(this.path, JSON.stringify(this.$), e => {
        if (e) {
          reject(e)
          return;
        }
        resolve()
      })
    })
  }
}

const app = express()

app.get('/keys/:key', (req, res) => {
  data.count(req.params.key)
  res.status(200).end()
})

app.use((req, res, next) => {
  res.status(404).end()})

data.load().then(() => {
  process.on('SIGINT', () => {
    data.save().then(() => {process.exit(0)})})
  setInterval(() => {data.save()}, 60000)
  app.listen(CONFIG.port, () => {
    console.log(`Listening on port: ${CONFIG.port}...`)
  })
})
