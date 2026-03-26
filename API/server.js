const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const app = express();
const port = 3000;
const DB = require('./database');
const conexion = DB.connDB;
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:8100',
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "http://localhost:8100",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const JWT_SECRET = 'tu_llave_secreta_super_segura_123';

// WEBSOCKETS

const usuariosConectados = new Map();

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('unirse_sala', (userId) => {
        console.log(`Usuario ${userId} se unió a su sala`);
        socket.join(`usuario_${userId}`);
        usuariosConectados.set(userId, socket.id);
    });

    // SOLICITUD DE TAXI
   
    socket.on('solicitar_taxi', (data) => {
        const { id_chofer_usuario, nombre_cliente, id_cliente, placa_taxi } = data;

        console.log('Solicitud recibida para id_chofer:', id_chofer_usuario);

        // Buscamos el id_usuario real vinculado a ese chofer
        const queryUsuario = `
            SELECT u.id_usuario 
            FROM Usuario u 
            WHERE u.id_chofer = ?
        `;

        conexion.query(queryUsuario, [id_chofer_usuario], (err, results) => {
            if (err || results.length === 0) {
                console.error('No se encontró un usuario vinculado al chofer:', id_chofer_usuario);
                return;
            }

            const idUsuarioReal = results[0].id_usuario;

            const viajeQuery = `
                INSERT INTO Viajes (destino, fecha_viaje) 
                VALUES (?, NOW())
            `;

            conexion.query(viajeQuery, ['Solicitud de taxi'], (err, viajeResult) => {
                if (err) {
                    console.error('Error al crear registro de viaje:', err);
                    return;
                }

                const id_viaje = viajeResult.insertId;

                console.log(`Redirigiendo: Chofer ${id_chofer_usuario} -> Sala usuario_${idUsuarioReal}`);

                io.to(`usuario_${idUsuarioReal}`).emit('notificacion_chofer', {
                    id_viaje: id_viaje,
                    nombre_cliente: nombre_cliente,
                    id_cliente: id_cliente,
                    placa_taxi: placa_taxi,
                    origen: data.origen,
                    destino: data.destino,
                    timestamp: new Date()
                });
            });
        });
    });

    // EVENTOS DE RESPUESTA DEL CHOFER
  

    socket.on('aceptar_viaje', (data) => {
        const { id_viaje, id_chofer, id_cliente } = data;

        // Buscar información completa del chofer
        const choferQuery = `
        SELECT u.nombre, u.apellido, t.marca, t.modelo, t.placa, t.color
        FROM Chofer c
        JOIN Usuario u ON c.id_chofer = u.id_chofer
        JOIN Taxi t ON c.id_taxi = t.id_taxi
        WHERE c.id_chofer = ?
    `;

        conexion.query(choferQuery, [id_chofer], (err, choferResults) => {
            if (err || choferResults.length === 0) {
                console.error('Error al obtener info del chofer:', err);
                return;
            }

            const chofer = choferResults[0];

            // Notificar al usuario
            io.to(`usuario_${id_cliente}`).emit('viaje_aceptado', {
                id_viaje: id_viaje,
                mensaje: '¡Tu viaje ha sido aceptado! El chofer va en camino.',
                chofer: {
                    nombre: `${chofer.nombre} ${chofer.apellido}`,
                    vehiculo: `${chofer.marca} ${chofer.modelo}`,
                    placa: chofer.placa,
                    color: chofer.color
                }
            });

            console.log(` Viaje ${id_viaje} ACEPTADO. Avisando a usuario_${id_cliente}`);

            conexion.query('UPDATE Viajes SET estado = "aceptado" WHERE id_viaje = ?', [id_viaje]);
        });
    });
    socket.on('rechazar_viaje', (data) => {
        const { id_viaje, id_cliente } = data;

        console.log(`Viaje ${id_viaje} RECHAZADO. Avisando a usuario_${id_cliente}`);

        io.to(`usuario_${id_cliente}`).emit('viaje_rechazado', {
            id_viaje: id_viaje,
            mensaje: 'El chofer no puede tomar tu viaje en este momento. Por favor, selecciona otro taxi.'
        });
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);

        for (let [key, value] of usuariosConectados.entries()) {
            if (value === socket.id) {
                usuariosConectados.delete(key);
                break;
            }
        }
    });
});


// ENDPOINTS REST


app.get('/ojo', (req, res) => {
    res.send('API de TaxiDB funcionando correctamente');
});

app.post('/api/login', (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Faltan correo o contraseña' });
    }

    const query = `
        SELECT 
            u.id_usuario, u.nombre, u.apellido, u.correo, u.contrasena, u.id_chofer,
            u.tipo_documento, u.numero_documento, u.telefono,
            t.marca, t.modelo, t.placa, t.color
        FROM Usuario u
        LEFT JOIN Chofer c ON u.id_chofer = c.id_chofer
        LEFT JOIN Taxi t ON c.id_taxi = t.id_taxi
        WHERE u.correo = ?`;

    conexion.query(query, [correo], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Error en el servidor' });
        if (results.length === 0) return res.status(401).json({ error: 'El correo no está registrado' });

        const user = results[0];
        
        // Verificación de contraseña encriptada
        const match = await bcrypt.compare(contrasena, user.contrasena);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

        // --- LÓGICA DE ROLES ACTUALIZADA ---
        let rolAsignado = 'usuario';
        
        if (user.id_chofer) {
            rolAsignado = 'chofer';
        } else if (user.correo === 'admin@taxi.com') { // <-- Identificamos al Admin
            rolAsignado = 'admin';
        }

        const token = jwt.sign({ id: user.id_usuario }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                rol: rolAsignado, // Enviamos el rol detectado
                telefono: user.telefono,
                documento: user.numero_documento,
                id_chofer: user.id_chofer,
                vehiculo: user.id_chofer ? {
                    marca: user.marca,
                    modelo: user.modelo,
                    placa: user.placa,
                    color: user.color
                } : null
            }
        });
    });
});

app.get('/api/taxis/disponibles', (req, res) => {
    const query = `
        SELECT 
            c.id_chofer,
            u.id_usuario,
            u.nombre,
            u.apellido,
            u.telefono,
            t.marca,
            t.modelo,
            t.color,
            t.placa,
            t.capacidad,
            c.estado
        FROM Chofer c
        INNER JOIN Taxi t ON c.id_taxi = t.id_taxi
        LEFT JOIN Usuario u ON c.id_chofer = u.id_chofer
        WHERE c.estado IN ('activo', 'disponible')
    `;

    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener taxis:', err);
            return res.status(500).json({ error: 'Error al obtener taxis disponibles' });
        }
        res.json(results);
    });
});

app.post('/api/registrochofer', async (req, res) => {
    const {
        nombre, apellido, edad, tipo_documento, numero_documento,
        correo, telefono, contrasena,
        marca_vehiculo, modelo_vehiculo, color_vehiculo, placa, capacidad,
        licencia, experiencia
    } = req.body;

    const db = conexion.promise();

    try {
        await db.beginTransaction();
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
        const queryTaxi = `INSERT INTO Taxi (marca, modelo, color, placa, capacidad) VALUES (?, ?, ?, ?, ?)`;
        const [taxiRes] = await db.query(queryTaxi, [marca_vehiculo, modelo_vehiculo, color_vehiculo, placa, capacidad]);
        const idTaxi = taxiRes.insertId;
        const queryChofer = `INSERT INTO Chofer (licencia, experiencia, id_taxi, estado) VALUES (?, ?, ?, ?)`;
        const [choferRes] = await db.query(queryChofer, [licencia, experiencia, idTaxi, 'activo']);
        const idChofer = choferRes.insertId;

        const queryUser = `INSERT INTO Usuario 
            (nombre, apellido, edad, tipo_documento, numero_documento, correo, telefono, contrasena, id_chofer) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        await db.query(queryUser, [
            nombre, apellido, edad, tipo_documento, numero_documento,
            correo, telefono, contrasenaEncriptada, idChofer
        ]);

        await db.commit();

        res.status(201).json({ message: 'Chofer, vehículo y usuario registrados exitosamente' });

    } catch (error) {
        // Si algo falla, deshacemos todo lo anterior (Rollback)
        await db.rollback();
        console.error('Error en el registro:', error);
        res.status(500).json({
            error: 'Hubo un problema al registrar el chofer',
            detalle: error.message
        });
    }
});

app.post('/api/registrousuario', async (req, res) => {
    try {
        const {
            nombre, apellido, edad, correo, telefono,
            contrasena, tipo_documento, numero_documento
        } = req.body;

        //Validación de campos
        if (!nombre || !apellido || !edad || !correo || !contrasena || !tipo_documento || !numero_documento) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        //Encriptar contraseña
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        //Ejecutar query usando Promesas
        const query = `INSERT INTO Usuario 
            (nombre, apellido, edad, tipo_documento, numero_documento, correo, telefono, contrasena) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        // Usamos .promise() para evitar el callback
        const [result] = await conexion.promise().query(query, [
            nombre, apellido, edad, tipo_documento,
            numero_documento, correo, telefono, contrasenaEncriptada
        ]);

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Usuario registrado con éxito',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);

        //Manejo de errores específicos (Duplicados)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                error: 'El correo o número de documento ya se encuentra registrado'
            });
        }

        // Error genérico del servidor
        res.status(500).json({ error: 'Error interno del servidor al procesar el registro' });
    }
});

app.get('/getTodosChoferes', (req, res) => {
    const query = `
        SELECT c.*, u.nombre, u.apellido, u.correo, t.marca, t.placa
        FROM Chofer c
        LEFT JOIN Usuario u ON c.id_chofer = u.id_chofer
        LEFT JOIN Taxi t ON c.id_taxi = t.id_taxi`;

    conexion.query(query, (error, rows) => {
        if (error) res.status(500).json({ error: 'Error' });
        else res.json(rows);
    });
});

app.put('/api/usuarios/:id/password', async (req, res) => {
    const { id } = req.params;
    const { nueva } = req.body;

    if (!nueva || nueva.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        const nuevaEncriptada = await bcrypt.hash(nueva, 10);
        const queryUpdate = 'UPDATE Usuario SET contrasena = ? WHERE id_usuario = ?';

        conexion.query(queryUpdate, [nuevaEncriptada, id], (err2) => {
            if (err2) {
                return res.status(500).json({ error: 'Error al actualizar contraseña' });
            }

            res.json({ success: true, message: 'Contraseña actualizada' });
        });

    } catch (error) {
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

app.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { telefono } = req.body;

    if (!telefono) {
        return res.status(400).json({ error: 'El teléfono es requerido' });
    }

    const query = 'UPDATE Usuario SET telefono = ? WHERE id_usuario = ?';

    conexion.query(query, [telefono, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar teléfono:', err);
            return res.status(500).json({ error: 'Error al actualizar teléfono' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            success: true,
            message: 'Teléfono actualizado correctamente',
            telefono: telefono
        });
    });
});

server.listen(port, () => {
    console.log(` Servidor unificado corriendo en http://localhost:${port}`);
    console.log(` REST API disponible en http://localhost:${port}`);
    console.log(` WebSocket Server disponible en ws://localhost:${port}`);

    // OBTENER HISTORIAL
    app.get('/api/historialusuario/:id', (req, res) => {
        const { id } = req.params;
        const { tipo } = req.query;

        const columnaFiltro = (tipo === 'chofer') ? 'v.id_chofer' : 'v.id_usuario';

        const query = `
        SELECT 
            v.id_viaje, 
            v.origen, 
            v.destino, 
            v.fecha_inicio AS fecha_viaje, -- 1. CAMBIO: Usamos AS para que Ionic lo lea como fecha_viaje
            v.precio, 
            v.estado,
            u_pasajero.nombre AS nombre_pasajero,
            u_chofer.nombre AS nombre_chofer,
            t.placa AS placa_taxi, 
            t.modelo AS modelo_taxi,
            tp.tipo_pago
        FROM Viajes v
        LEFT JOIN Usuario u_pasajero ON v.id_usuario = u_pasajero.id_usuario
        LEFT JOIN Chofer c ON v.id_chofer = c.id_chofer
        LEFT JOIN Usuario u_chofer ON c.id_chofer = u_chofer.id_chofer
        LEFT JOIN Taxi t ON c.id_taxi = t.id_taxi
        LEFT JOIN TiposPago tp ON v.id_pago = tp.id_pago
        WHERE ${columnaFiltro} = ?
        ORDER BY v.fecha_inicio DESC`;

        conexion.query(query, [id], (err, results) => {
            if (err) {
                console.error('ERROR SQL DETALLADO:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(results);
        });
    });

    //CREAR NUEVO VIAJE (POST)
    app.post('/api/historialusuario', (req, res) => {
        // CAMBIO: Asegúrate de que el body use 'fecha_inicio' si lo envías desde el front
        const { id_usuario, id_chofer, origen, destino, precio, id_pago, estado } = req.body;

        const query = `INSERT INTO Viajes (id_usuario, id_chofer, origen, destino, precio, id_pago, estado, fecha_inicio) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`; // Usamos NOW() para la fecha actual de la DB

        conexion.query(query, [id_usuario, id_chofer, origen, destino, precio, id_pago, estado], (err, result) => {
            if (err) {
                console.error('ERROR AL INSERTAR:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ success: true, id_viaje: result.insertId });
        });
    });
});
// Endpoint para ver solo USUARIOS NORMALES (no choferes)
app.get('/api/ver-usuarios-normales', (req, res) => {
    const query = `
        SELECT id_usuario, nombre, apellido, correo, telefono, tipo_documento, numero_documento
        FROM Usuario
        WHERE id_chofer IS NULL
        ORDER BY id_usuario DESC
    `;

    conexion.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(results);
    });
 
    // CAMBIAR CONTRASEÑA
 
    app.put('/api/usuarios/:id/password', async (req, res) => {
        const { id } = req.params;
        const { nueva } = req.body;  // SOLO recibe nueva contraseña

        if (!nueva || nueva.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        try {
            // Encriptar nueva contraseña directamente
            const nuevaEncriptada = await bcrypt.hash(nueva, 10);

            // Actualizar sin verificar la actual
            const queryUpdate = 'UPDATE Usuario SET contrasena = ? WHERE id_usuario = ?';

            conexion.query(queryUpdate, [nuevaEncriptada, id], (err2) => {
                if (err2) {
                    return res.status(500).json({ error: 'Error al actualizar contraseña' });
                }

                res.json({ success: true, message: 'Contraseña actualizada' });
            });

        } catch (error) {
            res.status(500).json({ error: 'Error en el servidor' });
        }
    });

    // ACTUALIZAR TELÉFONO Y CORREO

    app.put('/api/usuarios/:id', (req, res) => {
        const { id } = req.params;
        const { telefono, correo } = req.body;

        if (!telefono && !correo) {
            return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
        }

        // Construir query dinámica
        let campos = [];
        let valores = [];

        if (telefono) {
            campos.push('telefono = ?');
            valores.push(telefono);
        }

        if (correo) {
            campos.push('correo = ?');
            valores.push(correo);
        }

        valores.push(id);
        const query = `UPDATE Usuario SET ${campos.join(', ')} WHERE id_usuario = ?`;

        conexion.query(query, valores, (err, result) => {
            if (err) {
                console.error('Error al actualizar usuario:', err);
                return res.status(500).json({ error: 'Error al actualizar usuario' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            res.json({
                success: true,
                message: 'Usuario actualizado correctamente',
                telefono: telefono,
                correo: correo
            });
        });
    });
    
});
/// RUTA PARA ACTUALIZAR PERFIL DEl chofer
app.put('/api/admin/actualizar-chofer/:id', (req, res) => {
    const id_chofer = req.params.id; 
    const { marca, modelo, color, placa, capacidad, licencia } = req.body;
    const query = `
        UPDATE Taxi t
        INNER JOIN Chofer c ON t.id_taxi = c.id_taxi
        SET t.marca = ?, t.modelo = ?, t.color = ?, t.placa = ?, t.capacidad = ?, c.licencia = ?
        WHERE c.id_chofer = ?
    `;

    conexion.query(query, [marca, modelo, color, placa, capacidad, licencia, id_chofer], (err, result) => {
        if (err) {
            console.error('Error al actualizar chofer en DB:', err);
            return res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No se encontró el chofer con ID: ' + id_chofer });
        }

        console.log('✅ Chofer y Vehículo actualizados con éxito. ID:', id_chofer);
        res.json({ success: true, message: 'Actualización exitosa' });
    });
});
//SOLO AGREGUE ESTOS DOS PARA LAS VALIDACIONES 
// RUTA PARA ACTUALIZAR PERFIL DE ADMINISTRADOR
app.put('/api/perfil/actualizar-completo/:id', (req, res) => {
    const id_usuario = req.params.id;
    
    // Extraemos SOLO lo que tu HTML y tu TS están enviando realmente
    const { nombre, apellido, telefono, foto } = req.body;

    // Solo actualizamos estos 4 campos para que no dé error por falta de datos
    const query = `
        UPDATE Usuario 
        SET nombre = ?, 
            apellido = ?, 
            telefono = ?, 
            foto = ? 
        WHERE id_usuario = ?
    `;

    conexion.query(query, [nombre, apellido, telefono, foto, id_usuario], (err, result) => {
        if (err) {
            console.error('❌ Error detallado en MySQL:', err); 
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No se encontró el usuario' });
        }

        console.log('✅ Perfil actualizado con éxito para el ID:', id_usuario);
        res.json({ message: 'Perfil actualizado con éxito' });
    });
});