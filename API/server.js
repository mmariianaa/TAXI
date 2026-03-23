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

// ============================================
// WEBSOCKETS
// ============================================
const usuariosConectados = new Map();

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('unirse_sala', (userId) => {
        console.log(`Usuario ${userId} se unió a su sala`);
        socket.join(`usuario_${userId}`);
        usuariosConectados.set(userId, socket.id);
    });

    // ============================================
    // SOLICITUD DE TAXI (ÚNICA PARTE MODIFICADA)
    // ============================================
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

    // ============================================
    // EVENTOS DE RESPUESTA DEL CHOFER
    // ============================================

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
        
        console.log(`✅ Viaje ${id_viaje} ACEPTADO. Avisando a usuario_${id_cliente}`);
        
        // Actualizar estado del viaje en BD
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

// ============================================
// ENDPOINTS REST (COMPLETOS, SIN CAMBIOS)
// ============================================

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
        const match = await bcrypt.compare(contrasena, user.contrasena);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

        const token = jwt.sign({ id: user.id_usuario }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                rol: user.id_chofer ? 'chofer' : 'usuario',
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
    try {
        const {
            nombre, apellido, edad, tipo_documento, numero_documento,
            correo, telefono, contrasena,
            marca_vehiculo, modelo_vehiculo, color_vehiculo, placa, capacidad,
            licencia, experiencia
        } = req.body;

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        const queryTaxi = `INSERT INTO Taxi (marca, modelo, color, placa, capacidad) VALUES (?, ?, ?, ?, ?)`;
        conexion.query(queryTaxi, [marca_vehiculo, modelo_vehiculo, color_vehiculo, placa, capacidad], (err, taxiRes) => {
            if (err) return res.status(500).json({ error: 'Error al registrar vehículo' });

            const queryChofer = `INSERT INTO Chofer (licencia, experiencia, id_taxi) VALUES (?, ?, ?)`;
            conexion.query(queryChofer, [licencia, experiencia, taxiRes.insertId], (err, choferRes) => {
                if (err) return res.status(500).json({ error: 'Error al registrar chofer' });

                const queryUser = `INSERT INTO Usuario 
                    (nombre, apellido, edad, tipo_documento, numero_documento, correo, telefono, contrasena, id_chofer) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                conexion.query(queryUser, [
                    nombre, apellido, edad, tipo_documento, numero_documento,
                    correo, telefono, contrasenaEncriptada, choferRes.insertId
                ], (err, result) => {
                    if (err) return res.status(500).json({ error: 'Error al crear cuenta de usuario' });
                    res.status(201).json({ message: 'Chofer registrado exitosamente' });
                });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

app.post('/api/registrousuario', async (req, res) => {
    try {
        const { 
            nombre, 
            apellido, 
            edad, 
            correo, 
            telefono, 
            contrasena,
            tipo_documento,  
            numero_documento    
        } = req.body;

        if (!nombre || !apellido || !edad || !correo || !contrasena || !tipo_documento || !numero_documento) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        const query = `INSERT INTO Usuario 
            (nombre, apellido, edad, tipo_documento, numero_documento, correo, telefono, contrasena) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        conexion.query(query, [
            nombre, 
            apellido, 
            edad, 
            tipo_documento,    
            numero_documento,  
            correo, 
            telefono, 
            contrasenaEncriptada
        ], (err, result) => {
            if (err) {
                console.error('Error SQL:', err);
                
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'El correo o documento ya está registrado' });
                }
                
                return res.status(500).json({ error: 'Error al registrar usuario' });
            }
            
            res.status(201).json({ 
                success: true,
                message: 'Usuario registrado con éxito',
                userId: result.insertId 
            });
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
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
    console.log(`🚀 Servidor unificado corriendo en http://localhost:${port}`);
    console.log(`📡 REST API disponible en http://localhost:${port}`);
    console.log(`🔌 WebSocket Server disponible en ws://localhost:${port}`);

// 1. OBTENER HISTORIAL (GET)
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
        ORDER BY v.fecha_inicio DESC`; // 2. CAMBIO: Ordenamos por la columna real 'fecha_inicio'

    conexion.query(query, [id], (err, results) => {
        if (err) {
            console.error('ERROR SQL DETALLADO:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// 2. CREAR NUEVO VIAJE (POST)
app.post('/api/historialusuario', (req, res) => {
    // 3. CAMBIO: Asegúrate de que el body use 'fecha_inicio' si lo envías desde el front
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
});