const express = require('express');
const mysql = require('mysql');
const path = require('path');
const { users, group, action } = require('./data.json'); // Importación de datos estáticos
const bodyParser = require('body-parser');

const app = express();

// Configuración para analizar solicitudes JSON
app.use(bodyParser.json());

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal que sirve el archivo HTML inicial
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Configuración de la conexión MySQL
const connection = mysql.createConnection({
    host: "localhost",
    database: "AccessControl",
    user: "root",
    password: "1234"
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }
    console.log('Connected to database as id ' + connection.threadId);
    insertUserData();
});

// Función para insertar datos de usuarios en la base de datos
function insertUserData() {
    const userValues = users.map(user => [user.id, user.username, user.password]);
    const userSql = 'INSERT INTO User (id, username, password) VALUES ?';
    connection.query(userSql, [userValues], (error, results) => {
        if (error) {
            console.error('Error inserting user data: ' + error);
            return;
        }
        console.log('User data inserted into database successfully');
        insertActionData();
    });
}

// Función para insertar acciones 
function insertActionData() {
    const actionValues = action.map(a => [a.id, a.name, a.description]);
    const actionSql = 'INSERT INTO Action (id, name, description) VALUES ?';
    connection.query(actionSql, [actionValues], (error, results) => {
        if (error) {
            console.error('Error inserting action data: ' + error);
            return;
        }
        console.log('Action data inserted into database successfully');
        insertGroupData();
    });
}

// Función para insertar grupos 
function insertGroupData() {
    const groupValues = group.map(g => [g.id, g.name, g.description]);
    const groupSql = 'INSERT INTO `Group` (id, name, description) VALUES ?'; // `Group` es una palabra clave reservada en MySQL, se utilizan comillas invertidas
    connection.query(groupSql, [groupValues], (error, results) => {
        if (error) {
            console.error('Error inserting group data: ' + error);
            return;
        }
        console.log('Group data inserted into database successfully');
        insertUserGroupData();
    });
}

// Función para insertar datos en la tabla intermedia 'user_group'
function insertUserGroupData() {
    const userGroupValues = [];
    users.forEach(user => {
        if (user.group) {
            user.group.forEach(groupId => {
                userGroupValues.push([user.id, groupId]);
            });
        }
    });

    const userGroupSql = 'INSERT INTO User_Group (user_id, group_id) VALUES ? ON DUPLICATE KEY UPDATE user_id=user_id';
    connection.query(userGroupSql, [userGroupValues], (error, results) => {
        if (error) {
            console.error('Error inserting user_has_group data: ' + error);
            return;
        }
        console.log('User-Group association data inserted into database successfully');
        insertGroupActionData();
    });
}

// Función para insertar datos en la tabla intermedia 'group_action'
function insertGroupActionData() {
    const groupActionValues = [];

    group.forEach(g => {
        if (g.name === 'Admin') {
            action.forEach(a => {
                groupActionValues.push([g.id, a.id]);
            });
        } else if (g.name === 'User') {
            const allowedActions = [1, 2, 6];
            allowedActions.forEach(actionId => {
                groupActionValues.push([g.id, actionId]);
            });
        } else if (g.name === 'Guest') {
            groupActionValues.push([g.id, 6]);
        }
    });

    const groupActionSql = 'INSERT INTO Action_Group (group_id, action_id) VALUES ? ON DUPLICATE KEY UPDATE group_id=group_id';
    connection.query(groupActionSql, [groupActionValues], (error, results) => {
        if (error) {
            console.error('Error inserting Group_action data: ' + error);
            return;
        }
        console.log('Group-Action association data inserted into database successfully');
    });
}

// Endpoint para registrar usuarios
app.post('/register', (req, res) => {
    const { username, password, groups } = req.body;

    if (!username || !password || !Array.isArray(groups)) {
        return res.status(400).json({ error: "Username, password, and groups are required" });
    }

    connection.query('CALL InsertUser(?, ?)', [username, password], (error, results, fields) => {
        if (error) {
            console.error('Error calling InsertUser:', error);
            return res.status(500).json({ error: 'Error registering user: ' + error.message });
        }

        if (!results || results.length === 0 || !results[0][0].insertId) {
            console.error('No valid result set returned from InsertUser:', results);
            return res.status(500).json({ error: 'Error registering user: No valid insertId returned' });
        }

        const userId = results[0][0].insertId;

        console.log('Inserted user ID:', userId);

        const userGroupValues = groups.map(groupId => [userId, groupId]);

        connection.query('INSERT INTO User_Group (user_id, group_id) VALUES ?', [userGroupValues], (err, result) => {
            if (err) {
                console.error('Error inserting into User_Group:', err);
                return res.status(500).json({ error: 'Error assigning groups: ' + err.message });
            }
            res.status(200).json({ message: 'User registered successfully' });
        });
    });
});


// Endpoint para obtener todos los usuarios con sus grupos y acciones
app.get('/users', (req, res) => {
    const sql = `
        SELECT u.username, GROUP_CONCAT(DISTINCT g.name ORDER BY g.name) AS groups, GROUP_CONCAT(DISTINCT a.name ORDER BY a.name) AS actions
        FROM User u
        LEFT JOIN User_Group ug ON u.id = ug.user_id 
        LEFT JOIN \`Group\` g ON ug.group_id = g.id
        LEFT JOIN Action_Group ag ON g.id = ag.group_id
        LEFT JOIN Action a ON ag.action_id = a.id
        GROUP BY u.username`;

    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching users: ' + error);
            return res.status(500).send('Error fetching users');
        }
        res.status(200).json(results.map(row => ({
            username: row.username,
            groups: row.groups ? row.groups.split(',') : [],
            actions: row.actions ? row.actions.split(',') : []
        })));
    });
});

// Endpoint para obtener las acciones de un usuario específico
app.post('/user-actions', (req, res) => {
    const { username } = req.body;
    
    const sql = `
        SELECT a.name 
        FROM User u
        JOIN User_Group ug ON u.id = ug.user_id
        JOIN \`Group\` g ON ug.group_id = g.id
        JOIN Action_Group ag ON g.id = ag.group_id
        JOIN Action a ON ag.action_id = a.id
        WHERE u.username = ?`;

    connection.query(sql, [username], (error, results) => {
        if (error) {
            console.error('Error fetching user actions:', error);
            return res.status(500).send('Error fetching user actions');
        }
        res.status(200).json(results.map(row => ({ name: row.name })));
    });
}); 

// Endpoint para agregar un nuevo grupo
app.post('/add-group', (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Group name is required" });
    }

    // Verificar si ya existe un grupo con el mismo nombre
    connection.query("SELECT id FROM `Group` WHERE name = ?", [name], (selectError, selectResults) => {
        if (selectError) {
            console.error('Error checking group name:', selectError);
            return res.status(500).json({ error: "Internal server error" });
        }

        if (selectResults.length > 0) {
            return res.status(409).json({ error: "A group with the same name already exists" });
        }

        // Insertar el nuevo grupo en la base de datos
        connection.query("INSERT INTO `Group` (name, description) VALUES (?, ?)", [name, description], (insertError, insertResults) => {
            if (insertError) {
                console.error('Error adding group:', insertError);
                return res.status(500).send('Error adding group');
            }
            res.status(201).json({ message: "Group added successfully", id: insertResults.insertId });
        });
    });
});

// Endpoint para obtener todos los grupos
app.get('/groups', (req, res) => {
    connection.query("SELECT id, name FROM `Group`", (error, results) => {
        if (error) {
            console.error('Error fetching groups:', error);
            return res.status(500).send('Error fetching groups');
        }
        res.status(200).json(results);
    });
});

// Endpoint para obtener las acciones de un grupo específico
app.post('/group-actions', (req, res) => {
    const { groupName } = req.body;

    const sql = `
        SELECT a.name 
        FROM \`Group\` g
        JOIN Action_Group ag ON g.id = ag.group_id
        JOIN Action a ON ag.action_id = a.id
        WHERE g.name = ?`;

    connection.query(sql, [groupName], (error, results) => {
        if (error) {
            console.error('Error fetching group actions:', error);
            return res.status(500).send('Error fetching group actions');
        }
        res.status(200).json(results.map(row => ({ name: row.name })));
    });
});

// Endpoint para agregar una nueva acción a un grupo
app.post('/add-action', (req, res) => {
    const { name, description, groupName } = req.body;

    // Validar que se proporcionen el nombre de la acción y el nombre del grupo
    if (!name || !groupName) {
        return res.status(400).json({ error: "Action name and group name are required" });
    }

    // Obtener el ID del grupo basado en el nombre proporcionado
    connection.query("SELECT id FROM `Group` WHERE name = ?", [groupName], (selectError, selectResults) => {
        if (selectError) {
            console.error('Error checking group name:', selectError);
            return res.status(500).json({ error: "Internal server error" });
        }

        if (selectResults.length === 0) {
            return res.status(404).json({ error: "Group not found" });
        }

        const groupId = selectResults[0].id;

        // Insertar la nueva acción en la tabla Action
        connection.query("INSERT INTO Action (name, description) VALUES (?, ?)", [name, description], (insertError, insertResults) => {
            if (insertError) {
                console.error('Error adding action:', insertError);
                return res.status(500).send('Error adding action');
            }

            const actionId = insertResults.insertId;

            // Asociar la acción con el grupo en la tabla Action_Group
            connection.query("INSERT INTO Action_Group (action_id, group_id) VALUES (?, ?)", [actionId, groupId], (error, results) => {
                if (error) {
                    console.error('Error associating action with group:', error);
                    return res.status(500).json({ error: "Internal server error during action association" });
                }
                res.status(201).json({ message: "Action added successfully", id: actionId });
            });
        });
    });
});

// Iniciar el servidor
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
