document.addEventListener('DOMContentLoaded', function() {
    fetchUsers();
    fetchActions();
    loadGroups();

    document.getElementById('registerForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const groups = Array.from(document.getElementById('groups').selectedOptions).map(option => option.value);

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, groups })
            });
            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                await fetchUsers(); // Actualizar la lista de usuarios mostrada
                document.getElementById('registerForm').reset(); // Reiniciar el formularios
            } else {
                alert(data.error || "Error registering user");
            }
        } catch (error) {
            console.error('Error registering user:', error);
            alert("Error registering user");
        }
    });

    document.getElementById('newGroupForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const groupName = document.getElementById('groupName').value;
        const groupDescription = document.getElementById('groupDescription').value;

        try {
            const response = await fetch('/add-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: groupName, description: groupDescription })
            });
            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                await loadGroups();
                document.getElementById('groupForm').style.display = 'none';

                // Limpiar formulario una vez que se mandaron los datos
                document.getElementById('newGroupForm').reset();
            } else {
                alert(data.error || "Error adding group");
            }
        } catch (error) {
            console.error('Error adding group:', error);
            alert("Error adding group");
        }
    });

    document.getElementById('actionForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const name = document.getElementById('actionName').value;
        const description = document.getElementById('actionDescription').value;
        const groupName = document.getElementById('group').value; // Obtener el nombre del grupo

        try {
            const response = await fetch('/add-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, groupName })
            });
            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                await fetchActions(); // Actualizar las acciones disponibles
                await fetchUsers(); // Actualizar la tabla de usuarios
                document.getElementById('actionForm').style.display = 'none';
            } else {
                alert(data.error || "Error adding action");
            }
        } catch (error) {
            console.error('Error adding action:', error);
            alert("Error adding action");
        }
    });
});

async function fetchUsers() {
    try {
        const response = await fetch('/users');
        const data = await response.json();

        const tableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
        data.forEach(user => {
            let row = tableBody.insertRow();
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);

            cell1.textContent = user.username;

            let groupNames = user.groups.join(', ');
            cell2.textContent = groupNames;

            let dropdown = document.createElement('select');
            dropdown.className = 'action-dropdown';
            user.actions.forEach(action => {
                let option = document.createElement('option');
                option.textContent = action;
                dropdown.appendChild(option);
            });
            cell3.appendChild(dropdown);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

async function fetchActions() {
    try {
        // Solicita todos los grupos
        const responseGroups = await fetch('/groups');
        if (!responseGroups.ok) throw new Error('Error fetching groups');
        const groups = await responseGroups.json();

        const actionSelects = document.querySelectorAll('.action-dropdown');
        // Itera sobre cada select y grupo para solicitar las acciones correspondientes
        actionSelects.forEach(async (select, index) => {
            const group = groups[index];
            if (group) {
                const responseActions = await fetch('/group-actions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupName: group.name })
                });
                if (!responseActions.ok) throw new Error('Error fetching group actions');
                const actions = await responseActions.json();

                select.innerHTML = '';
                actions.forEach(action => {
                    const option = document.createElement('option');
                    option.textContent = action.name;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error fetching actions:', error);
    }
}

async function loadGroups() {
    try {
        const response = await fetch('/groups');
        const groups = await response.json();
        const select = document.getElementById('groups');
        
        select.innerHTML = '';

        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            select.appendChild(option);
        });

        await fetchUsers();
        
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

async function toggleGroupForm() {
    const groupForm = document.getElementById('groupForm');
    groupForm.style.display = groupForm.style.display === 'block' ? 'none' : 'block';
}

async function toggleActionForm() {
    const actionForm = document.getElementById('actionForm');
    if (actionForm.style.display === 'block') {
        actionForm.style.display = 'none';
    } else {
        actionForm.style.display = 'block';
        document.getElementById('groupForm').style.display = 'none';

        try {
            const response = await fetch('/groups');
            const groups = await response.json();
            const select = document.getElementById('group');
            select.innerHTML = '';
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.name;
                option.textContent = group.name; 
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading groups:', error);
            alert('Error loading groups');
        }
    }
}
