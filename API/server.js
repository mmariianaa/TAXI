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

// registro del chofer 
app.post('/api/registrochofer', async (req, res) => {
    const { 
        nombre, apellido, edad, tipo_documento, numero_documento,
        correo, telefono, contrasena,
        marca, modelo, capacidad, color, placa, // Datos del Taxi
        licencia, experiencia // Datos del Chofer
    } = req.body;

    try {
        // 1. Encriptar contraseña
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        // Iniciamos la cadena de inserciones
        // PASO 1: Insertar el Taxi
        const queryTaxi = `INSERT INTO Taxi (marca, modelo, capacidad, color, placa) VALUES (?, ?, ?, ?, ?)`;
        
        conexion.query(queryTaxi, [marca, modelo, capacidad, color, placa], (err, taxiRes) => {
            if (err) {
                console.error("Error en Taxi:", err);
                return res.status(500).json({ error: 'Error al registrar el vehículo', detalle: err.sqlMessage });
            }
            
            const idTaxiGenerado = taxiRes.insertId;

            // PASO 2: Insertar el Chofer vinculado al Taxi
            const queryChofer = `INSERT INTO Chofer (licencia, experiencia, id_taxi, estado) VALUES (?, ?, ?, 'parar')`;
            
            conexion.query(queryChofer, [licencia, experiencia || 0, idTaxiGenerado], (err, choferRes) => {
                if (err) {
                    console.error("Error en Chofer:", err);
                    return res.status(500).json({ error: 'Error al registrar la licencia', detalle: err.sqlMessage });
                }

                const idChoferGenerado = choferRes.insertId;

                // PASO 3: Insertar el Usuario vinculado al Chofer
                const queryUser = `
                    INSERT INTO Usuario 
                    (nombre, apellido, edad, correo, telefono, contrasena, tipo_documento, numero_documento, id_chofer) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                
                conexion.query(queryUser, [
                    nombre, apellido, edad, correo, telefono, 
                    contrasenaEncriptada, tipo_documento, numero_documento, idChoferGenerado
                ], (err, result) => {
                    if (err) {
                        console.error("Error en Usuario:", err);
                        return res.status(500).json({ error: 'Error al crear la cuenta de usuario', detalle: err.sqlMessage });
                    }
                    
                    res.status(201).json({ 
                        message: '¡Chofer y Vehículo registrados exitosamente!',
                        id_usuario: result.insertId 
                    });
                });
            });
        });

    } catch (error) {
        console.error("Error general:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// El resto de tus rutas (Login, etc) se mantienen igual...

app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});


//REGISTRO DE USUARIOS (SIN CHOFER)
app.post('/api/registrousuario', async (req, res) => {
    try {
        const { 
            nombre, 
            apellido, 
            edad, 
            correo, 
            telefono, 
            contrasena,
            tipo_documento, // Es mejor recibirlo del front
            numero_documento // Es mejor recibirlo del front
        } = req.body;

        // 1. Validaciones básicas antes de tocar la DB
        if (!correo || !contrasena || !nombre) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // 2. Encriptar la contraseña
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        // 3. Preparar la consulta
        // Nota: Asegúrate de que el orden de los campos coincida con los valores
        const query = `INSERT INTO Usuario 
            (nombre, apellido, edad, correo, telefono, contrasena, tipo_documento, numero_documento) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        
        // 4. Ejecutar inserción
        conexion.query(query, [
            nombre, 
            apellido, 
            edad, 
            correo, 
            telefono, 
            contrasenaEncriptada,
            tipo_documento || 'CC', // Valor por defecto si no viene
            numero_documento || `USR${Date.now()}` // Genera uno único si no viene
        ], (err, result) => {
            if (err) {
                console.error("ERROR EN REGISTRO USUARIO:", err);
                
                // Si el error es por correo duplicado (Error MySQL 1062)
                if (err.errno === 1062) {
                    return res.status(400).json({ error: 'El correo o documento ya está registrado' });
                }
                
                return res.status(500).json({ 
                    error: 'Error al registrar usuario en la base de datos',
                    detalle: err.sqlMessage 
                });
            }
            
            res.status(201).json({ 
                message: 'Usuario registrado con éxito',
                id: result.insertId 
            });
        });

    } catch (error) {
        console.error("Error en el catch:", error);
        res.status(500).json({ error: 'Error interno en el servidor' });
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