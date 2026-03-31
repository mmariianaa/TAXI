const mysql = require('mysql2');
// Configuración de la conexión a la base de datos
const connDB = mysql.createConnection({
    host: 'localhost',    
    user: 'root',
    password: '12345',
    database: 'TaxiDBtaxi9'
})
connDB.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos: ', err);
        return;
    }else {
        console.log('Conexión a la base de datos establecida');
    }                                                                               
});

exports.connDB = connDB;