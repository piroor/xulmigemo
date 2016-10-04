Components.classes['@mozilla.org/moz/jssubscript-loader;1']
	.getService(Components.interfaces.mozIJSSubScriptLoader)
	.loadSubScript('resource://gre/components/UnifiedComplete.js');

Cu.import('resource://xulmigemo-modules/constants.jsm');

Cu.import('resource://xulmigemo-modules/places.jsm');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('unifiedcomplete', ...aArgs); }
dump = log;

var OriginalSearch = Search;
Search = function(aSearchString, aSearchParam, aAutocompleteListener,
					aResultListener, aAutocompleteSearch,
					aProhibitSearchSuggestions,
					...aArgs) {
	if (Services.prefs.getBoolPref(MigemoConstants.BASE+'places.locationBar') &&
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

var lastFindInfo;

Object.defineProperty(Search.prototype, '__xm__searchQuery',
	Object.getOwnPropertyDescriptor(OriginalSearch.prototype, '_searchQuery'));
Object.defineProperty(Search.prototype, '_searchQuery', {
	get: function() {
		var query = this.__xm__searchQuery;
		if (this.__xm__findInfo) {
			query[0] = query[0].replace(/AUTOCOMPLETE_MATCH\(([^)]+\)[^)]+)\)/, 'MIGEMO_MATCH($1) AND AUTOCOMPLETE_MATCH($1)');
			query[1].searchString = ' ';
			lastFindInfo = this.__xm__findInfo;
			//query[1].maxResults = -1;
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
			query[0] = query[0].replace(/AUTOCOMPLETE_MATCH\(([^)]+)\)/, 'MIGEMO_MATCH($1) AND AUTOCOMPLETE_MATCH($1)');
			query[1].searchString = ' ';
			lastFindInfo = this.__xm__findInfo;
//			query[1].maxResults = -1;
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
			query[0] = query[0].replace(/AUTOCOMPLETE_MATCH\(([^)]+\)[^)]+)\)/, 'MIGEMO_MATCH($1) AND AUTOCOMPLETE_MATCH($1)');
			query[1].search_string = ' ';
			lastFindInfo = this.__xm__findInfo;
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


UnifiedComplete.prototype.__xm__getDatabaseHandle = UnifiedComplete.prototype.getDatabaseHandle;
UnifiedComplete.prototype.getDatabaseHandle = function(...aArgs) {
	return this.__xm__getDatabaseHandle(...aArgs)
		.then(function(aConnection) {
			try {
				aConnection._connectionData._dbConn
					.createFunction(
						'MIGEMO_MATCH',
						10 /* https://dxr.mozilla.org/mozilla-central/rev/42c95d88aaaa7c2eca1d278399421d437441ac4d/toolkit/components/places/SQLFunctions.h#89 */,
						function(aArguments) {
							if (!lastFindInfo)
								return true;

							var uri = aArguments.getString(1);
							var title = aArguments.getString(2);
							var matchTarget = uri + '\n' + title;
							if (lastFindInfo.findRegExps.length > 0 &&
								lastFindInfo.findRegExps.some(function(aRegExp) {
									return !aRegExp.test(matchTarget);
								}))
								return false;

							if (lastFindInfo.exceptionsRegExp &&
								lastFindInfo.exceptionsRegExp.test(matchTarget))
								return false;

							return true;
						}
					);
				log('Function "MIGEMO_MATCH" successfully registered.');
			}
			catch(e) {
			}
			return aConnection;
		});
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
 
