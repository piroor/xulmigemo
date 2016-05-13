var EXPORTED_SYMBOLS = ['MigemoFinder']; 

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/XPCOMUtils.jsm');
Cu.import('resource://gre/modules/Finder.jsm');

Cu.import('resource://xulmigemo-modules/core/find.js');

MigemoFind.findMode = MigemoFind.FIND_MODE_MIGEMO;

Finder.prototype.__xulmigemo__fastFind = Finder.prototype.fastFind;
Finder.prototype.fastFind = function(aSearchString, aLinksOnly, aDrawOutline) {
	if (MigemoFind.targetDocShell !== this._docShell)
		MigemoFind.targetDocShell = this._docShell;
	if (MigemoFind.lastKeyword != aSearchString)
		MigemoFind.lastKeyword = aSearchString
	MigemoFind.caseSensitive = this._fastFind.caseSensitive;
	MigemoFind.isLinksOnly = aLinksOnly;
	MigemoFind.find(false, MigemoFind.lastKeyword, false);
};

Finder.prototype.__xulmigemo__findAgain = Finder.prototype.findAgain;
Finder.prototype.findAgain = function(aFindBackwards, aLinksOnly, aDrawOutline) {
	if (MigemoFind.targetDocShell !== this._docShell)
		MigemoFind.targetDocShell = this._docShell;
	MigemoFind.caseSensitive = this._fastFind.caseSensitive;
	MigemoFind.isLinksOnly = aLinksOnly;
	MigemoFind.find(aFindBackwards, MigemoFind.lastKeyword, false);
};

var MigemoFinder = Finder;
