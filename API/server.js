const express = require('express');
const app = express();
const port = 3000;
const DB = require('./database');
const conexion = DB.connDB;
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <--- Asegúrate de haber hecho: npm install jsonwebtoken

app.use(express.json());
app.use(cors());

// Secreto para firmar los tokens (En producción usa una variable de entorno)
const JWT_SECRET = 'tu_llave_secreta_super_segura_123';

app.get('/ojo', (req, res) => {
    res.send('API de TaxiDB funcionando correctamente');
});

// ============================================
// ENDPOINT DE LOGIN (EL QUE FALTABA)
// ============================================
app.post('/api/login', (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ error: 'Faltan correo o contraseña' });
    }

    // Consulta para traer datos de Usuario, Chofer y su Taxi (si tiene)
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

        // Comparar contraseña encriptada
        const match = await bcrypt.compare(contrasena, user.contrasena);
        if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

        // Crear Token
        const token = jwt.sign({ id: user.id_usuario }, JWT_SECRET, { expiresIn: '24h' });

        // Responder con datos estructurados para tu Perfil Chofer
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

// ============================================
// REGISTRO DEL CHOFER
// ============================================
app.post('/api/registrochofer', async (req, res) => {
    try {
        const {
            nombre, apellido, edad, tipo_documento, numero_documento,
            correo, telefono, contrasena,
            marca_vehiculo, modelo_vehiculo, color_vehiculo, placa, capacidad,
            licencia, experiencia
        } = req.body;

        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        // Iniciar transacción manual o inserts en cadena
        // 1. Insertar Taxi
        const queryTaxi = `INSERT INTO Taxi (marca, modelo, color, placa, capacidad) VALUES (?, ?, ?, ?, ?)`;
        conexion.query(queryTaxi, [marca_vehiculo, modelo_vehiculo, color_vehiculo, placa, capacidad], (err, taxiRes) => {
            if (err) return res.status(500).json({ error: 'Error al registrar vehículo' });

            // 2. Insertar Chofer
            const queryChofer = `INSERT INTO Chofer (licencia, experiencia, id_taxi) VALUES (?, ?, ?)`;
            conexion.query(queryChofer, [licencia, experiencia, taxiRes.insertId], (err, choferRes) => {
                if (err) return res.status(500).json({ error: 'Error al registrar chofer' });

                // 3. Insertar Usuario
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

// ============================================
// REGISTRO DE USUARIO (CLIENTE)
// ============================================
// ============================================
// REGISTRO DE USUARIO (CLIENTE) - CORREGIDO
// ============================================
app.post('/api/registrousuario', async (req, res) => {
    try {
        const { 
            nombre, 
            apellido, 
            edad, 
            correo, 
            telefono, 
            contrasena,
            tipo_documento,    // <--- AGREGAR
            numero_documento    // <--- AGREGAR
        } = req.body;

        // Validar campos requeridos
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
            tipo_documento,     // <--- Usar el que viene del frontend
            numero_documento,    // <--- Usar el que viene del frontend
            correo, 
            telefono, 
            contrasenaEncriptada
        ], (err, result) => {
            if (err) {
                console.error('Error SQL:', err);
                
                // Verificar si es error de email duplicado
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

// ============================================
// CONSULTAS
// ============================================
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

app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================
app.put('/api/usuarios/:id/password', async (req, res) => {
    const { id } = req.params;
    const { nueva } = req.body;  // 👈 SOLO recibe nueva contraseña

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

// ============================================
// ACTUALIZAR TELÉFONO (¡FALTABA!)
// ============================================
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