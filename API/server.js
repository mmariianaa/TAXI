
const express = require('express')
const app = express()
const port = 3000
const DB = require('./database')
const conexion = DB.connDB
app.use(express.json()) // Middleware para parsear JSON en el cuerpo de las solicitudes
app.get('/ojo', (req, res) => {
  res.send('priera pagina de este coso ')
})
app.listen(port, () => {
  console.log(`este ejemplo esta corriendo en el puerto  ${port} y se llama ojo, tambien en
    http://127.0.0.1:3000/ojo para correr en pagina`)
})

