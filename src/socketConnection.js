/**
 * 
 * @param {*} io 
 */

module.exports = function (io) {
    let activeSockets = []

    io.sockets.on("error", e => console.log(e));

    io.sockets.on("connection", socket => {

        let config = JSON.parse(socket.handshake.query.config)

        activeSockets.find(host => {
            if (host.hostId === config.hostId) {
                io.in(host.socketID).disconnectSockets(true);
                return
            }
        });

        activeSockets.push({ hostId: config.hostId, host: config.host, socketID: socket.id });
        socket.emit("active-peer-sockets",activeSockets);

        socket.on("disconnect", () => {
            activeSockets = activeSockets.filter(function (obj) { return obj.socketID !== socket.id; });
            socket.emit("active-peer-sockets",activeSockets);
        });

        socket.on("peer-connection-call", (to) => {
            socket.to(to).emit("peer-connection-call", socket.id);
        });

        socket.on("peer-connection-candidate", (to, candidate) => {
            // console.log('peer-connection-candidate')
            socket.to(to).emit("peer-connection-candidate", candidate);
        });

        socket.on("peer-connection-offer", (to, offer) => {
            // console.log('peer-connection-offer')
            socket.to(to).emit("peer-connection-offer", socket.id, offer);
        });

        socket.on("peer-connection-answer", (to, answer) => {
            // console.log('peer-connection-answer')
            socket.to(to).emit("peer-connection-answer", answer);
        });

    });

};