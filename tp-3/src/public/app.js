function init() {
  const socket = io();
  const secretKey = 'ClaveSuperDuperSecreta16'; 

  const friends = {
    all: document.querySelectorAll('.person'),
  };

  let chat = {
    current:null,
    person: null,
  };

  // Asignar oyentes a cada persona para cambiar el chat activo
  friends.all.forEach(f => {
    f.addEventListener('click', () => {
      setActiveChat(f);
    });
  });
  

  // Asignar oyente a los botones de borrar chat
  document.querySelectorAll('.delete-chat-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const chatToDelete = e.target.closest('.chat').getAttribute('data-chat');
      deleteChat(chatToDelete);
    });
  });

  document.getElementById('sendButton').addEventListener('click', sendMessage);
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });


  function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return; 

    const chatKey = `chat_${chat.person}`;

    // Cifrar el mensaje
    const encryptedMessage = CryptoJS.AES.encrypt(message, secretKey).toString();

    // Guardar mensaje en localStorage como enviado por el cliente
    const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    messages.push({ message: encryptedMessage, fromSelf: true }); 

    // Emitir el mensaje a través de socket, incluyendo el socket.id
    socket.emit('chat_message', { person: chat.person, message: encryptedMessage, socketId: socket.id });
    input.value = ''; 
}

socket.on('chat_message', data => {
  if (!chat.current || chat.person !== data.person) {
    console.warn("Message received but no matching active chat.");
    return; 
  }

  // Verificar que el mensaje no venga del mismo cliente
  if (data.socketId !== socket.id) {
    const decryptedMessage = CryptoJS.AES.decrypt(data.message, secretKey).toString(CryptoJS.enc.Utf8);
    if (decryptedMessage) {
      addMessage(decryptedMessage, false); 
      const chatKey = `chat_${data.person}`;
      const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
      messages.push({ message: data.message, fromSelf: false });
      localStorage.setItem(chatKey, JSON.stringify(messages));
    }
  } else {
    const decryptedMessage = CryptoJS.AES.decrypt(data.message, secretKey).toString(CryptoJS.enc.Utf8);
    if (decryptedMessage) {
      addMessage(decryptedMessage, true);
    }
  }
});

function addMessage(message, fromSelf = false, target = chat.current?.querySelector('.chat-messages')) {
  if (!chat.current) {
    console.warn("No chat selected. Message not displayed.");
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('bubble', fromSelf ? 'me' : 'you');
  messageDiv.textContent = message;

  target.appendChild(messageDiv);
  target.scrollTop = target.scrollHeight; 
}

function loadChatHistory(person) {
  const chatKey = `chat_${person}`; 
  const messages = JSON.parse(localStorage.getItem(chatKey)) || [];
  
  // Limpiar mensajes actuales antes de cargar el historial
  const target = chat.current.querySelector('.chat-messages');
  target.innerHTML = '';

  messages.forEach(msg => {
      // Descifrar el mensaje antes de agregarlo
      let decryptedMessage;
      try {
          decryptedMessage = CryptoJS.AES.decrypt(msg.message, secretKey).toString(CryptoJS.enc.Utf8);
      } catch (e) {
          console.error('Error al descifrar el mensaje:', e);
          decryptedMessage = msg.message; 
      }
      addMessage(decryptedMessage, msg.fromSelf, target);
  });
}

  // Mostrar/hacer visible el input solo cuando un chat está seleccionado
  const chatInputContainer = document.getElementById('chatInputContainer'); 
  chatInputContainer.style.display = 'none'; 

  function setActiveChat(f) {
    const active = document.querySelector('.active-chat');
    const activePerson = document.querySelector('.person.active');
  
    if (active) {
        active.classList.remove('active-chat');
        active.style.display = 'none'; 
    }
  
    if (activePerson) {
        activePerson.classList.remove('active');
    }
  
    chat.person = f.getAttribute('data-chat');
    chat.current = document.querySelector(`.chat[data-chat="${chat.person}"]`);
  
    if (chat.current) {
        chat.current.classList.add('active-chat');
        chat.current.style.display = 'block'; 
        loadChatHistory(chat.person); 
        chatInputContainer.style.display = 'block'; 
        
        // Ocultar todos los botones de borrar chat
        document.querySelectorAll('.delete-chat-button').forEach(button => {
            button.style.display = 'none';
        });

        // Mostrar el botón de borrar solo en el chat activo
        const activeDeleteButton = chat.current.querySelector('.delete-chat-button');
        if (activeDeleteButton) {
            activeDeleteButton.style.display = 'block'; 
        }
    } else {
        console.error(`No se encontró un chat para: ${chat.person}`);
        chatInputContainer.style.display = 'none'; 
    }
  
    f.classList.add('active');
}

  

  function deleteChat(person) {
    const chatKey = `chat_${person}`; 

    // Borrar los mensajes de localStorage
    localStorage.removeItem(chatKey);

    // Limpiar el historial de mensajes en la interfaz
    const chatElement = document.querySelector(`.chat[data-chat="${person}"] .chat-messages`);
    chatElement.innerHTML = ''; 

    const chatContainer = document.querySelector(`.chat[data-chat="${person}"]`);
    if (chatContainer) {
      chatContainer.style.display = 'none'; 
    }

    console.log(`Chat con ${person} borrado.`);
  }
  
}

document.addEventListener('DOMContentLoaded', init);
