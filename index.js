const express = require('express')
const Datastore = require('nedb-promises')
const bcrypt = require('bcryptjs')
//initialize express
const app = express()

// configure body parser
app.use(express.json())

const user = Datastore.create('Users.db')

app.get('/', (req, res) => {
    res.send('REST API Authentication and Authorization')
})

app.post('/api/auth/register', async (req, res) => {
   try {
      const { name, email, password } = req.body

      if ( !name || !email || !password ) {
         return res.status(422).json({ message: 'Please fill in all fields (name, email and password)'})
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newUser = await user.insert({
         name,
         email,
         password: hashedPassword
      })

      return res.status(201).json({ message: 'User registered successfully' })


   } catch (error) {
      return res.status(500).json({ message: error.message })
   }
})

app.listen(3000, () => console.log('Server started on port 3000'))