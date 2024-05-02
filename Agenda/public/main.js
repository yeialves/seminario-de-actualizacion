// Función para enviar los datos del formulario mediante Fetch API
function sendData(url, formData, formId) {
    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Error al enviar los datos");
        }
        // Limpiar los campos del formulario después de enviar los datos
        document.getElementById(formId).reset(); // Resetear el formulario
    })
    .catch(error => {
        console.error("Error:", error);
    });
}

// Evento clic para mostrar el formulario de agregar teléfono
document.querySelectorAll(".show-form-button").forEach(button => {
    button.addEventListener("click", function(event) {
        event.preventDefault(); // Evitar que el botón ejecute su acción predeterminada
        
        // Ocultar la imagen del botón
        this.style.display = "none";
        
        // Obtener el formulario correspondiente
        const form = this.nextElementSibling;
        
        // Mostrar el formulario
        form.style.display = "block";
    });
});

// Evento clic para cerrar el formulario
document.querySelectorAll(".close-form").forEach(button => {
    button.addEventListener("click", function(event) {
        event.preventDefault(); 
        
        // Obtener la clase del formulario asociado con este botón de cierre
        const formClass = this.dataset.formClass;

        // Ocultar el formulario correspondiente
        const form = document.querySelector(`.${formClass}`);
        form.style.display = "none";

        // Mostrar nuevamente el botón de mostrar formulario
        const showFormButton = form.previousElementSibling;
        showFormButton.style.display = "inline";
    });
});

// Evento clic para mostrar el formulario de edit
document.querySelectorAll(".show-edit-button").forEach(button => {
    button.addEventListener("click", function(event) {
        event.preventDefault(); 
      
        this.style.display = "none";
   
        const form = this.nextElementSibling;
  
        form.style.display = "block";
    });
});
