require('lookup-multicast-dns/global');
var topology   = require('fully-connected-topology');
var streamSet  = require('stream-set');
var toPort     = require('hash-to-port');
var register   = require('register-multicast-dns');
var crypto     = require('crypto');
var config     = require(__dirname + '/global.json');
var scriptList = [];

var me = process.argv[2];
config = Object.assign(config, require(__dirname + '/conf/' + me + '.json'));

var address = toAddress(config.name);
var peers   = config.nodeList;

var swarm       = topology(address, peers.map(toAddress));
var connections = streamSet();

(function () {
    // Message GUID cache
    var recevieList = {};

    //<editor-fold desc="Load Scripts">
    if (config.scripts && config.scripts.length > 0) {
        for (var i in config.scripts) {
            var scriptName = config.scripts[i];
            var script     = require('./script/' + scriptName);
            scriptList.push(script(send));
        }
    }
    //</editor-fold>

    register(config.name);

    swarm.on('connection', function (socket, id) {
        console.log('info> connection to', id);

        socket.on('data', function (data) {
            receive(data);
        });

        connections.add(socket);
    });

    function receive(data) {
        data = jsonDecrypt(data.toString());

        //<editor-fold desc="Check Message">
        if (!config.nodeList.includes(data.from)) {
            return;
        }

        if (!data.uuid || recevieList[data.uuid] != undefined || !data.proxy || data.proxy.indexOf(config.name) > -1) {
            return;
        }

        recevieList[data.uuid] = Math.floor(Date.now() / 1000);
        //</editor-fold>

        if (scriptList && scriptList.length > 0) {
            for (var i in scriptList) {
                var script = scriptList[i];
                script.receive(data);
            }
        }

        data.proxy.push(config.name);
        send(data, true);
    }

    function send(data, sendClean) {
        var messageUUID = generateUUID();
        connections.forEach(function (socket) {
            var message;
            if (sendClean) {
                message = jsonEncrypt(data);
            }
            else {
                message = jsonEncrypt({uuid: messageUUID, from: config.name, proxy: [config.name], message: data});
            }
            socket.write(message);
        });
    }

    //<editor-fold desc="Clear message GUID cache">
    setInterval(function () {
        if (Object.keys(recevieList).length <= 0) {
            return;
        }

        var currentTime = Math.floor(Date.now() / 1000);
        for (var uuid in recevieList) {
            var time = recevieList[uuid];
            var diff = currentTime - time
            if (diff >= 300) {
                delete recevieList[uuid];
            }
        }
    }, 60000);
    //</editor-fold>

    if(config.userInput)
    {
        process.stdin.on('readable', function () {
            var chunk = process.stdin.read();
            if (chunk !== null) {
                console.log("SEND");
                send(chunk.toString().trim());
            }
        });
    }
})();

//<editor-fold desc="Helper function">
function toAddress(name) {
    name = name + '.local:' + toPort(name);

    return name;
}

function encrypt(text) {
    var cipher  = crypto.createCipher(config.channelAlgorithm, config.channelPassword)
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

function decrypt(text) {
    var decipher = crypto.createDecipher(config.channelAlgorithm, config.channelPassword)
    var dec      = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

function jsonEncrypt(data) {
    if (typeof data != "object") {
        data = {};
    }

    data = encrypt(JSON.stringify(data));
    return data;
}

function jsonDecrypt(data) {
    try {
        data = JSON.parse(decrypt(data));
    }
    catch (e) {
        data = {};
    }

    return data;
}

function generateUUID() {
    var d    = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d     = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
};

if (Array.prototype.includes == undefined) {
    Array.prototype.includes = function (obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    }
}
//</editor-fold>