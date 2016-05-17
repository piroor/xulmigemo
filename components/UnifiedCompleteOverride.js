Components.classes['@mozilla.org/moz/jssubscript-loader;1']
	.getService(Components.interfaces.mozIJSSubScriptLoader)
	.loadSubScript('resource://gre/components/UnifiedComplete.js');

var OriginalSearch = Search;
Search = function(aSearchString, aSearchParam, aAutocompleteListener,
					aResultListener, aAutocompleteSearch,
					aProhibitSearchSuggestions,
					...aArgs) {
	OriginalSearch.call(this, aSearchString, aSearchParam, aAutocompleteListener,
						aResultListener.__xm__outer, aAutocompleteSearch.__xm__outer,
						aProhibitSearchSuggestions,
						...aArgs);
};
Search.prototype = OriginalSearch.prototype;

function log(...aArgs) 
{
	if (Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.places'))
		Services.console.logStringMessage('unifiedcomplete: ' + aArgs.join(', '));
}
dump = log;

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
 
