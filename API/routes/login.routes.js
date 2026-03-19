const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { conexion } = require("../database");

const router = express.Router();

router.post("/login", (req, res) => {
    const { correo, contrasena } = req.body;

    // Buscamos en Usuario y verificamos si tiene un ID en la tabla Chofer
    const query = `
        SELECT u.*, c.id_chofer 
        FROM Usuario u 
        LEFT JOIN Chofer c ON u.id_chofer = c.id_chofer 
        WHERE u.correo = ?`;

    conexion.query(query, [correo], async (err, results) => {
        if (err) return res.status(500).json({ error: "Error en el servidor" });
        if (results.length === 0) return res.status(401).json({ error: "Correo no registrado" });

        const user = results[0];

        // verificamos las contraseñas para ver si son iguales
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) return res.status(401).json({ error: "Contraseña incorrecta" });

        // se delimita el rol del usuario, si tiene un id_chofer es chofer, sino es usuario normal
        const rol = user.id_chofer ? 'chofer' : 'usuario';

        // se genera el token con el id del usuario y su rol, para que en el frontend se pueda manejar la sesión y los permisos
        const token = jwt.sign(
            { id: user.id_usuario, rol: rol },
            "tu_clave_secreta", 
            { expiresIn: "24h" }
        );

        // se envia una respuesta con el token y los datos del usuario, incluyendo su rol y si es chofer, su id_chofer
        res.json({
            token,
            user: {
                id: user.id_usuario,
                nombre: user.nombre,
                rol: rol,
                id_chofer: user.id_chofer // Si es null, es un usuario normal
            }
        });
    });
});

module.exports = router;