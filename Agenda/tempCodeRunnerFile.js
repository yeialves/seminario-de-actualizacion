const express = require('express');
const mysql = require('mysql');

const app = express();

// Conexion mysql
const conexion = mysql.createConnection({
    host: "localhost",
    database: "Agenda",
    user: "root",
    password: "1234"
});

conexion.connect(function(err) {
    if (err) {
        throw err;
    } else {
        console.log("conexion existosa")
    }
});

// Motor de vista
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Definir la ruta inicial
app.get("/", function(req, res) {
    // Consultar los datos de la base de datos
    conexion.query("SELECT * FROM Contact", function(err, rows) {
        if (err) {
            res.status(500).json({ success: false, message: "Error al obtener los datos de la base de datos" });
            throw err;
        } else {
            // Renderizar la página registro.ejs con los datos recuperados
            res.render('registro', { data: rows });
        }
    });
});

//Mostrar estilos
app.use(express.static("public"));

// Ruta para validar y obtener datos
app.post("/validate", function (req, res) {
    const data = req.body;
    
    let name = data.Name;
    let surname = data.Surname;
    let phone = data.Phone;
    let address = data.Address;
    
    // Insertar datos en la tabla 'Contact'
    let registerContact = "INSERT INTO Contact(name, surname, phone, address) VALUES (?, ?, ?, ?)";
    // Insertar el número de teléfono en la tabla 'Phone'
    let addPhone = "INSERT INTO Phone(id, number) VALUES (NULL, ?)";
    // Insertar IDs en tabla ContactPhone
    let addContactPhone = "INSERT INTO ContactPhone(Contact_id, Phone_id) VALUES (?, ?)";

    // Ejecutar la consulta para insertar en la tabla 'Contact'
    conexion.query(registerContact, [name, surname, phone, address], function(err, resultContact){
        if(err){
            res.status(500).json({ success: false, message: "Error al guardar los datos de contacto en la base de datos" });
            throw err;
        } else {
            console.log("Datos de contacto almacenados correctamente");
            
            // Obtener el ID del contacto insertado
            let contactId = resultContact.insertId;

            // Ejecutar la consulta para insertar en la tabla 'Phone'
            conexion.query(addPhone, [phone], function(err, resultPhone){
                if(err){
                    res.status(500).json({ success: false, message: "Error al guardar el número de teléfono en la base de datos" });
                    throw err;
                } else {
                    console.log("Número de teléfono almacenado correctamente");
                    // Obtener el ID del teléfono insertado
                    let phoneId = resultPhone.insertId;

                    // Ejecutar la consulta para insertar en la tabla 'ContactPhone'
                    conexion.query(addContactPhone, [contactId, phoneId], function(err, resultAddContactPhone){
                        if(err){
                            res.status(500).json({ success: false, message: "Error al guardar la relación entre contacto y teléfono en la base de datos" });
                            throw err;
                        } else {
                            console.log("Relación entre contacto y teléfono almacenada correctamente");
                            // Redirigir al cliente a la página de registro después de guardar los datos
                            res.redirect("/");
                        }
                    });
                }
            });
        }
    });
});


// Ruta para eliminar un contacto
app.post("/delete/:id", function(req, res) {
    const contactId = req.params.id;

    // Construir la consulta para eliminar los registros de ContactPhone asociados al contacto
    let deleteContactPhoneQuery = "DELETE FROM ContactPhone WHERE Contact_id = ?";
    // Construir la consulta para eliminar el contacto por su ID
    let deleteContactQuery = "DELETE FROM Contact WHERE id = ?";
    // Construir la consulta para obtener los IDs de teléfonos asociados al contacto desde la tabla intermedia
    let selectPhoneIdsQuery = "SELECT Phone_id FROM ContactPhone WHERE Contact_id = ?";
    // Construir la consulta para eliminar los teléfonos asociados al contacto en la tabla 'Phone'
    let deletePhoneQuery = "DELETE FROM Phone WHERE id IN (?)";

    // Ejecutar la consulta para obtener los IDs de teléfonos asociados al contacto desde la tabla intermedia
    conexion.query(selectPhoneIdsQuery, [contactId], function(err, phoneIds) {
        if (err) {
            res.status(500).json({ success: false, message: "Error al obtener los IDs de teléfonos asociados al contacto desde la base de datos" });
            throw err;
        }

        // Extraer los IDs de teléfonos
        const phoneIdsArray = phoneIds.map(phone => phone.Phone_id);

        // Ejecutar la consulta para eliminar los registros de ContactPhone asociados al contacto
        conexion.query(deleteContactPhoneQuery, [contactId], function(err, resultContactPhone) {
            if (err) {
                res.status(500).json({ success: false, message: "Error al eliminar los registros de ContactPhone asociados al contacto en la base de datos" });
                throw err;
            } else {
                console.log("Registros de ContactPhone eliminados correctamente");

                // Ejecutar la consulta para eliminar el contacto por su ID
                conexion.query(deleteContactQuery, [contactId], function(err, resultContact) {
                    if (err) {
                        res.status(500).json({ success: false, message: "Error al eliminar los datos de contacto en la base de datos" });
                        throw err;
                    } else {
                        console.log("Datos de contacto eliminados correctamente");

                        // Ejecutar la consulta para eliminar los teléfonos asociados al contacto en la tabla 'Phone'
                        conexion.query(deletePhoneQuery, [phoneIdsArray], function(err, resultPhone) {
                            if (err) {
                                res.status(500).json({ success: false, message: "Error al eliminar los números de teléfono asociados al contacto en la base de datos" });
                                throw err;
                            } else {
                                console.log("Números de teléfono eliminados correctamente");
                                // Redirigir al cliente a la página de registro después de eliminar los datos
                                res.redirect("/");
                            }
                        });
                    }
                });
            }
        });
    });
});

// Ruta para modificar un contacto
app.post("/edit/:id", function(req, res) {
    const contactId = req.params.id;
    const newData = req.body; // Nuevos datos del contacto

    // Construir la consulta SQL para actualizar el contacto por su ID en la tabla Contact
    let editContactQuery = "UPDATE Contact SET name = ?, surname = ?, phone = ?, address = ? WHERE id = ?";
    // Construir la consulta SQL para actualizar el número de teléfono en la tabla Phone
    let editPhoneQuery = "UPDATE Phone SET number = ? WHERE id = (SELECT Phone_id FROM ContactPhone WHERE Contact_id = ?)";

    // Ejecutar la consulta SQL para actualizar el contacto por su ID en la tabla Contact
    conexion.query(editContactQuery, [newData.Name, newData.Surname, newData.Phone, newData.Address, contactId], function(err, result) {
        if (err) {
            res.status(500).json({ success: false, message: "Error al editar el contacto en la base de datos" });
            throw err;
        } else {
            console.log("Contacto editado correctamente en la tabla Contact");

            // Ejecutar la consulta SQL para actualizar el número de teléfono en la tabla Phone
            conexion.query(editPhoneQuery, [newData.Phone, contactId], function(err, resultPhone) {
                if (err) {
                    res.status(500).json({ success: false, message: "Error al editar el número de teléfono en la base de datos" });
                    throw err;
                } else {
                    console.log("Número de teléfono editado correctamente en la tabla Phone");
                    // Redirigir al cliente a la página de registro después de editar el contacto
                    res.redirect("/");
                }
            });
        }
    });
});

// Ruta para agregar un nuevo número de teléfono a un contacto existente
app.post("/add-phone/:id", function(req, res) {
    const contactId = req.params.id;
    const newPhone = req.body.Phone; // Nuevo número de teléfono

    // Insertar el nuevo número de teléfono en la tabla 'Phone'
    let addPhoneQuery = "INSERT INTO Phone (number) VALUES (?)";

    // Obtener el ID del nuevo número de teléfono insertado
    conexion.query(addPhoneQuery, [newPhone], function(err, resultPhone) {
        if (err) {
            res.status(500).json({ success: false, message: "Error al agregar el nuevo número de teléfono en la base de datos" });
            throw err;
        } else {
            console.log("Nuevo número de teléfono agregado correctamente en la tabla Phone");
            const phoneId = resultPhone.insertId;

            // Insertar la relación entre el contacto y el nuevo número de teléfono en la tabla 'ContactPhone'
            let addContactPhoneQuery = "INSERT INTO ContactPhone (Contact_id, Phone_id) VALUES (?, ?)";
            conexion.query(addContactPhoneQuery, [contactId, phoneId], function(err, resultContactPhone) {
                if (err) {
                    res.status(500).json({ success: false, message: "Error al agregar la relación entre el contacto y el número de teléfono en la base de datos" });
                    throw err;
                } else {
                    console.log("Relación entre el contacto y el nuevo número de teléfono agregada correctamente en la tabla ContactPhone");
                }
            });
        }
    });
});


// Levantar servidor
app.listen(3000, function() {
    console.log("El servidor es: http://localhost:3000");
});
