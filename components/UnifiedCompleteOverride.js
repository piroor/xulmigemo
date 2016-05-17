Components.classes['@mozilla.org/moz/jssubscript-loader;1']
	.getService(Components.interfaces.mozIJSSubScriptLoader)
	.loadSubScript('resource://gre/components/UnifiedComplete.js');

function log(...aArgs) 
{
	if (Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.places'))
		Services.console.logStringMessage('unifiedcomplete: ' + aArgs.join(', '));
}
dump = log;

var { XMigemoPlaces } = Cu.import('resource://xulmigemo-modules/places.jsm', {});
var { MigemoTextUtils } = Cu.import('resource://xulmigemo-modules/core/textUtils.js', {}); 

var OriginalSearch = Search;
Search = function(aSearchString, aSearchParam, aAutocompleteListener,
					aResultListener, aAutocompleteSearch,
					aProhibitSearchSuggestions,
					...aArgs) {
	if (Services.prefs.getBoolPref('xulmigemo.places.locationBar') &&
		XMigemoPlaces.isValidInput(aSearchString)) {
		this.__xm__findInfo = XMigemoPlaces.parseInput(aSearchString);
		log('Search: '+uneval(this.__xm__findInfo));
	}
	OriginalSearch.call(this, aSearchString, aSearchParam, aAutocompleteListener,
						aResultListener.__xm__outer, aAutocompleteSearch.__xm__outer,
						aProhibitSearchSuggestions,
						...aArgs);
};

Search.prototype = OriginalSearch.prototype;

Object.defineProperty(Search.prototype, '__xm__searchQuery',
	Object.getOwnPropertyDescriptor(OriginalSearch.prototype, '_searchQuery'));
Object.defineProperty(Search.prototype, '_searchQuery', {
	get: function() {
		var query = this.__xm__searchQuery;
		if (this.__xm__findInfo) {
			query[1].searchString = ' ';
			query[1].maxResults = -1;
		}
		return query;
	}
});

Object.defineProperty(Search.prototype, '__xm__switchToTabQuery',
	Object.getOwnPropertyDescriptor(OriginalSearch.prototype, '_switchToTabQuery'));
Object.defineProperty(Search.prototype, '_switchToTabQuery', {
	get: function() {
		var query = this.__xm__switchToTabQuery;
		if (this.__xm__findInfo) {
			query[1].searchString = ' ';
			query[1].maxResults = -1;
		}
		return query;
	}
});

Object.defineProperty(Search.prototype, '__xm__adaptiveQuery',
	Object.getOwnPropertyDescriptor(OriginalSearch.prototype, '_adaptiveQuery'));
Object.defineProperty(Search.prototype, '_adaptiveQuery', {
	get: function() {
		var query = this.__xm__adaptiveQuery;
		if (this.__xm__findInfo) {
			query[1].search_string = ' ';
		}
		return query;
	}
});

Search.prototype.__xm__addMatch = Search.prototype._addMatch;
Search.prototype._addMatch = function(aMatch) {
	if (this.__xm__findInfo) {
		let source = [
			aMatch.value,
			aMatch.comment,
			aMatch.finalCompleteValue
		].join('\n');
		log(' check match: '+source);
		let matched = this.__xm__findInfo.findRegExps.every(function(aRegExp) {
				return aRegExp.test(source);
			});
		if (!matched)
			return;
		if (this.__xm__findInfo.exceptionsRegExp &&
			this.__xm__findInfo.exceptionsRegExp.test(source))
			return;
	}
	return this.__xm__addMatch(aMatch);
};


function XMigemoUnifiedComplete() {
	log('initialize');
	this.internal = new UnifiedComplete();
	this.internal.__xm__outer = this;
}
XMigemoUnifiedComplete.prototype = {
	classDescription : 'UnifiedComplete',
	contractID : '@mozilla.org/autocomplete/search;1?name=unifiedcomplete',
	classID : Components.ID('55291630-edfe-41f2-bf6b-57d00882382e'),

	_xpcom_factory: XPCOMUtils.generateSingletonFactory(XMigemoUnifiedComplete),

	QueryInterface : XPCOMUtils.generateQI([
		Ci.mozIPlacesAutoComplete,
		Ci.nsIAutoCompleteSearch,
		Ci.nsIAutoCompleteSimpleResultListener,
		Ci.nsIAutoCompleteSearchDescriptor,
		Ci.nsIObserver,
		Ci.nsISupportsWeakReference
	]),

	// mozIPlacesAutoComplete
	registerOpenPage : function(...aArgs)
	{
		log('registerOpenPage', ...aArgs);
		return this.internal.registerOpenPage(...aArgs);
	},
	unregisterOpenPage : function(...aArgs)
	{
		log('unregisterOpenPage', ...aArgs);
		return this.internal.unregisterOpenPage(...aArgs);
	},

	// nsIAutoCompleteSearch
	startSearch : function(aSearchString, aSearchParam, aPreviousResult, aListener)
	{
		log('startSearch', aSearchString);
		return this.internal.startSearch(aSearchString, aSearchParam, aPreviousResult, aListener);
	},
	stopSearch : function()
	{
		log('stopSearch');
		return this.internal.stopSearch();
	},
	finishSearch : function(...aArgs)
	{
		log('finishSearch');
		return this.internal.finishSearch(...aArgs);
	},

	// nsIAutoCompleteSimpleResultListener
	onValueRemoved : function(aResult, aSpec, aRemoveFromDB)
	{
		log('onValueRemoved', aSpec);
		return this.internal.onValueRemoved(aResult, aSpec, aRemoveFromDB);
	},

	// nsIAutoCompleteSearchDescriptor
	get searchType() {
		return this.internal.searchType;
	},
	get clearingAutoFillSearchesAgain() {
		return this.internal.clearingAutoFillSearchesAgain;
	},

	// nsIObserver
	observe : function(...aArgs)
	{
		return this.internal.observe(...aArgs);
	}
}; 
  
NSGetFactory = XPCOMUtils.generateNSGetFactory([XMigemoUnifiedComplete]); 
 
