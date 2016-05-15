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
		this.__xm__init();
		this.__xm__applyFindMode();
		return this.__xm__finder;
	}
});

RemoteFinderListener.prototype.__xm__init = function() {
	if (this.__xm__initialized)
		return;
	this.__xm__nextFindMode = {};
	this.__xm__defaultFindMode = {};
	this.__xm__nextFindContext = MigemoConstants.FIND_CONTEXT_NORMAL;
};

RemoteFinderListener.prototype.__xm__applyFindMode = function() {
	var migemoFinder = this._finder.__xm__migemoFinder;
	var lastMode = this._finder.__xm__lastFindMode[this.__xm__nextFindContext];

	var nextMode = this.__xm__nextFindMode[this.__xm__nextFindContext];
	var defaultMode = this.__xm__defaultFindMode[this.__xm__nextFindContext];
	if (nextMode &&
		nextMode !== MigemoConstants.FIND_MODE_KEEP) {
		this._finder.__xm__lastFindMode[this.__xm__nextFindContext] =
			migemoFinder.findMode = nextMode;
	}
	else if (defaultMode &&
			lastMode === MigemoConstants.FIND_MODE_NOT_INITIALIZED) {
		this._finder.__xm__lastFindMode[this.__xm__nextFindContext] =
			migemoFinder.findMode = defaultMode;
	}
	else if (lastMode !== migemoFinder.findMode) {
		migemoFinder.findMode = lastMode;
	}

	if (this._global)
		this._global.sendAsyncMessage(MigemoConstants.MESSAGE_TYPE, {
			command : MigemoConstants.COMMAND_REPORT_FIND_MODE,
			context : this.__xm__nextFindContext,
			mode    : migemoFinder.findMode
		});
};

RemoteFinderListener.prototype.__xm__handleMessage = function(aMessage) {
	switch (aMessage.json.command)
	{
		case MigemoConstants.COMMAND_SET_FIND_MODE:
			this.__xm__init();
			let context = aMessage.json.params.context;
			if (aMessage.json.params.mode)
				this.__xm__nextFindMode[context] = aMessage.json.params.mode;
			if (aMessage.json.params.defaultMode)
				this.__xm__defaultFindMode[context] = aMessage.json.params.defaultMode;
			this.__xm__nextFindContext = context;
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
