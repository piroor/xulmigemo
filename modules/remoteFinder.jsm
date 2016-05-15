var EXPORTED_SYMBOLS = ['MigemoRemoteFinder']; 

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/RemoteFinder.jsm');

Cu.import('resource://xulmigemo-modules/constants.jsm');

Object.defineProperty(RemoteFinderListener.prototype, '_global', {
	get: function() {
		return this.__xm__global;
	},
	set: function(aValue) {
		this.__xm__global = aValue;
		this.__xm__handleMessageBound = this.__xm__handleMessage.bind(this);
		aValue.addMessageListener(MigemoConstants.MESSAGE_TYPE, this.__xm__handleMessageBound);
		return aValue;;
	}
});

Object.defineProperty(RemoteFinderListener.prototype, '_finder', {
	get: function() {
		return this.__xm__finder;
	},
	set: function(aValue) {
		this.__xm__finder = aValue;
		if (this.__xm__findMode)
			aValue.__xm__migemoFinder.findMode = this.__xm__findMode;
		return aValue;;
	}
});

RemoteFinderListener.prototype.__xm__handleMessage = function(aMessage) {
	switch (aMessage.json.command)
	{
		case MigemoConstants.COMMAND_SET_FIND_MODE:
			this.__xm__findMode = aMessage.json.params.mode;
			if (this._finder)
				this._finder.__xm__migemoFinder.findMode = aMessage.json.params.mode;
			return;

		case MigemoConstants.COMMAND_SHUTDOWN:
			this.__xm__global.removeMessageListener(MigemoConstants.MESSAGE_TYPE, this.__xm__handleMessageBound);
			delete this.__xm__handleMessageBound;
			return;
	}
};

var MigemoRemoteFinder = RemoteFinder;
