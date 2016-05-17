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
		if (!('applyFilter' in tree)) return;

		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				' \
				if (XMigemoService.getPref("xulmigemo.places.bookmarksPanel") && \
					XMigemoPlaces.isValidInput(query.searchTerms)) \
					XMigemoPlaces.startProgressiveLoad(query, options, this, \
						XMigemoPlaces.bookmarksInRangeSQL); \
				else \
					$& \
				'
			)
		);
		log('tree.applyFilter => '+tree.applyFilter.toSource());
	}
 
}; 
  
window.addEventListener('load', XMigemoBookmarksPanelOverlay, false); 
 	
