module.exports = io => {
  io.on('connection', socket => {
    // Identificar al usuario que se conectó
    const username = 'NombreUsuario'; // Cambiar por el nombre real del usuario conectado
    io.emit('user_status', { person: username, status: 'online' });
  
    socket.on('disconnect', () => {
      // Emitir el evento cuando el usuario se desconecta
      io.emit('user_status', { person: username, status: 'offline' });
    });
  
    // Escuchar por eventos de mensajes
    socket.on('chat_message', message => {
      message.socketId = socket.id; 
      io.emit('chat_message', message);
    });
  });
};