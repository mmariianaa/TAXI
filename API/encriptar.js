const bcrypt = require('bcrypt');
<<<<<<< HEAD
const miClave = 'admin123'; // <--- Pon aquí la contraseña que quieras para el admin
=======
const miClave = 'admin1234'; // <--- Pon aquí la contraseña que quieras para el admin
>>>>>>> Monybbranch

bcrypt.hash(miClave, 10, (err, hash) => {
    if (err) console.error(err);
    console.log("-----------------------------------------");
    console.log("ESTE ES TU HASH (CÓPIALO):");
    console.log(hash);
    console.log("-----------------------------------------");
<<<<<<< HEAD
});
=======
});
>>>>>>> Monybbranch
