module.exports = io => {
  io.on('connection', socket => {
    // Manejar el evento de mensajes de chat
    socket.on('chat_message', message => {
      // Añadir el ID del socket al mensaje para identificar al remitente
      message.socketId = socket.id; 
      // Enviar el mensaje a todos los clientes
      io.emit('chat_message', message);
    });
  });
};