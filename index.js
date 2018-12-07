var Service, Characteristic;
var Marantz = require('./lib/marantz');
var inherits = require('util').inherits;
var pollingtoevent = require('polling-to-event');


module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory('homebridge-marantz-avr', 'MarantzAVR', MarantzAVRAccessory);
};

function MarantzAVRAccessory(log, config) {
    this.log = log;
	var that = this;
	
    this.config = config;
    this.ip = config['ip'];
    this.name = config['name'];

    this.defaultInput = config['defaultInput'] || null;
    this.defaultVolume = config['defaultVolume'] || null;
    this.minVolume = config['minVolume'] || 0;
    this.maxVolume = config['maxVolume'] || 70;
	this.doPolling = config['doPolling'] || false;
	
	this.pollingInterval = config['pollingInterval'] || "60";
	this.pollingInterval = parseInt(this.pollingInterval)

    this.marantz = new Marantz(this.ip);
	
	this.setAttempt = 0;
	this.state = false;
	if (this.interval < 10 && this.interval > 100000) {
		this.log("polling interval out of range.. disabled polling");
		this.doPolling = false;
	}

	// Status Polling
	if (this.doPolling) {
		that.log("start polling..");
		var statusemitter = pollingtoevent(function(done) {
			that.log("do poll..")
			that.getPowerState( function( error, response) {
				done(error, response, this.setAttempt);
			}, "statuspoll");
		}, {longpolling:true,interval:that.pollingInterval * 1000,longpollEventName:"statuspoll"});

		statusemitter.on("statuspoll", function(data) {
			that.state = data;
			that.log("poll end, state: "+data);
			
			if (that.switchService ) {
				that.switchService.getCharacteristic(Characteristic.On).updateValue(that.state, null, "statuspoll");
			}
		});
	}
}


MarantzAVRAccessory.prototype.getPowerState = function (callback, context) {
	
	if ((!context || context != "statuspoll") && this.doPolling) {
		callback(null, this.state);
	} else {
	    this.marantz.getPowerState(function (err, state) {
	        if (err) {
	            this.log(err);
	            callback(null, false);
	        } else {
				this.log('current power state is: %s', (state) ? 'ON' : 'STANDBY');
				callback(null, state);
	        }
	    }.bind(this));
	}
};


MarantzAVRAccessory.prototype.setPowerState = function (powerState, callback, context) {
	var that = this;

	//if context is statuspoll, then we need to ensure that we do not set the actual value
	if (context && context == "statuspoll") {
		callback(null, powerState);
	    return;
	}
	
	this.setAttempt = this.setAttempt+1;
	
    this.marantz.setPowerState(powerState, function (err, state) {
        if (err) {
            this.log(err);
        } else {
            if(powerState && this.defaultInput) {
                this.marantz.setInput(this.defaultInput, function (error) {
                    if (error) {
                        this.log('Error setting default input. Please check your config');
                    }
                }.bind(this));
            }
            this.log('marantz avr power %s', state);
        }
    }.bind(this));

    if (powerState && this.defaultVolume) {
        setTimeout(function () {
            this.marantz.setVolume(this.defaultVolume, function (err) {
                if (err) {
                    this.log('Error setting default volume');
                }
                this.switchService.getCharacteristic(Characteristic.Volume)
                  .updateValue(Math.round(this.defaultVolume / this.maxVolume * 100));
            }.bind(this));
        }.bind(this), 4000);
    }
    callback(null);
};

MarantzAVRAccessory.prototype.getVolume = function (callback) {
    this.marantz.getVolume(function (err, volume) {
        if (err) {
            this.log('get Volume error: ' + err)
            callback(err);
        } else {
            this.log('current volume is: ' + volume);
            var pVol = Math.round(volume / this.maxVolume * 100);
            callback(null, pVol);
        }
    }.bind(this))
};

MarantzAVRAccessory.prototype.setVolume = function (pVol, callback) {
    var volume = Math.round(pVol / 100 * this.maxVolume);
    this.marantz.setVolume(volume, function (err) {
        if (err) {
            this.log('set Volume error: ' + err);
        } else {
            this.log('set Volume to: ' + volume);
            callback(null);
        }
    }.bind(this))
};

MarantzAVRAccessory.prototype.setMuteState = function (state, callback) {
    this.marantz.setMuteState(state, function (err) {
        if (err) {
            this.log('set mute error: ' + err);
            callback(err);
        } else {
            callback(null);
        }
    }.bind(this));
};

MarantzAVRAccessory.prototype.getMuteState = function (callback) {
    this.marantz.getMuteState(function (err, state) {
        if (err) {
            this.log('get mute error: ' + err);
            callback(err);
        } else {
            callback(state);
        }
    }.bind(this))
};

MarantzAVRAccessory.prototype.getServices = function () {
    var informationService = new Service.AccessoryInformation();

    informationService
        .setCharacteristic(Characteristic.Name, this.name)
        .setCharacteristic(Characteristic.Manufacturer, this.type || 'marantz');

    this.switchService = new Service.Switch(this.name);
    this.switchService.getCharacteristic(Characteristic.On)
        .on('get', this.getPowerState.bind(this))
        .on('set', this.setPowerState.bind(this));

    this.switchService.addCharacteristic(Characteristic.Mute)
        .on('get', this.getMuteState.bind(this))
        .on('set', this.setMuteState.bind(this));

    this.switchService.addCharacteristic(Characteristic.Volume)
        .on('get', this.getVolume.bind(this))
        .on('set', this.setVolume.bind(this));

    return [informationService, this.switchService];
};