const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { conexion } = require("../database"); // Asegúrate que el nombre coincida con tu export

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

        // 1. Verificar contraseña (BCRYPT)
        // Nota: Si tus contraseñas en la DB aún no están encriptadas, 
        // usa: if (contrasena !== user.contrasena) para probar.
        const isMatch = await bcrypt.compare(contrasena, user.contrasena);
        if (!isMatch) return res.status(401).json({ error: "Contraseña incorrecta" });

        // 2. Determinar el ROL
        const rol = user.id_chofer ? 'chofer' : 'usuario';

        // 3. Generar el Token
        const token = jwt.sign(
            { id: user.id_usuario, rol: rol },
            "tu_clave_secreta", // Cámbialo por algo seguro
            { expiresIn: "24h" }
        );

        // 4. Enviar respuesta
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