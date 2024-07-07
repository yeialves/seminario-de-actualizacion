// Cuando se carga el DOM, se inicia la carga de usuarios y se configura el formulario de registro
document.addEventListener('DOMContentLoaded', function() {
    fetchUsers(); // Obtener y mostrar usuarios existentes

    // Configurar el evento de envío del formulario de registro
    document.getElementById('registerForm').addEventListener('submit', async function(event) {
        event.preventDefault(); // Prevenir el envío del formulario

        // Obtener los valores del formulario
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const groups = Array.from(document.getElementById('groups').selectedOptions).map(option => option.value);
        
        try {
            // Enviar la solicitud POST al servidor para registrar el usuario
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, groups })
            });
            const data = await response.json(); // Obtener la respuesta del servidor en formato JSON
            
            if (response.ok) {
                alert(data.message); // Mostrar mensaje de éxito
                await fetchUsers(); // Actualizar la lista de usuarios mostrada
                document.getElementById('registerForm').reset(); // Reiniciar el formulario
            } else {
                alert(data.error || "Error registering user"); // Mostrar mensaje de error si falla el registro
            }
        } catch (error) {
            console.error('Error registering user:', error); // Registrar error en la consola
            alert("Error registering user"); // Mostrar mensaje de error genérico al usuario
        }
    });
});

// Función asincrónica para obtener y mostrar usuarios desde el servidor
async function fetchUsers() {
    try {
        const response = await fetch('/users'); // Obtener la lista de usuarios desde el servidor
        const data = await response.json(); // Convertir la respuesta a JSON

        // Obtener la tabla de usuarios del DOM
        const tableBody = document.getElementById('userTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; // Limpiar contenido existente

        // Iterar sobre cada usuario obtenido y agregarlo a la tabla
        data.forEach(user => {
            let row = tableBody.insertRow(); // Insertar una nueva fila
            let cell1 = row.insertCell(0); // Insertar celdas para nombre de usuario, grupos y acciones
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);

            cell1.textContent = user.username; // Agregar nombre de usuario a la celda 1

            let groupNames = user.groups.join(', '); // Obtener nombres de grupo separados por coma
            cell2.textContent = groupNames; // Agregar nombres de grupo a la celda 2

            let dropdown = document.createElement('select'); // Crear un nuevo elemento select para acciones
            dropdown.className = 'action-dropdown'; // Asignar clase para estilos CSS

            // Agregar opciones para cada acción asociada al usuario
            user.actions.forEach(action => {
                let option = document.createElement('option');
                option.textContent = action;
                dropdown.appendChild(option);
            });

            cell3.appendChild(dropdown); // Agregar el select de acciones a la celda 3
        });
    } catch (error) {
        console.error('Error fetching users:', error); // Registrar error en la consola
    }
}

// Función asincrónica para obtener y mostrar acciones disponibles
async function fetchActions() {
    try {
        const responseGroups = await fetch('/groups'); // Obtener la lista de grupos desde el servidor
        const groups = await responseGroups.json(); // Convertir la respuesta a JSON

        // Obtener todos los selectores de acciones en la página
        const actionSelects = document.querySelectorAll('.action-dropdown');

        // Iterar sobre cada selector de acciones y obtener las acciones asociadas a cada grupo
        actionSelects.forEach(async (select, index) => {
            const group = groups[index]; // Obtener el grupo correspondiente al índice actual

            if (group) {
                // Obtener las acciones asociadas al grupo desde el servidor
                const responseActions = await fetch('/group-actions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupName: group.name }) // Enviar nombre del grupo al servidor
                });

                const actions = await responseActions.json(); // Convertir la respuesta a JSON

                // Limpiar el select y agregar las nuevas opciones de acciones disponibles
                select.innerHTML = '';
                actions.forEach(action => {
                    const option = document.createElement('option');
                    option.textContent = action.name;
                    select.appendChild(option);
                });
            }
        });
    } catch (error) {
        console.error('Error fetching actions:', error); // Registrar error en la consola
    }
}

// Configurar el evento de envío del formulario de añadir acción
document.getElementById('actionForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevenir el envío del formulario

    // Obtener los valores del formulario
    const name = document.getElementById('actionName').value;
    const description = document.getElementById('actionDescription').value;
    const groupName = document.getElementById('group').value; // Obtener el nombre del grupo seleccionado

    try {
        // Enviar la solicitud POST al servidor para añadir una nueva acción al grupo seleccionado
        const response = await fetch('/add-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, groupName })
        });

        const data = await response.json(); // Obtener la respuesta del servidor en formato JSON

        if (response.ok) {
            alert(data.message); // Mostrar mensaje de éxito
            await fetchActions(); // Actualizar las acciones mostradas
            await fetchUsers(); // Actualizar la lista de usuarios
            document.getElementById('actionForm').style.display = 'none'; // Ocultar el formulario de añadir acción
        } else {
            alert(data.error || "Error adding action"); // Mostrar mensaje de error si falla la operación
        }
    } catch (error) {
        console.error('Error adding action:', error); // Registrar error en la consola
        alert("Error adding action"); // Mostrar mensaje de error genérico al usuario
    }
});

// Función asincrónica para cargar y mostrar los grupos disponibles al cargar la página
async function loadGroups() {
    try {
        const response = await fetch('/groups'); // Obtener la lista de grupos desde el servidor
        const groups = await response.json(); // Convertir la respuesta a JSON
        const select = document.getElementById('groups'); // Obtener el select de grupos del formulario

        select.innerHTML = ''; // Limpiar opciones existentes

        // Iterar sobre cada grupo y agregarlo como una opción en el select
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            select.appendChild(option);
        });

        await fetchUsers(); // Obtener y mostrar usuarios actualizados
    } catch (error) {
        console.error('Error loading groups:', error); // Registrar error en la consola
    }
}

// Configurar el evento de envío del formulario de añadir nuevo grupo
document.getElementById('newGroupForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevenir el envío del formulario

    // Obtener los valores del formulario
    const groupName = document.getElementById('groupName').value;
    const groupDescription = document.getElementById('groupDescription').value;

    try {
        // Enviar la solicitud POST al servidor para añadir un nuevo grupo
        const response = await fetch('/add-group', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: groupName, description: groupDescription })
        });

        const data = await response.json(); // Obtener la respuesta del servidor en formato JSON

        if (response.ok) {
            alert(data.message); // Mostrar mensaje de éxito
            await loadGroups(); // Actualizar la lista de grupos mostrada
            document.getElementById('groupForm').style.display = 'none'; // Ocultar el formulario de añadir grupo

            // Limpiar formulario una vez que se ha añadido el grupo
            document.getElementById('newGroupForm').reset();
        } else {
            alert(data.error || "Error adding group"); // Mostrar mensaje de error si falla la operación
        }
    } catch (error) {
        console.error('Error adding group:', error); // Registrar error en la consola
        alert("Error adding group"); // Mostrar mensaje de error genérico al usuario
    }
});

// Función asincrónica para cargar grupos al cargar el DOM por primera vez
document.addEventListener('DOMContentLoaded', loadGroups);

// Función asincrónica para mostrar u ocultar el formulario de añadir nuevo grupo
async function toggleGroupForm() {
    const groupForm = document.getElementById('groupForm');
    groupForm.style.display = groupForm.style.display === 'block' ? 'none' : 'block'; // Alternar visibilidad del formulario
}

// Función asincrónica para mostrar u ocultar el formulario de añadir nueva acción
async function toggleActionForm() {
    const actionForm = document.getElementById('actionForm');
    
    if (actionForm.style.display === 'block') {
        actionForm.style.display = 'none'; // Ocultar formulario si ya está visible
    } else {
        actionForm.style.display = 'block'; // Mostrar formulario si está oculto
        document.getElementById('groupForm').style.display = 'none'; // Ocultar formulario de grupo si está visible

        try {
            // Obtener la lista de grupos desde el servidor y actualizar el select de grupos
            const response = await fetch('/groups');
            const groups = await response.json();
            const select = document.getElementById('group');
            select.innerHTML = ''; // Limpiar opciones existentes en el select

            // Iterar sobre cada grupo y agregarlo como una opción en el select
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.name;
                option.textContent = group.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading groups:', error); // Registrar error en la consola
            alert('Error loading groups'); // Mostrar mensaje de error al usuario
        }
    }
}

// Cargar acciones disponibles al cargar el DOM por primera vez
document.addEventListener('DOMContentLoaded', function() {
    fetchActions(); // Obtener y mostrar acciones disponibles
});
