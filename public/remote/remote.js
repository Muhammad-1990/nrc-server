/**
 * 
 */

'use-strict'

const wsConfig = { hostId: 'MAC-CPT-DEV02', host: 'client' }

const socket = io.connect(window.location.origin, {
    query: {
        'config': JSON.stringify(wsConfig)
    }
});

const remoteConnectionConfig = {
    iceServers: [
        {
            "urls": "stun:stun.l.google.com:19302",
        }
    ]
};


const remoteConnection = new RTCPeerConnection(remoteConnectionConfig);
remoteConnection.ondatachannel = e => {
    const dataChannel = e.channel;

    dataChannel.onopen = () => {
        console.log(`dataChannel '${dataChannel.label}' opened, sending message`);
        dataChannel.send('message from answerer');
        const video = document.getElementById("video");
        video.addEventListener('mousemove', e => {
            var posX = e.offsetX;
            var posY = e.offsetY;
            var xy = {x: posX, y: posY }
            dataChannel.send(JSON.stringify(xy));
        });
    };

    dataChannel.onmessage = e => {
        console.log('received:', e.data);
    };

    dataChannel.onerror = e => {
        console.log('error:', e);
    };

    dataChannel.onclose = () => {
        console.log('dataChannel closed');
    };
};


socket.on("peer-connection-candidate", (candidate) => {
    remoteConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("peer-connection-offer", async (from, description) => {

    remoteConnection.addEventListener("icecandidate", async (event) => {
        if (event.candidate) {
            await socket.emit("peer-connection-candidate", from, event.candidate);
        }
    });

    startReceiving();

    await remoteConnection.setRemoteDescription(description);

    const answer = await remoteConnection.createAnswer();

    await remoteConnection.setLocalDescription(answer);

    socket.emit("peer-connection-answer", from, remoteConnection.localDescription);

});

socket.on("active-peer-sockets", (activePeerSockets) => {
    socket.emit("peer-connection-call", activePeerSockets[0].socketID);
});

const startReceiving = () => {
    const video = document.getElementById("video");
    const stream = new MediaStream();
    video.srcObject = stream;

    remoteConnection.addEventListener("track", (event) => {
        stream.addTrack(event.track);
    });
};


window.onunload = window.onbeforeunload = () => {
    remoteConnection.close();
    delete remoteConnection;
    socket.close();
};