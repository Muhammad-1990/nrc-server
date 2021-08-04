/**
 * 
 */

'use-strict'

const wsConfig = { hostId: '1CG-CPT-DEV02', host: 'client' }

const socket = io.connect(window.location.origin, {
    query: {
        'config': JSON.stringify(wsConfig)
    }
});

const localConnectionConfig = {
    iceServers: [
        {
            "urls": "stun:stun.l.google.com:19302",
        },
    ]
};

const localConnection = new RTCPeerConnection(localConnectionConfig);
const dataChannel = localConnection.createDataChannel('mydatachannel');

dataChannel.onopen = () => {
    console.log('dataChannel opened, sending message');
    dataChannel.send('message from offerer');
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


socket.on("peer-connection-candidate", (candidate) => {
    localConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("peer-connection-answer", (description) => {
    localConnection.setRemoteDescription(description);
});

socket.on("peer-connection-call", async (from) => {
    
    localConnection.addEventListener("icecandidate", async (event) => {
        if (event.candidate) {
            await socket.emit("peer-connection-candidate", from, event.candidate);
        }
    });

    await startStreaming();

    const offer = await localConnection.createOffer();
    
    await localConnection.setLocalDescription(offer);

    socket.emit("peer-connection-offer", from, localConnection.localDescription);

});

const startStreaming = async () => {
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                minWidth: 1920,
                maxWidth: 1920,
                minHeight: 1080,
                maxHeight: 1080,
                minFrameRate: 60,
                maxFrameRate: 60,
                logicalSurface: true,
                resizeMode: "crop-and-scale"
            },
           
        }
    };

    const stream = await navigator.mediaDevices.getDisplayMedia();

    for (const track of stream.getTracks()) {
        localConnection.addTrack(track);
    }

};


window.onunload = window.onbeforeunload = () => {
    localConnection.close();
    delete localConnection;
    socket.close();
};