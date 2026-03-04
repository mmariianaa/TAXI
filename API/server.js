
const express = require('express')
const app = express()
const port = 3000
const DB = require('./database')
const conexion = DB.connDB
app.use(express.json()) // Middleware para parsear JSON en el cuerpo de las solicitudes
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
app.post('/api/registrochofer', async (req, res) => {
    try {
        const { nombre, apellido, email, telefono, password, licencia, experiencia } = req.body;
        
        // Validar campos requeridos
        if (!nombre || !apellido || !email || !password || !licencia) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Verificar si el email ya existe
        const checkEmail = 'SELECT * FROM Usuario WHERE correo = ?';
        db.query(checkEmail, [email], async (err, results) => {
            if (err) {
                console.error('Error verificando email:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            // Verificar si la licencia ya existe
            const checkLicencia = 'SELECT * FROM Chofer WHERE licencia = ?';
            db.query(checkLicencia, [licencia], async (err, results) => {
                if (err) {
                    console.error('Error verificando licencia:', err);
                    return res.status(500).json({ error: 'Error en el servidor' });
                }
                
                if (results.length > 0) {
                    return res.status(400).json({ error: 'La licencia ya está registrada' });
                }

                // Encriptar contraseña
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insertar en tabla Chofer primero
                const queryChofer = 'INSERT INTO Chofer (licencia, estado) VALUES (?, ?)';
                db.query(queryChofer, [licencia, 'parar'], (err, choferResult) => {
                    if (err) {
                        console.error('Error registrando chofer:', err);
                        return res.status(500).json({ error: 'Error al registrar chofer' });
                    }

                    // Insertar en tabla Usuario con referencia al chofer
                    const queryUsuario = `INSERT INTO Usuario (nombre, apellido, correo, telefono, contrasena, id_chofer) 
                                        VALUES (?, ?, ?, ?, ?, ?)`;
                    
                    db.query(queryUsuario, [nombre, apellido, email, telefono, hashedPassword, choferResult.insertId], (err, userResult) => {
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



app.listen(port, () => {
  console.log(`este ejemplo esta corriendo en el puerto  ${port} y se llama ojo, tambien en
    http://127.0.0.1:3000/ojo para correr en pagina`)
})

