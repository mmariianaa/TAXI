const bcrypt = require('bcrypt');
const miClave = 'admin1234'; // <--- Pon aquí la contraseña que quieras para el admin

bcrypt.hash(miClave, 10, (err, hash) => {
    if (err) console.error(err);
    console.log("-----------------------------------------");
    console.log("ESTE ES TU HASH (CÓPIALO):");
    console.log(hash);
    console.log("-----------------------------------------");
});
