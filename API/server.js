const express = require('express')
const app = express()
const port = 3000
const DB = require('./database')
const conexion = DB.connDB
const cors = require('cors')

app.use(express.json())
app.use(cors())

app.get('/ojo', (req, res) => {
  res.send('primera pagina de este coso ')
})

// REGISTRO DEL CHOFER
app.post('/api/registrochofer', async (req, res) => {
    try {
        const { 
            nombre, apellido, edad, tipo_documento, numero_documento,
            correo, telefono, contrasena,
            marca_vehiculo, modelo_vehiculo, color_vehiculo, placa, capacidad,
            licencia, experiencia
        } = req.body;
        
        // Validar campos requeridos
        if (!nombre || !apellido || !edad || !tipo_documento || !numero_documento || 
            !correo || !contrasena || !licencia || !marca_vehiculo || !modelo_vehiculo || 
            !color_vehiculo || !placa || !capacidad) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos',
                required: ['nombre', 'apellido', 'edad', 'tipo_documento', 'numero_documento', 
                          'correo', 'contrasena', 'licencia', 'marca_vehiculo', 'modelo_vehiculo', 
                          'color_vehiculo', 'placa', 'capacidad']
            });
        }

        // Verificar si el correo ya existe
        const checkEmail = 'SELECT * FROM Usuario WHERE correo = ?';
        conexion.query(checkEmail, [correo], async (err, results) => {
            if (err) {
                console.error('Error verificando email:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            // Verificar si el número de documento ya existe
            const checkDocumento = 'SELECT * FROM Usuario WHERE numero_documento = ?';
            conexion.query(checkDocumento, [numero_documento], async (err, results) => {
                if (err) {
                    console.error('Error verificando documento:', err);
                    return res.status(500).json({ error: 'Error en el servidor' });
                }
                
                if (results.length > 0) {
                    return res.status(400).json({ error: 'El número de documento ya está registrado' });
                }

                // Verificar si la licencia ya existe
                const checkLicencia = 'SELECT * FROM Chofer WHERE licencia = ?';
                conexion.query(checkLicencia, [licencia], async (err, results) => {
                    if (err) {
                        console.error('Error verificando licencia:', err);
                        return res.status(500).json({ error: 'Error en el servidor' });
                    }
                    
                    if (results.length > 0) {
                        return res.status(400).json({ error: 'La licencia ya está registrada' });
                    }

                    // Verificar si la placa ya existe
                    const checkPlaca = 'SELECT * FROM Taxi WHERE placa = ?';
                    conexion.query(checkPlaca, [placa], async (err, results) => {
                        if (err) {
                            console.error('Error verificando placa:', err);
                            return res.status(500).json({ error: 'Error en el servidor' });
                        }
                        
                        if (results.length > 0) {
                            return res.status(400).json({ error: 'La placa ya está registrada' });
                        }

                        // INICIAR TRANSACCIÓN
                        conexion.beginTransaction(async (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Error al iniciar transacción' });
                            }

                            try {
                                // 1. Insertar en Taxi
                                const queryTaxi = `INSERT INTO Taxi (marca, modelo, color, placa, capacidad) 
                                                 VALUES (?, ?, ?, ?, ?)`;
                                
                                const taxiResult = await new Promise((resolve, reject) => {
                                    conexion.query(queryTaxi, [marca_vehiculo, modelo_vehiculo, color_vehiculo, placa, capacidad], 
                                        (err, result) => {
                                            if (err) reject(err);
                                            else resolve(result);
                                        });
                                });

                                // 2. Insertar en Chofer
                                const queryChofer = `INSERT INTO Chofer (licencia, experiencia, estado, id_taxi) 
                                                   VALUES (?, ?, ?, ?)`;
                                
                                const choferResult = await new Promise((resolve, reject) => {
                                    conexion.query(queryChofer, [licencia, experiencia || 0, 'inactivo', taxiResult.insertId], 
                                        (err, result) => {
                                            if (err) reject(err);
                                            else resolve(result);
                                        });
                                });

                                // 3. Insertar en Usuario
                                const queryUsuario = `INSERT INTO Usuario 
                                    (nombre, apellido, edad, tipo_documento, numero_documento, 
                                     correo, telefono, contrasena, id_chofer) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                                
                                const usuarioResult = await new Promise((resolve, reject) => {
                                    conexion.query(queryUsuario, [
                                        nombre, 
                                        apellido, 
                                        edad,
                                        tipo_documento,
                                        numero_documento,
                                        correo, 
                                        telefono || null,
                                        contrasena,
                                        choferResult.insertId
                                    ], (err, result) => {
                                        if (err) reject(err);
                                        else resolve(result);
                                    });
                                });

                                // COMMIT de la transacción
                                conexion.commit((err) => {
                                    if (err) {
                                        return conexion.rollback(() => {
                                            res.status(500).json({ error: 'Error al finalizar transacción' });
                                        });
                                    }

                                    res.status(201).json({ 
                                        message: 'Chofer registrado exitosamente',
                                        data: {
                                            id_chofer: choferResult.insertId,
                                            id_usuario: usuarioResult.insertId,
                                            id_taxi: taxiResult.insertId
                                        }
                                    });
                                });

                            } catch (error) {
                                return conexion.rollback(() => {
                                    console.error('Error en transacción:', error);
                                    res.status(500).json({ error: 'Error al registrar chofer: ' + error.message });
                                });
                            }
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
// REGISTRO DE USUARIO
app.post('/api/registrousuario', async (req, res) => {
    try {
        const { 
            nombre, apellido, edad, correo, telefono, contrasena
        } = req.body;
        
        // Validar campos requeridos
        if (!nombre || !apellido || !edad || !correo || !contrasena) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos',
                received: req.body  // ayuda a depurar qué campos se recibieron realmente
            });
        }

        // Validar que edad sea un número y esté en rango
        const edadNum = parseInt(edad);
        if (isNaN(edadNum) || edadNum < 18 || edadNum > 120) {
            return res.status(400).json({ 
                error: 'La edad debe ser un número válido entre 18 y 120 años',
                edad_recibida: edad
            });
        }

        // Verificar si el correo ya existe
        const checkEmail = 'SELECT * FROM Usuario WHERE correo = ?';
        conexion.query(checkEmail, [correo], async (err, results) => {
            if (err) {
                console.error('Error verificando email:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'El correo ya está registrado' });
            }

            // Insertar en tabla Usuario
            const queryUsuario = `INSERT INTO Usuario 
                (nombre, apellido, edad, tipo_documento, numero_documento, correo, telefono, contrasena) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            conexion.query(queryUsuario, [
                nombre, 
                apellido, 
                edadNum,  // Usamos el número validado
                'CC',     
                'DOC_' + Date.now(),  //gneramos un documento único temporal
                correo, 
                telefono || null,
                contrasena
            ], (err, userResult) => {
                if (err) {
                    console.error('Error registrando usuario:', err);
                    
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ 
                            error: 'El número de documento o correo ya está registrado' 
                        });
                    }
                    
                    return res.status(500).json({ error: 'Error al registrar usuario: ' + err.message });
                }
                
                res.status(201).json({ 
                    message: 'Usuario registrado exitosamente',
                    id_usuario: userResult.insertId
                });
            });
        });
    } catch (error) {
        console.error('Error en registro usuario:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
// ============================================
// ENDPOINTS CONSULTA
// ============================================
app.get('/getTodosChoferes', (req, res) => {
    const query = `
        SELECT 
            c.*,
            u.nombre,
            u.apellido,
            u.correo,
            u.telefono,
            u.tipo_documento,
            u.numero_documento,
            t.marca,
            t.modelo,
            t.color,
            t.placa,
            t.capacidad
        FROM Chofer c
        LEFT JOIN Usuario u ON c.id_chofer = u.id_chofer
        LEFT JOIN Taxi t ON c.id_taxi = t.id_taxi
    `
    conexion.query(query, (error, rows) => {
        if (error) {
            console.error('Error al obtener los choferes: ', error);     
            res.status(500).json({ error: 'Error al obtener los choferes' });
        } else {
            res.json(rows);
        }
    });
});

app.get('/getTodoslosusuarios', (req, res) => {
    conexion.query('SELECT id_usuario, nombre, apellido, edad, tipo_documento, numero_documento, correo, telefono FROM Usuario', (error, rows) => {
        if (error) {
            console.error('Error al obtener los usuarios: ', error);     
            res.status(500).json({ error: 'Error al obtener los usuarios' });
        } else {
            res.json(rows);
        }
    });
});

app.listen(port, () => {
    console.log(`API corriendo en el puerto ${port}`);
    console.log(`http://127.0.0.1:${port}/ojo`);
});