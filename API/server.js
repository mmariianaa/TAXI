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
            correo, 
            telefono, 
            contrasena, 
            licencia, 
            experiencia,
            // Campos del vehículo (estos se van a agregar después, por ahora los dejamos como opcionales)
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

// est ees pacio es par averificar nada mas si si me trae todos los usuarios registtados
app.get('/getTodoslosusuarios', (req, res) => {
    conexion.query('SELECT * FROM Usuario', (error, rows) => {
        if (error) {
            console.error('Error al obtener los usuarios: ', error);     
            res.status(500).json({ error: 'Error al obtener los usuarios' });
        } else {
            res.json(rows);
        }
    });
    
});
// Este espacio es para el registro de usuarios pasajeros
app.post('/api/registrousuario', async (req, res) => {
    try {
        const { 
            nombre, 
            apellido, 
            correo, 
            telefono, 
            edad,
            contrasena
            // Nota: Los campos de las relaciones (id_chofer, id_admin, id_viajes, id_calificacion)
            // se establecerán en null inicialmente
        } = req.body;
        
        // Validar campos requeridos (NOT NULL según tu BD)
        if (!nombre || !apellido || !correo || !contrasena || !edad) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos',
                required: ['nombre', 'apellido', 'correo', 'contrasena', 'edad']
            });
        }

        // Validar que edad sea mayor o igual a 18
        if (edad < 18) {
            return res.status(400).json({ 
                error: 'El usuario debe ser mayor de 18 años' 
            });
        }

        // Verificar si el correo ya existe (UNIQUE constraint)
        const checkEmail = 'SELECT * FROM usuario WHERE correo = ?';
        conexion.query(checkEmail, [correo], async (err, results) => {
            if (err) {
                console.error('Error verificando email:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }

            // Insertar en tabla Usuario
            // id_chofer, id_admin, id_viajes, id_calificacion se establecen como NULL inicialmente
            const queryUsuario = `INSERT INTO Usuario 
                (nombre, apellido, edad, correo, telefono, contrasena, id_chofer, id_admin, id_viajes, id_calificacion) 
                VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL)`;
            
            conexion.query(queryUsuario, [
                nombre, 
                apellido, 
                edad,
                correo, 
                telefono || null, // Si no se proporciona teléfono, se guarda como NULL
                contrasena
            ], (err, userResult) => {
                if (err) {
                    console.error('Error registrando usuario:', err);
                    
                    // Manejar errores específicos de MySQL
                    if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
                        return res.status(400).json({ error: 'La edad debe ser mayor o igual a 18 años' });
                    }
                    
                    return res.status(500).json({ error: 'Error al registrar usuario' });
                }
                
                // Obtener el usuario recién creado (opcional, para confirmar los datos)
                const selectQuery = 'SELECT id_usuario, nombre, apellido, correo, telefono, edad FROM Usuario WHERE id_usuario = ?';
                conexion.query(selectQuery, [userResult.insertId], (err, userData) => {
                    if (err) {
                        return res.status(201).json({ 
                            message: 'Usuario registrado exitosamente',
                            id_usuario: userResult.insertId
                        });
                    }
                    
                    res.status(201).json({ 
                        message: 'Usuario registrado exitosamente',
                        usuario: userData[0]
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error en registro usuario:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
app.listen(port, () => {
  console.log(`este ejemplo esta corriendo en el puerto  ${port} y se llama ojo, tambien en
    http://127.0.0.1:3000/ojo para correr en pagina`)
})