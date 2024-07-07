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
        res.status(200).json(results);
    });
});