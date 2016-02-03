'use strict';

var TUTUM_USER = process.env.TUTUM_USER || '';
var TUTUM_API_KEY = process.env.TUTUM_API_KEY || '';

var HIPCHAT_ROOM = process.env.HIPCHAT_ROOM || '';
var HIPCHAT_API_KEY = process.env.HIPCHAT_API_KEY || '';

var TUTUM_HTTP_API = 'https://dashboard.tutum.co';
var TUTUM_STREAM_API = 'wss://stream.tutum.co/v1/events';

var WebSocket = require('faye-websocket');
var HipChatClient = require('hipchat-client');
var hipchat = new HipChatClient(HIPCHAT_API_KEY);
var request = require('request-json');
var client = request.createClient();

var sendDefaultMessage = function(msg) {

    client.get(TUTUM_HTTP_API + msg.resource_uri, function (error, response, body) {

        var obj = {
            'type': msg.type,
            'state': msg.state,
            'container': body.name
        };
        sendMessage(JSON.stringify(obj));
    });
};

var sendContainerMessage = function(msg) {

    client.get(TUTUM_HTTP_API + msg.resource_uri, function (error, response, body) {

        var container = body;
        var obj = {
            'type': msg.type,
            'state': msg.state,
            'container': body.name
        };
        sendMessage(JSON.stringify(container));
    });

};

var sendServiceMessage = function(msg) {

    sendMessage(JSON.stringify(msg));
};

var sendStackMessage = function(msg) {

    sendMessage(JSON.stringify(msg));
};

var sendNodeClusterkMessage = function(msg) {

    sendMessage(JSON.stringify(msg));
};

var sendNodeMessage = function(msg) {

    sendMessage(JSON.stringify(msg));
};

var sendActionMessage = function(msg) {

    sendMessage(JSON.stringify(msg));
};

var sendErrorMessage = function(msg) {

    sendMessage(JSON.stringify(msg));
};

var sendMessage = function(message){
    hipchat.api.rooms.message({
        room_id: HIPCHAT_ROOM,
        from: 'Tutum Stream',
        color: 'gray',
        message: message
    }, function (err, res) {
        if (err) { throw err; }
        console.log(res);
    });
};

var ws = new WebSocket.Client(TUTUM_STREAM_API, null, {
    headers: {
        'Authorization': 'Basic ' + new Buffer(TUTUM_USER + ':' + TUTUM_API_KEY).toString('base64')
    }
});

ws.on('open', function(event) {
    console.log('Stream open');
});

ws.on('message', function(event) {
    var msg = JSON.parse(event.data);
    console.log(msg);

    if (msg.type == 'container') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'service') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'stack') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'nodecluster') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'node') {
        sendNodeMessage(msg);
    }
    else if (msg.type == 'action') {
        // skip action messages
        // sendActionMessage(msg);
    }
    else if (msg.type == 'error') {
        sendErrorMessage(msg);
    }
    else {
        sendMessage(JSON.stringify(msg));
    }

});

ws.on('close', function(event) {
    console.log('Stream close', event.code, event.reason);
    ws = null;
});
