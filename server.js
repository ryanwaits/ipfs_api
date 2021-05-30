const express = require('express')
const morgan = require("morgan")
const { createProxyMiddleware, fixRequestBody, responseInterceptor } = require('http-proxy-middleware')
const cors = require('cors')
const app = express()

const bcrypt = require('bcrypt')
const generateApiKey = require('generate-api-key')

// Configuration
const PORT = 9000
const HOST = "localhost"
const API_SERVICE_URL = "http://localhost:5001"

// Database Setup
const {Sequelize, DataTypes} = require('sequelize')
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
})

sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.')
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

const User = sequelize.define('users', { username: DataTypes.TEXT, password: DataTypes.STRING })
const Key = sequelize.define('keys', { userId: DataTypes.INTEGER, token: DataTypes.STRING, active: DataTypes.BOOLEAN })
const Request = sequelize.define('requests', { keyId: DataTypes.INTEGER, url: DataTypes.STRING, message: DataTypes.TEXT })
User.hasMany(Key)
Key.hasMany(Request)
Request.belongsTo(Key)

sequelize.sync({ force: true })
  .then(async () => {
    const hash = await bcrypt.hash("12345", 10)
    const user = await User.create({ 
      username: 'admin', 
      password: hash
    })
    Key.create({ 
      userId: user.id,
      token: generateApiKey({ method: 'string', length: 20 }), 
      active: true 
    })
    console.log(`Database & tables createsd!`)
  })

// CORS
app.use(cors())

// Parsing application/json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/info', (req, res, next) => {
  res.send('This is a proxy service which proxies to the IPFS Public API.')
})

app.post(`/login`, cors(), async function(req, res) {
  const username = req.body.username
  const password = req.body.password
  const user = await User.findOne({ where: { username: username}})
  const result = await bcrypt.compare(req.body.password, user.password)
  if (result) {
    res.json({statusCode: res.statusCode})
  } else {
    res.send("Username or password is incorrect")
    res.redirect('/')
  }
})

app.get('/users', cors(), async function(req, res) {
  const users = await User.findAll({include: [{model: Key, as: "keys"}], order: [['keys', 'createdAt', 'DESC']]})
  res.json(users)
})

app.get('/users/:userId/keys', cors(), async function(req, res) {
  try {
    const keys = await Key.findAll({ where: {userId: req.params.userId}, order: [['createdAt', 'DESC']]})
    res.json(keys)
  } catch (error) {
    console.log({error})
  }
})

app.post(`/users/:userId/keys`, cors(), async function(req, res) {
  try {
    const keys = await Key.findAll({ where: {userId: req.params.userId}, order: [['createdAt', 'DESC']]})
    const latestKey = keys[0]
    if (latestKey) {
      latestKey.active = false
      await latestKey.save()
      const key = await Key.create({userId: req.params.userId, token: generateApiKey({ method: 'string', length: 20 }), active: true})
      const request = await Request.create({keyId: key.id, url: req.url, message: `\n\n ⚡️ New API Key generated: ${key.token} \n\n ❌ Old API Key revoked: ${latestKey.token} \n\n\n`})
      console.log(`⚡️ New API Key generated: ${key.token}`)
      console.log(`❌ Old API Key revoked: ${latestKey.token}`)
      res.json(key)
    }
  } catch (error) {
    res.json(error)
  }
})

app.patch(`/users/:userId/keys/:keyId`, cors(), async function(req, res) {
  try {
    const key = await Key.findByPk(req.params.keyId)
    if (key) {
      key.active = !key.active
      await key.save()
      res.json(key)
    }
  } catch (error) {
    res.json(error)
  }
})

app.get('/requests', cors(), async function(req, res) {
  const requests = await Request.findAll({include: Key, order: [['createdAt', 'DESC']]})
  res.json({data: requests})
})

// Set up proxy server
app.use('/ipfs', async (req, res, next) => {
  if (req.headers.authorization) {
    const keys = await Key.findAll({ where: {active: true, token: req.headers.authorization}})
    const apiKey = keys.find(key => key.token === req.headers.authorization)
    if (keys.length > 0) {
      if (apiKey) {
        const key = await Key.findOne({ where: { token: apiKey.token }})
        console.log(`⚡️ API Key ${apiKey} is good!`)
        const request = await Request.create({keyId: key.id, url: req.url, message: `\n\n ✅ admin sent a successful request to ${req.url} with API token ${apiKey.token} \n\n\n`})
        console.log(`✅ Logged ${request.url} from ${key.token}`)
        next()
      } else {
        next()
      }
    } else {
      const key = await Key.findOne({ where: {token: req.headers.authorization}})
      const request = await Request.create({keyId: key.id, url: req.url, message: `\n\n ❌ admin sent an unsuccessful request to ${req.url} with a bad token \n\n\n`})
      console.log(`❌ Logged ${request.url} from ${key.token}`)
      res.send(401, "❌ Unauthorized")
    }
  } else {
    console.log(`❌ Authorization Header Missing`)
  }
})

const options = {
  target: API_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
      [`^/ipfs`]: '',
  }
}

const ipfsProxy = createProxyMiddleware(options)

app.use('/ipfs', cors(), ipfsProxy)

app.listen(PORT, HOST, () => {
  console.log(`Starting Proxy at ${HOST}:${PORT}`)
})

// Logging
app.use(morgan('dev'))