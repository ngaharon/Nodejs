const express = require('express')
//initialize express
 const app = express()
 // configure body parser
 app.use(express.json())
 app.get('/', (req, res) => {
    res.send('REST API Authentication and Authorization')
 })

 app.listen(3000, () => console.log('Server started on port 3000'))