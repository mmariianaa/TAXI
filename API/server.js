const express = require('express')
const app = express()
const port = 3000
const DB = require('./database')
const conexion = DB.connDB
const cors = require('cors')
const bcrypt = require('bcrypt') // Recomiendo instalar: npm install bcrypt

app.use(express.json()) // Middleware para parsear JSON en el cuerpo de las solicitudes
app.use(cors()) // Middleware para habilitar CORS

app.get('/ojo', (req, res) => {
  res.send('primera pagina de este coso ')
})

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

// Registro de chofer completo
app.post('/api/registrochofer', async (req, res) => {
    try {
        const { 
            // Datos personales
            nombre, 
            apellido, 
            edad,
            tipo_documento,
            numero_documento,
            correo, 
            telefono, 
            contrasena,
            foto,
            
            // Datos del vehículo
            marca_vehiculo,
            modelo_vehiculo,
            color_vehiculo,
            placa,
            capacidad,
            
            // Datos profesionales
            licencia, 
            experiencia,
            
            // Documentos (rutas de archivos)
            documentos
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

                        // Encriptar contraseña (recomendado)
                        // const hashedPassword = await bcrypt.hash(contrasena, 10);
                        const hashedPassword = contrasena; // Temporal, hasta instalar bcrypt

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
                                     correo, telefono, contrasena, foto, id_chofer) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                                
                                const usuarioResult = await new Promise((resolve, reject) => {
                                    conexion.query(queryUsuario, [
                                        nombre, 
                                        apellido, 
                                        edad,
                                        tipo_documento,
                                        numero_documento,
                                        correo, 
                                        telefono || null,
                                        hashedPassword,
                                        foto || null,
                                        choferResult.insertId
                                    ], (err, result) => {
                                        if (err) reject(err);
                                        else resolve(result);
                                    });
                                });

                                // 4. Insertar documentos si existen
                                if (documentos && documentos.length > 0) {
                                    for (const doc of documentos) {
                                        const queryDocumento = `INSERT INTO Documentos 
                                            (id_chofer, tipo_documento, nombre_archivo, ruta_archivo) 
                                            VALUES (?, ?, ?, ?)`;
                                        
                                        await new Promise((resolve, reject) => {
                                            conexion.query(queryDocumento, [
                                                choferResult.insertId,
                                                doc.tipo,
                                                doc.nombre,
                                                doc.ruta
                                            ], (err, result) => {
                                                if (err) reject(err);
                                                else resolve(result);
                                            });
                                        });
                                    }
                                }

                                // 5. Actualizar referencia en Admin (si es necesario crear un admin)
                                // Esto es opcional, depende de tu lógica de negocio

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
                                // ROLLBACK en caso de error
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

// Obtener todos los usuarios
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

// Registro de usuarios pasajeros
app.post('/api/registrousuario', async (req, res) => {
    try {
        const { 
            nombre, 
            apellido, 
            edad,
            tipo_documento,
            numero_documento,
            correo, 
            telefono, 
            contrasena
        } = req.body;
        
        // Validar campos requeridos
        if (!nombre || !apellido || !edad || !tipo_documento || !numero_documento || 
            !correo || !contrasena) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos',
                required: ['nombre', 'apellido', 'edad', 'tipo_documento', 'numero_documento', 
                          'correo', 'contrasena']
            });
        }

        // Validar que edad sea mayor o igual a 18
        if (edad < 18) {
            return res.status(400).json({ 
                error: 'El usuario debe ser mayor de 18 años' 
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

            // Verificar si el documento ya existe
            const checkDocumento = 'SELECT * FROM Usuario WHERE numero_documento = ?';
            conexion.query(checkDocumento, [numero_documento], async (err, results) => {
                if (err) {
                    console.error('Error verificando documento:', err);
                    return res.status(500).json({ error: 'Error en el servidor' });
                }
                
                if (results.length > 0) {
                    return res.status(400).json({ error: 'El número de documento ya está registrado' });
                }

                // Encriptar contraseña
                // const hashedPassword = await bcrypt.hash(contrasena, 10);
                const hashedPassword = contrasena; // Temporal

                // Insertar en tabla Usuario
                const queryUsuario = `INSERT INTO Usuario 
                    (nombre, apellido, edad, tipo_documento, numero_documento, 
                     correo, telefono, contrasena) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                
                conexion.query(queryUsuario, [
                    nombre, 
                    apellido, 
                    edad,
                    tipo_documento,
                    numero_documento,
                    correo, 
                    telefono || null,
                    hashedPassword
                ], (err, userResult) => {
                    if (err) {
                        console.error('Error registrando usuario:', err);
                        
                        if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
                            return res.status(400).json({ error: 'La edad debe ser mayor o igual a 18 años' });
                        }
                        
                        return res.status(500).json({ error: 'Error al registrar usuario' });
                    }
                    
                    res.status(201).json({ 
                        message: 'Usuario registrado exitosamente',
                        id_usuario: userResult.insertId
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error en registro usuario:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Endpoint para obtener documentos de un chofer
app.get('/api/documentos/:id_chofer', (req, res) => {
    const { id_chofer } = req.params;
    
    const query = 'SELECT * FROM Documentos WHERE id_chofer = ?';
    conexion.query(query, [id_chofer], (error, rows) => {
        if (error) {
            console.error('Error al obtener documentos:', error);
            res.status(500).json({ error: 'Error al obtener documentos' });
        } else {
            res.json(rows);
        }
    });
});

// Endpoint para actualizar estado de documentos
app.put('/api/documentos/:id_documento/estado', (req, res) => {
    const { id_documento } = req.params;
    const { estado } = req.body;
    
    if (!['pendiente', 'aprobado', 'rechazado'].includes(estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }
    
    const query = 'UPDATE Documentos SET estado = ? WHERE id_documento = ?';
    conexion.query(query, [estado, id_documento], (error, result) => {
        if (error) {
            console.error('Error actualizando documento:', error);
            res.status(500).json({ error: 'Error al actualizar documento' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Documento no encontrado' });
        } else {
            res.json({ message: 'Estado actualizado correctamente' });
        }
    });
});

// Endpoint para obtener historial de estados de un chofer
app.get('/api/historial/:id_chofer', (req, res) => {
    const { id_chofer } = req.params;
    
    const query = 'SELECT * FROM HistorialEstado WHERE id_chofer = ? ORDER BY fecha_cambio DESC';
    conexion.query(query, [id_chofer], (error, rows) => {
        if (error) {
            console.error('Error al obtener historial:', error);
            res.status(500).json({ error: 'Error al obtener historial' });
        } else {
            res.json(rows);
        }
    });
});

app.listen(port, () => {
    console.log(`API corriendo en el puerto ${port}`);
    console.log(`http://127.0.0.1:${port}/ojo`);
});