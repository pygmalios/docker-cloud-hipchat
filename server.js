'use strict';

var DOCKER_CLOUD_USER = process.env.DOCKER_CLOUD_USER || '';
var DOCKER_CLOUD_API_KEY = process.env.DOCKER_CLOUD_API_KEY || '';

var HIPCHAT_ROOM = process.env.HIPCHAT_ROOM || '';
var HIPCHAT_API_KEY = process.env.HIPCHAT_API_KEY || '';

var DOCKER_CLOUD_HTTP_API = 'https://cloud.docker.com';
var DOCKER_CLOUD_STREAM_API = 'wss://ws.cloud.docker.com';
var AUTHORIZATION_HEADER = 'Basic ' + new Buffer(DOCKER_CLOUD_USER + ':' + DOCKER_CLOUD_API_KEY).toString('base64');

var WebSocket = require('faye-websocket');
var HipChatClient = require('hipchat-client');
var hipchat = new HipChatClient(HIPCHAT_API_KEY);
var request = require('request-json');

var client = request.createClient(DOCKER_CLOUD_HTTP_API);
client.headers['Authorization'] = AUTHORIZATION_HEADER;

var getResource = function(resource_uri, cb) {
    client.get(DOCKER_CLOUD_HTTP_API + resource_uri, function (error, response, body) {
        return cb(error, response, body);
    });
};

var sendDefaultMessage = function(msg) {

    getResource(msg.resource_uri, function (error, response, body) {
        console.log('body:', body);

        var obj = {
            'type': msg.type,
            'state': msg.state,
            'name': body.name
        };
        sendMessage(JSON.stringify(obj));
    });
};

var sendContainerMessage = function(msg) {

    getResource(msg.resource_uri, function (error, response, body) {

        var container = body;
        var obj = {
            'type': msg.type,
            'state': msg.state,
            'name': body.name
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

    getResource(msg.resource_uri, function (error, response, body) {

        console.log('action:', body);

        var obj = {
            'type': msg.type,
            'state': body.state,
            'action': body.action
        };

        getResource(body.object, function(error, response, body){

            console.log('object:', body);

            obj.name = body.name;
            sendMessage(JSON.stringify(obj));
        });
    });
};

var sendBuildMessage = function(msg) {

    getResource(msg.resource_uri, function (error, response, body) {

        console.log('build:', body);

        var obj = {
            'type': msg.type,
            'branch': body.branch,
            'tag': body.tag,
            'state': body.state
        };
        getResource(body.image, function(error, response, body){

            console.log('image:', body);

            obj.name = body.name;
            sendMessage(JSON.stringify(obj));
        });
    });
};

var sendErrorMessage = function(msg) {

    sendMessage(JSON.stringify(msg));
};

var sendMessage = function(message){

    console.log('===', message);

    hipchat.api.rooms.message({
        room_id: HIPCHAT_ROOM,
        from: 'Tutum',
        color: 'gray',
        message: message
    }, function (err, res) {
        if (err) {
            console.log(err);
        }
        console.log(res);
    });
};

var ws = new WebSocket.Client(DOCKER_CLOUD_STREAM_API, null, {
    headers: {
        'Authorization': AUTHORIZATION_HEADER
    }
});

ws.on('open', function(event) {
    console.log('Stream open');
});

ws.on('message', function(event) {
    var msg = JSON.parse(event.data);
    console.log('\n');
    console.log('on message:', msg);

    if (msg.type == 'container') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'service') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'stack') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'image') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'buildsetting') {
        sendBuildMessage(msg);
    }
    else if (msg.type == 'nodecluster') {
        sendDefaultMessage(msg);
    }
    else if (msg.type == 'node') {
        sendNodeMessage(msg);
    }
    else if (msg.type == 'action') {
        sendActionMessage(msg);
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
