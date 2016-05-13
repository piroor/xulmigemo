var EXPORTED_SYMBOLS = ['MigemoFinder']; 

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Finder.jsm');

Cu.import('resource://gre/modules/Services.jsm');

Cu.import('resource://xulmigemo-modules/lib/extended-immutable.js');
Cu.import('resource://xulmigemo-modules/service.jsm');
Cu.import('resource://xulmigemo-modules/core/find.js');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');

function myResultToNativeResult(aFlag)
{
	if (aFlag === MigemoFind.NOTFOUND)
		return Ci.nsITypeAheadFind.FIND_NOTFOUND;

	if (aFlag & MigemoFind.WRAPPED)
		return Ci.nsITypeAheadFind.FIND_WRAPPED;

	return Ci.nsITypeAheadFind.FIND_FOUND;
}

Object.defineProperty(Finder.prototype, '__xm__finder', {
	get: function() {
		if (!this.__xm__finderInstance) {
			this.__xm__finderInstance = new MigemoFind();
			// for development
			this.__xm__finderInstance.findMode = MigemoFind.FIND_MODE_MIGEMO;
		}
		return this.__xm__finderInstance;
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
		return this.__xm__fastFind;
	},
	set: function(aValue) {
		var myFinder = this.__xm__finder;
		this.__xm__fastFind = new ExtendedImmutable(aValue, {
			getFoundRange : function()
			{
				if (myFinder.findMode === MigemoFind.FIND_MODE_NATIVE)
					return aValue.getFoundRange();
				return myFinder.foundRange;
			}
		});
		return aValue;
	}
});

Finder.prototype.__xm__fastFind = Finder.prototype.fastFind;
Finder.prototype.fastFind = function(aSearchString, aLinksOnly, aDrawOutline) {
	var finder = this.__xm__finder;
	if (finder.findMode === MigemoFind.FIND_MODE_NATIVE)
		return this.__xm__fastFind(aSearchString, aLinksOnly, aDrawOutline);

	this.__xm__nativeSearchString = aSearchString;

	if (finder.targetDocShell !== this._docShell)
		finder.targetDocShell = this._docShell;

	if (finder.lastKeyword != aSearchString)
		finder.lastKeyword = aSearchString

	finder.caseSensitive = this._fastFind.caseSensitive;
	finder.isLinksOnly = aLinksOnly;
	finder.isQuickFind = !aDrawOutline;
	var result = finder.find({
		keyword : finder.lastKeyword,
		scroll  : true
	});
	this._notify(
		aSearchString,
		myResultToNativeResult(result),
		false,
		aDrawOutline
	);
};

Finder.prototype.__xm__findAgain = Finder.prototype.findAgain;
Finder.prototype.findAgain = function(aFindBackwards, aLinksOnly, aDrawOutline) {
	var finder = this.__xm__finder;
	if (finder.findMode === MigemoFind.FIND_MODE_NATIVE)
		return this.__xm__findAgain(aFindBackwards, aLinksOnly, aDrawOutline);

	if (finder.targetDocShell !== this._docShell)
		finder.targetDocShell = this._docShell;

	this.__xm__nativeSearchString = finder.lastKeyword;

	finder.caseSensitive = this._fastFind.caseSensitive;
	finder.isLinksOnly = aLinksOnly;
	finder.isQuickFind = !aDrawOutline;
	var result = finder.find({
		backward : aFindBackwards,
		keyword  : finder.lastKeyword,
		scroll   : true
	});
	this._notify(
		this.__xm__nativeSearchString,
		myResultToNativeResult(result),
		aFindBackwards,
		aDrawOutline
	);
};

Finder.prototype.__xm__findIterator = Finder.prototype._findIterator;
Finder.prototype._findIterator = function(aWord, aWindow) {
	if (this.__xm__finder.findMode === MigemoFind.FIND_MODE_NATIVE)
		return this.__xm__findIterator(aWord, aWindow);
	else
		return this.__xm__findIterator_regexp(aWord, aWindow);
};
Finder.prototype.__xm__findIterator_regexp = function* (aWord, aWindow) {
	var finder = new MigemoFind();
	finder.findMode = this.__xm__finder.findMode;
	finder.targetDocShell = this._docShell;
	finder.foundRange = null;
	finder.lastKeyword = aWord
	finder.caseSensitive = this.__xm__finder.caseSensitive;
	finder.isLinksOnly = this.__xm__finder.isLinksOnly;
	finder.isQuickFind = false;

	while (!(finder.find({
			keyword : aWord
		}) & MigemoFind.WRAPPED))
	{
		var range = finder.foundRange;
		if (!range)
			break;
		yield range;
	}
};

var MigemoFinder = Finder;
