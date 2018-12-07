var request = require('request');
var parseString = require('xml2js').parseString;

var Marantz = function (ip) {
    this.ip = ip;
    this.status_url = '/goform/appCommand.xml';
};


/**
 * Returns the friendly avr name
 * @param callback
 */
Marantz.prototype.getModelInfo = function (callback) {
    request.get('http://' + this.ip + this.status_url, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode === 200) {
            parseString(xml + body, function (err, result) {
                callback(null, {
                  name: result.item.FriendlyName[0].value[0],
                  brand: result.item.BrandId[0].value[0]
                });
            });
        } else {
            callback(error);
        }
    });
};


/**
 * Returns the friendly avr name
 * @param callback
 */
Marantz.prototype.getName = function (callback) {
    request.get('http://' + this.ip + this.status_url, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode === 200) {
            parseString(xml + body, function (err, result) {
                callback(null, result.item.FriendlyName[0].value[0]);
            });
        } else {
            callback(error);
        }
    });
};


/**
 * Returns the avr brand
 * @param callback
 */
Marantz.prototype.getBrand = function (callback) {
    request.get('http://' + this.ip + this.status_url, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode === 200) {
            parseString(xml + body, function (err, result) {
                callback(null, result.item.BrandId[0].value[0]);
            });
        } else {
            callback(error);
        }
    });
};

/**
 * Returns the current power state of the avr
 * @param callback
 */
Marantz.prototype.getPowerState = function (callback) {
    request(
        {
            method: 'POST',
            uri: 'http://' + this.ip + '/goform/AppCommand.xml',
            headers: {
                'Content-Type': 'text/xml; charset="utf-8"'
            },
            body: `
                <?xml version="1.0" encoding="utf-8"?>
                    <tx> 
                        <cmd id="1">GetAllZonePowerStatus</cmd> 
                    </tx>            
                </xml>`
        }, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode === 200) {
            parseString(xml + body, function (err, result) {
                callback(null, (result['rx']['cmd'][0]['zone1'][0]) == 'ON');
            });
        } else {
            callback("Can't connect to device: " + error, false)
        }
    }.bind(this));
};

/**
 * sets the power state of the avr
 * @param powerState - true or false
 * @param callback
 */
Marantz.prototype.setPowerState = function (powerState, callback) {
    powerState = (powerState) ? 'ON' : 'STANDBY';
    request(
        {
            method: 'POST',
            uri: 'http://' + this.ip + '/goform/AppCommand.xml',
            headers: {
                'content-type': 'text/xml'
            },
            body: `
                <?xml version="1.0" encoding="utf-8"?>
                <tx>
                  <cmd id="1">SetPower</cmd>
                  <zone>Main</zone>
                  <value>` + powerState + `</value>
                </tx>
            `
        }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(null, powerState == 'ON');
        } else {
            callback(error)
        }
    });
};

/**
 * Returns the current mute state of the avr
 * @param callback
 */
Marantz.prototype.getMuteState = function (callback) {
    request(
        {
            method: 'POST',
            uri: 'http://' + this.ip + '/goform/AppCommand.xml',
            headers: {
                'Content-Type': 'text/xml; charset="utf-8"'
            },
            body: `
                <?xml version="1.0" encoding="utf-8"?>
                    <tx> 
                        <cmd id="1">GetAllZoneMuteStatus</cmd> 
                    </tx>            
                </xml>`
        }, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode === 200) {
            parseString(xml + body, function (err, result) {
                callback(null, (result['rx']['cmd'][0]['zone1'].value[0] == 'on'));
            });
        } else {
            callback(error);
        }
    }.bind(this));
};

/**
 * set the mute state of the avr
 * @param muteState
 * @param callback
 */
Marantz.prototype.setMuteState = function(muteState, callback) {
    muteState = (muteState) ? 'ON' : 'OFF';

    request.get('http://' + this.ip + '/goform/formiPhoneAppDirect.xml?MU' + muteState, function (error, response, body) {
        if(!error && response.statusCode === 200) {
            callback(null, muteState == 'ON');
        } else {
            callback(error)
        }
    })
};

/**
 * Returns the current input of the avr
 * @param callback (String)
 */
Marantz.prototype.getInput = function (callback) {
    request.get('http://' + this.ip + this.status_url, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode === 200) {
            parseString(xml + body, function (err, result) {
                callback(null, result.item.InputFuncSelect[0].value[0]);
            });
        } else {
            callback(error);
        }
    }.bind(this));
};

/**
 * sets the input to xxx
 * possible values are
 * 'CD', 'SPOTIFY', 'CBL/SAT', 'DVD', 'BD', 'GAME', 'GAME2', 'AUX1',
     'MPLAY', 'USB/IPOD', 'TUNER', 'NETWORK', 'TV', 'IRADIO', 'SAT/CBL', 'DOCK',
     'IPOD', 'NET/USB', 'RHAPSODY', 'PANDORA', 'LASTFM', 'IRP', 'FAVORITES', 'SERVER'
 * @param input String
 * @param callback
 */
Marantz.prototype.setInput = function (input, callback) {
    request.get('http://' + this.ip + '/goform/formiPhoneAppDirect.xml?SI' + input, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(null);
        } else {
            callback(error)
        }
    })
};

/**
 * Returns the current Surround Mode
 * @param callback
 */
Marantz.prototype.getSurroundMode = function (callback) {
    request.get('http://' + this.ip + this.status_url, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode === 200) {
            parseString(xml + body, function (err, result) {
                callback(null, result.item.selectSurround[0].value[0]);
            });
        } else {
            callback(error);
        }
    }.bind(this));
};

/**
 * Set the playback volume
 * the volume fix sets the volume to the volume the display shows
 * @param volume integer
 * @param callback
 */
Marantz.prototype.setVolume = function (volume, callback) {
    var vol = (volume - 80).toFixed(1);  //volume fix
    request.get('http://' + this.ip + '/goform/formiPhoneAppVolume.xml?1+' + vol, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            callback(null);
        } else {
            callback(error)
        }
    });
};

/**
 * Returns the current volume of the avr (with volume fix)
 * @param callback
 */
Marantz.prototype.getVolume = function (callback) {
    request.get('http://' + this.ip + this.status_url, function (error, response, body) {
        var xml = '';
        if (!error && response.statusCode === 200) {
            parseString(xml + body, function (err, result) {
                callback(null, parseInt(result.item.MasterVolume[0].value[0]) + 80);
            });
        } else {
            callback(error);
        }
    }.bind(this));
};

module.exports = Marantz;
