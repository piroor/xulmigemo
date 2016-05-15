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
		this.__xm__applyFindMode();
		return this.__xm__finder;
	}
});

RemoteFinderListener.prototype.__xm__applyFindMode = function() {
	var migemoFinder = this._finder.__xm__migemoFinder;
	var lastMode = migemoFinder.findMode;

	if (this.__xm__nextFindMode &&
		this.__xm__nextFindMode != MigemoConstants.FIND_MODE_KEEP)
		migemoFinder.findMode = this.__xm__nextFindMode;
	else if (this.__xm__defaultFindMode &&
			lastMode == MigemoConstants.FIND_MODE_NOT_INITIALIZED)
		migemoFinder.findMode = this.__xm__defaultFindMode;

	if (this._global)
		this._global.sendAsyncMessage(MigemoConstants.MESSAGE_TYPE, {
			command : MigemoConstants.COMMAND_REPORT_FIND_MODE,
			mode    : migemoFinder.findMode
		});
};

RemoteFinderListener.prototype.__xm__handleMessage = function(aMessage) {
	switch (aMessage.json.command)
	{
		case MigemoConstants.COMMAND_SET_FIND_MODE:
			if (aMessage.json.params.mode)
				this.__xm__nextFindMode = aMessage.json.params.mode;
			if (aMessage.json.params.defaultMode)
				this.__xm__defaultFindMode = aMessage.json.params.defaultMode;
			if (this._finder)
				this.__xm__applyFindMode();
			return;

		case MigemoConstants.COMMAND_SHUTDOWN:
			this.__xm__global.removeMessageListener(MigemoConstants.MESSAGE_TYPE, this.__xm__handleMessageBound);
			delete this.__xm__handleMessageBound;
			return;
	}
};

var MigemoRemoteFinder = RemoteFinder;
