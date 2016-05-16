var EXPORTED_SYMBOLS = ['MigemoRemoteFinder']; 

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/RemoteFinder.jsm');

Cu.import('resource://xulmigemo-modules/constants.jsm');


// sender

RemoteFinder.prototype.__xm__setFindMode = function(aParams) {
	Services.console.logStringMessage('setFindMode => '+JSON.stringify(aParams));
	this._browser.messageManager.sendAsyncMessage(MigemoConstants.MESSAGE_TYPE, {
		command : MigemoConstants.COMMAND_SET_FIND_MODE,
		params  : aParams
	});
	this.__xm__lastFindModeReport = null;
};


// listener

Object.defineProperty(RemoteFinderListener.prototype, '_global', {
	get: function() {
		return this.__xm__global;
	},
	set: function(aValue) {
		this.__xm__global = aValue;
		this.__xm__handleMessageBound = this.__xm__handleMessage.bind(this);
		aValue.addMessageListener(MigemoConstants.MESSAGE_TYPE, this.__xm__handleMessageBound);
		return aValue;
	}
});

Object.defineProperty(RemoteFinderListener.prototype, '_finder', {
	get: function() {
		return this.__xm__finder;
	},
	set: function(aValue) {
		this.__xm__finder = aValue;
		if (this.__xm__findModeParams) {
			this.__xm__setFindMode(this.__xm__findModeParams);
			delete this.__xm__findModeParams;
			this.__xm__reportFindMode();
		}
		return this.__xm__finder;
	}
});

RemoteFinderListener.prototype.__xm__reportFindMode = function() {
	if (!this._global)
		return;
	this._global.sendAsyncMessage(MigemoConstants.MESSAGE_TYPE, {
		command : MigemoConstants.COMMAND_REPORT_FIND_MODE,
		context : this._finder.__xm__nextFindContext,
		mode    : this._finder.__xm__migemoFinder.findMode
	});
};

RemoteFinderListener.prototype.__xm__handleMessage = function(aMessage) {
	switch (aMessage.json.command)
	{
		case MigemoConstants.COMMAND_SET_FIND_MODE:
			if (this._finder) {
				this._finder.__xm__setFindMode(aMessage.json.params);
				this.__xm__reportFindMode();
			}
			else {
				let params = this.__xm__findModeParams || {};
				Object.keys(aMessage.json.params).forEach(function(aKey) {
					params[aKey] = aMessage.json.params[aKey];
				});
				this.__xm__findModeParams = params;
			}
			return;

		case MigemoConstants.COMMAND_SHUTDOWN:
			this.__xm__global.removeMessageListener(MigemoConstants.MESSAGE_TYPE, this.__xm__handleMessageBound);
			delete this.__xm__handleMessageBound;
			return;
	}
};

var MigemoRemoteFinder = RemoteFinder;
