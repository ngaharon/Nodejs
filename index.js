const express = require('express')
const Datastore = require('nedb-promises')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const config = require('./config')
//initialize express
const app = express()

// configure body parser
app.use(express.json())

const user = Datastore.create('Users.db')
const userRefreshTokens = Datastore.create('UserRefreshTokens.db')
const userInvalidTokens = Datastore.create('UserInvalidTokens.db')

app.get('/', (req, res) => {
    res.send('REST API Authentication and Authorization')
})

app.post('/api/auth/register', async (req, res) => {
   try {
      const { name, email, password, role } = req.body

      if ( !name || !email || !password ) {
         return res.status(422).json({ message: 'Please fill in all fields (name, email and password)'})
      }

      if (await user.findOne({ email })) {
         return res.status(409).json({ message: 'Email already exits'})
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await user.insert({
         name,
         email,
         password: hashedPassword,
         role: role ?? 'member'
      })

      return res.status(201).json({ 
         message: 'User registered successfully',
         id: newUser._id
      })


   } catch (error) {
      return res.status(500).json({ message: error.message })
   }
})

app.post('/api/auth/login', async (req, res) => {
   try {
      const { email, password } = req.body

      if ( !email || !password) {
         return res.status(422).json({ message: 'Please fill in all fields (email and password)'})
      }

      const user = await user.findOne({ email })

      if (!user) {
         return res.status(401).json({ message: 'Email or Password is invalid' })
      }

      const passwordMatch = await bcrypt.compare(password, user.password)

      if (!passwordMatch) {
         return res.status(401).json({ message: 'Email or Password is invalid' }) 
      }

      const accessToken = jwt.sign({ userId: user._id }, config.accessTokenSecret, { subject: 'accessApi', expiresIn: config.accessTokenExpiresIn })

      const refreshToken = jwt.sign({ userId: user._id }, config.refreshTokenSecret, { subject: 'refreshToken', expiresIn: config.refreshTokenExpiresIn })

      await userRefreshTokens.insert({
         refreshToken,
         userId: user._id
      })

      return res.status(200).json({
         id: user._id,
         name: user.name,
         email: user.email,
         accessToken: accessToken,
         refreshToken
      })

   } catch (error) {
      return res.status(500).json({ message: error.message })
   }
})

app.post('/api/auth/refresh-token', async (req, res) => {
   try {
      const { refreshToken } = req.body

      if ( !refreshToken ) {
         return res.status(401).json({ message: 'Refresh token not found' })
      }

      const decodedRefreshToken = jwt.verify(refreshToken, config.refreshTokenSecret)

      const userRefreshToken = await userRefreshTokens.findOne({ refreshToken, userId: decodedRefreshToken.userId })

      if ( !userRefreshToken) {
         return res.status(401).json({ message: 'Refresh token invalid or expired'})
      }

      await userRefreshTokens.remove({ _id: userRefreshToken._id })
      await userRefreshTokens.compactDatafile()


      const accessToken = jwt.sign({ userId: decodedRefreshToken.userId }, config.accessTokenSecret, { subject: 'accessApi', expiresIn: '1h' })

      const newRefreshToken = jwt.sign({ userId: decodedRefreshToken.userId }, config.refreshTokenSecret, { subject: 'refreshToken', expiresIn: '1w' })

      await userRefreshTokens.insert({
         refreshToken: newRefreshToken,
         userId: decodedRefreshToken.userId
      })

      return res.status(200).json({
         accessToken,
         refreshToken: newRefreshToken
      })

   } catch (error) {
      if  (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
         return res.status(401).json({ message: 'Refresh token invalid or expired'})
      }

      return res.status(500).json({ message: error.message })
   }
})



app.get('/api/auth/logout', ensureAutheniticated, async (req, res) => {
   try {
      await userRefreshTokens.removeMany({ userId: req.user.id })
      await userRefreshTokens.compactDatafile()

      await userInvalidTokens.insert({
         accessToken: req.accessToken.value,
         userId: req.user.id,
         expirationTime: req.accessToken.exp
      })

      return res.status(204).send()

   } catch (error) {
      return res.status(500).json({ message: error.message })
   }
})


app.get('/api/users/current', ensureAutheniticated, async (req, res) => {

   try {
      const user = await user.findOne({ _id: req.user.id })

      return res.status(200).json({
         id: user._id,
         name: user.name,
         email: user.email
      })

   } catch {
      return res.status(500).json({ message: error.message })
   }

})

app.get('/api/admin', ensureAutheniticated, authorize(['admin']), (req, res) => {
   return res.status(200).json({ message: 'Only admins can access this route'})
})

app.get('/api/moderator', ensureAutheniticated, authorize(['admin', 'moderator']), (req, res) => {
   return res.status(200).json({ message: 'Only admins and moderators can access this route!'})
})
async function ensureAutheniticated(req, res, next) {
   const accessToken = req.headers.authourization

   if (!accessToken) {
      return req.status(401).json({ message: 'Access token not found' })

   }

   if (await userInvalidTokens.findOne({ accessToken })) {
      return res.status(401).json({ message: 'Access token invalid', code: 'AccessTokenInvalid' })
   }

   try {
      const decodeAccessToken = jwt.verify(accessToken, config.accessTokenSecret)

      req.accessToken = { value: accessToken, exp: decodeAccessToken.exp }

      req.user = { id: decodeAccessToken.userId }

      next()

   } catch (error) {

      if (error instanceof jwt.TokenExpiredError) {
         return res.status(401).json({ message: 'Access token expired', code: 'AccessTokenExpired' })
      } else if (error instanceof jwt.JsonWebTokenError) {
         return res.status(401).json({ message: 'Access token invalid', code: 'AccessTokenInvalid' })
      } else {
         return res.status(500).json({ message: error.message })
      }
      
   }
   return res.status(401).json({ message: 'Access token invalid or expired'})
}

function authorize(roles = []) {
   return async function (req, res, next) {
      const user = await user.findOne({ _id: req.user.id })

      if (!user || !roles.includes(user.role)) {
         return req.status(403).json({ message: 'Access denied' })
      }

      next()
   }
}
app.listen(3000, () => console.log('Server started on port 3000'))