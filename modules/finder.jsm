var EXPORTED_SYMBOLS = ['MigemoFinder']; 

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Finder.jsm');

Cu.import('resource://gre/modules/Services.jsm');

Cu.import('resource://xulmigemo-modules/service.jsm');
Cu.import('resource://xulmigemo-modules/core/find.js');

// for development
MigemoFind.findMode = MigemoFind.FIND_MODE_MIGEMO;

function myResultToNativeResult(aFlag)
{
	if (aFlag === MigemoFind.NOTFOUND)
		return Ci.nsITypeAheadFind.FIND_NOTFOUND;

	if (aFlag & MigemoFind.WRAPPED)
		return Ci.nsITypeAheadFind.FIND_WRAPPED;

	return Ci.nsITypeAheadFind.FIND_FOUND;
}

Object.defineProperty(Finder.prototype, '__xm__nativeSearchString', {
	get: function() {
		return this._fastFind.searchString || this._searchString;
	},
	set: function(aValue) {
		return this._fastFind.searchString = aValue;
	}
});

Finder.prototype.__xm__fastFind = Finder.prototype.fastFind;
Finder.prototype.fastFind = function(aSearchString, aLinksOnly, aDrawOutline) {
	if (MigemoFind.findMode === MigemoFind.FIND_MODE_NATIVE)
		return this.__xm__fastFind(aSearchString, aLinksOnly, aDrawOutline);

	this.__xm__nativeSearchString = aSearchString;

	if (MigemoFind.targetDocShell !== this._docShell)
		MigemoFind.targetDocShell = this._docShell;

	if (MigemoFind.lastKeyword != aSearchString)
		MigemoFind.lastKeyword = aSearchString

	MigemoFind.caseSensitive = this._fastFind.caseSensitive;
	MigemoFind.isLinksOnly = aLinksOnly;
	MigemoFind.isQuickFind = !aDrawOutline;
	var result = MigemoFind.find(false, MigemoFind.lastKeyword, false);
	this._notify(
		aSearchString,
		myResultToNativeResult(result),
		false,
		aDrawOutline
	);
};

Finder.prototype.__xm__findAgain = Finder.prototype.findAgain;
Finder.prototype.findAgain = function(aFindBackwards, aLinksOnly, aDrawOutline) {
	if (MigemoFind.findMode === MigemoFind.FIND_MODE_NATIVE)
		return this.__xm__findAgain(aFindBackwards, aLinksOnly, aDrawOutline);

	if (MigemoFind.targetDocShell !== this._docShell)
		MigemoFind.targetDocShell = this._docShell;

	this.__xm__nativeSearchString = MigemoFind.lastKeyword;

	MigemoFind.caseSensitive = this._fastFind.caseSensitive;
	MigemoFind.isLinksOnly = aLinksOnly;
	MigemoFind.isQuickFind = !aDrawOutline;
	var result = MigemoFind.find(aFindBackwards, MigemoFind.lastKeyword, false);
	this._notify(
		this.__xm__nativeSearchString,
		myResultToNativeResult(result),
		aFindBackwards,
		aDrawOutline
	);
};

Finder.prototype.__xm__findIterator = Finder.prototype._findIterator;
Finder.prototype._findIterator = function(aWord, aWindow) {
	if (MigemoFind.findMode === MigemoFind.FIND_MODE_NATIVE)
		return this.__xm__findIterator(aWord, aWindow);
	else
		return this.__xm__findIterator_regexp(aWord, aWindow);
};
Finder.prototype.__xm__findIterator_regexp = function* (aWord, aWindow) {
	var doc = aWindow.document;
	var body = (doc instanceof Ci.nsIDOMHTMLDocument && doc.body) ? doc.body : doc.documentElement;

	var findRange = doc.createRange();
	findRange.selectNodeContents(body);

	var startPoint = findRange.cloneRange();
	startPoint.collapse(true);

	var endPoint = findRange.cloneRange();
	endPoint.collapse(false);

	var regexp = MigemoFind.findMode === MigemoFind.FIND_MODE_REGEXP ?
				MigemoTextUtils.extractRegExpSource(aWord) :
			MigemoFind.findMode === MigemoFind.FIND_MODE_MIGEMO ?
				XMigemoCore.getRegExp(aWord) :
				MigemoTextUtils.sanitize(aWord) ;
	var flags = MigemoFind.caseSensitive ? '' : 'i' ;

	var foundRange;
	while ((foundRange = XMigemoCore.regExpFind(regexp, flags, findRange, startPoint, endPoint, false)))
	{
		yield foundRange;
		startPoint = foundRange.cloneRange();
		startPoint.collapse(false);
	}
};

var MigemoFinder = Finder;
