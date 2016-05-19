Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/places.jsm');

function log(...aArgs) 
{
	if (Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.places'))
		Services.console.logStringMessage('bookmarks: ' + aArgs.join(', '));
}

var XMigemoBookmarksPanelOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		var tree = document.getElementById('bookmarks-view');
		tree.__xm__load = tree.load;
		tree.load = function(aQueries, aOptions) {
			if (!this.__xm__callingFromProgressiveLoad)
				XMigemoPlaces.stopProgressiveLoad(this);
			if (!this.__xm__callingFromProgressiveLoad &&
				aQueries.length == 1 &&
				XMigemoService.getPref('xulmigemo.places.bookmarksPanel') &&
				XMigemoPlaces.isValidInput(aQueries[0].searchTerms)) {
				log(' => override');
				XMigemoPlaces.startProgressiveLoad(aQueries[0], aOptions, this,
					XMigemoPlaces.bookmarksInRangeSQL);
			}
			else {
				log(' => default');
				return this.__xm__load(aQueries, aOptions);
			}
		};
	}
 
}; 
  
window.addEventListener('load', XMigemoBookmarksPanelOverlay, false); 
 	
