var EXPORTED_SYMBOLS = ['MigemoFinder']; 

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/Finder.jsm');

Cu.import('resource://xulmigemo-modules/lib/extended-immutable.js');

Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/service.jsm');
Cu.import('resource://xulmigemo-modules/core/find.js');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('finder', ...aArgs); }


function myResultToNativeResult(aFlag)
{
	if (aFlag & MigemoConstants.FOUND) {
		if (aFlag & MigemoConstants.WRAPPED)
			return Ci.nsITypeAheadFind.FIND_WRAPPED;
		else
			return Ci.nsITypeAheadFind.FIND_FOUND;
	}
	return Ci.nsITypeAheadFind.FIND_NOTFOUND;
}

Finder.prototype.__xm__init = function() {
	if (this.__xm__nextFindMode)
		return;

	this.__xm__lastFindMode = {};
	this.__xm__lastFindMode[MigemoConstants.FIND_CONTEXT_NORMAL] = MigemoConstants.FIND_MODE_NOT_INITIALIZED;
	this.__xm__lastFindMode[MigemoConstants.FIND_CONTEXT_QUICK] = MigemoConstants.FIND_MODE_NOT_INITIALIZED;

	this.__xm__nextFindMode = {};
	this.__xm__defaultFindMode = {};
	this.__xm__nextFindContext = MigemoConstants.FIND_CONTEXT_NORMAL;
};

Object.defineProperty(Finder.prototype, '__xm__migemoFinder', {
	get: function() {
		if (!this.__xm__migemoFinderInstance) {
			this.__xm__init();
			this.__xm__migemoFinderInstance = new MigemoFind();
		}
		return this.__xm__migemoFinderInstance;
	}
});

Object.defineProperty(Finder.prototype, '__xm__nativeSearchString', {
	get: function() {
		return this._fastFind.searchString || this._searchString;
	},
	set: function(aValue) {
		return this._fastFind.searchString = aValue;
	}
});

Object.defineProperty(Finder.prototype, '_fastFind', {
	get: function() {
		return this.__xm__fastFindInstance;
	},
	set: function(aValue) {
		var myFinder = this.__xm__migemoFinder;
		this.__xm__fastFindInstance = new ExtendedImmutable(aValue, {
			getFoundRange : function()
			{
				if (myFinder.findMode === MigemoConstants.FIND_MODE_NATIVE)
					return aValue.getFoundRange();
				return myFinder.foundRange;
			},
			get foundLink() {
				if (myFinder.findMode === MigemoConstants.FIND_MODE_NATIVE)
					return aValue.foundLink;
				return myFinder.foundLink;
			}
		});
		return aValue;
	}
});

Finder.prototype.__xm__setFindMode = function(aParams) {
	this.__xm__init();

	var context = aParams.context || MigemoConstants.FIND_CONTEXT_NORMAL;
	if (aParams.nextMode)
		this.__xm__nextFindMode[context] = aParams.nextMode;
	if (aParams.defaultMode)
		this.__xm__defaultFindMode[context] = aParams.defaultMode;
	this.__xm__nextFindContext = context;
	this.__xm__temporaryMode = aParams.temporaryMode || null;

	var finder = this.__xm__migemoFinder;

	var lastMode = this.__xm__lastFindMode[context];
	var nextMode = this.__xm__nextFindMode[context];
	var defaultMode = this.__xm__defaultFindMode[context];

	if (this.__xm__temporaryMode) {
		finder.findMode = this.__xm__temporaryMode;
		this.__xm__temporaryMode = null;
	}
	else if (nextMode &&
			nextMode !== MigemoConstants.FIND_MODE_KEEP) {
		this.__xm__lastFindMode[context] =
			finder.findMode = nextMode;
	}
	else if (defaultMode &&
			lastMode === MigemoConstants.FIND_MODE_NOT_INITIALIZED) {
		this.__xm__lastFindMode[context] =
			finder.findMode = defaultMode;
	}
	else if (lastMode !== finder.findMode) {
		finder.findMode = lastMode;
	}

	this.__xm__lastFindModeReport = {
		context : context,
		mode    : finder.findMode
	};
	Services.console.logStringMessage('finder.findMode => '+finder.findMode);
};

Finder.prototype.__xm__notify = function(aOptions) {
	if (this._notify.length > 1) { // for Firefox 49 and olders (see also: https://bugzilla.mozilla.org/show_bug.cgi?id=384458)
		this._notify(
			aOptions.searchString,
			aOptions.result,
			aOptions.findBackwards,
			aOptions.drawOutline
		);
	}
	else {
		this._notify(aOptions);
	}
};

Finder.prototype.__xm__fastFind = Finder.prototype.fastFind;
Finder.prototype.fastFind = function(aSearchString, aLinksOnly, aDrawOutline) {
	var finder = this.__xm__migemoFinder;
	if (finder.findMode === MigemoConstants.FIND_MODE_NATIVE)
		return this.__xm__fastFind(aSearchString, aLinksOnly, aDrawOutline);

	this.__xm__nativeSearchString = aSearchString;

	if (finder.targetDocShell !== this._docShell)
		finder.targetDocShell = this._docShell;

	finder.caseSensitive = this._fastFind.caseSensitive;
	finder.isLinksOnly = aLinksOnly;
	var result = finder.find({
		keyword  : aSearchString,
		subFrame : true,
		scroll   : true
	});
	this.__xm__notify({
		searchString  : aSearchString,
		result        : myResultToNativeResult(result),
		findAgain     : false,
		findBackwards : false,
		drawOutline   : false
	});
};

Finder.prototype.__xm__findAgain = Finder.prototype.findAgain;
Finder.prototype.findAgain = function(aFindBackwards, aLinksOnly, aDrawOutline) {
	var finder = this.__xm__migemoFinder;
	if (finder.findMode === MigemoConstants.FIND_MODE_NATIVE)
		return this.__xm__findAgain(aFindBackwards, aLinksOnly, aDrawOutline);

	if (finder.targetDocShell !== this._docShell)
		finder.targetDocShell = this._docShell;

	finder.caseSensitive = this._fastFind.caseSensitive;
	finder.isLinksOnly = aLinksOnly;
	var result = finder.find({
		backward : aFindBackwards,
		keyword  : this.__xm__nativeSearchString,
		subFrame : true,
		scroll   : true
	});
	this.__xm__notify({
		searchString  : this.__xm__nativeSearchString,
		result        : myResultToNativeResult(result),
		findAgain     : true,
		findBackwards : aFindBackwards,
		drawOutline   : aDrawOutline
	});
};

Finder.prototype.__xm__findIterator = Finder.prototype._findIterator;
Finder.prototype._findIterator = function(aWord, aWindow) {
	if (this.__xm__migemoFinder.findMode === MigemoConstants.FIND_MODE_NATIVE)
		return this.__xm__findIterator(aWord, aWindow);
	else
		return this.__xm__findIterator_regexp(aWord, aWindow);
};
Finder.prototype.__xm__findIterator_regexp = function* (aWord, aWindow) {
	log('new finder for '+aWindow.location.origin);
	var finder = new MigemoFind();
	finder.findMode = this.__xm__migemoFinder.findMode;
	finder.targetWindow = aWindow;
	finder.foundRange = null;
	finder.caseSensitive = this.__xm__migemoFinder.caseSensitive;
	finder.isLinksOnly = this.__xm__migemoFinder.isLinksOnly;

	while (true)
	{
		let result = finder.find({
				keyword : aWord
			});
		if ((result & MigemoConstants.WRAPPED) ||
			!(result & MigemoConstants.FOUND))
			break;

		let range = finder.foundRange;
		log('  found => '+range);
		yield range;
	}
};

var MigemoFinder = Finder;
