const express = require('express')
const app = express()
const port = 3000
const DB = require('./database')
const conexion = DB.connDB
const cors = require('cors')
app.use(express.json()) // Middleware para parsear JSON en el cuerpo de las solicitudes
app.use(cors()) // Middleware para habilitar CORS
app.get('/ojo', (req, res) => {
  res.send('priera pagina de este coso ')
})
app.get('/getTodosChoferes', (req, res) => {
    conexion.query('SELECT * FROM Chofer', (error, rows) => {
        if (error) {
            console.error('Error al obtener los choferes: ', error);     
            res.status(500).json({ error: 'Error al obtener los choferes' });
        } else {
            res.json(rows);
        }
    });
    
});
// server.js
app.post('/api/registrochofer', async (req, res) => {
    try {
        const { 
            nombre, 
            apellido, 
            correo,  // Cambiado de email a correo
            telefono, 
            contrasena,  // Cambiado de password a contrasena
            licencia, 
            experiencia,
            // Campos del vehículo (si los agregas después)
            marca_vehiculo,
            modelo_vehiculo,
            color_vehiculo,
            placa
        } = req.body;
        
        // Validar campos requeridos
        if (!nombre || !apellido || !correo || !contrasena || !licencia) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos',
                required: ['nombre', 'apellido', 'correo', 'contrasena', 'licencia']
            });
        }

        // Verificar si el correo ya existe
        const checkEmail = 'SELECT * FROM usuario WHERE correo = ?';
        conexion.query(checkEmail, [correo], async (err, results) => {
            if (err) {
                console.error('Error verificando email:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            // Verificar si la licencia ya existe
            const checkLicencia = 'SELECT * FROM chofer WHERE licencia = ?';
            conexion.query(checkLicencia, [licencia], async (err, results) => {
                if (err) {
                    console.error('Error verificando licencia:', err);
                    return res.status(500).json({ error: 'Error en el servidor' });
                }
                
                if (results.length > 0) {
                    return res.status(400).json({ error: 'La licencia ya está registrada' });
                }

                // Insertar en tabla Chofer primero
                const queryChofer = 'INSERT INTO Chofer (licencia, estado) VALUES (?, ?)';
                conexion.query(queryChofer, [licencia, 'parar'], (err, choferResult) => {
                    if (err) {
                        console.error('Error registrando chofer:', err);
                        return res.status(500).json({ error: 'Error al registrar chofer' });
                    }

                    // Insertar en tabla Usuario con referencia al chofer
                    const queryUsuario = `INSERT INTO Usuario (nombre, apellido, correo, telefono, contrasena, id_chofer) 
                                        VALUES (?, ?, ?, ?, ?, ?)`;
                    
                    conexion.query(queryUsuario, [
                        nombre, 
                        apellido, 
                        correo, 
                        telefono || '',
                        contrasena,
                        choferResult.insertId
                    ], (err, userResult) => {
                        if (err) {
                            console.error('Error registrando usuario chofer:', err);
                            return res.status(500).json({ error: 'Error al registrar usuario chofer' });
                        }
                        
                        res.status(201).json({ 
                            message: 'Chofer registrado exitosamente',
                            id_chofer: choferResult.insertId,
                            id_usuario: userResult.insertId
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error en registro chofer:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Este espacio es para el registro de usuarios pasajeros, pero lo dejaremos para después ya que es un poco más complejo por la relación con los choferes y los viajes.

app.listen(port, () => {
  console.log(`este ejemplo esta corriendo en el puerto  ${port} y se llama ojo, tambien en
    http://127.0.0.1:3000/ojo para correr en pagina`)
})