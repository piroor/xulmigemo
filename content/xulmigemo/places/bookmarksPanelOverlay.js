Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/places.jsm');
 
var XMigemoBookmarksPanelOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		var tree = document.getElementById('bookmarks-view');
		if (!('applyFilter' in tree)) return;

		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				"if (XMigemoService.getPref('xulmigemo.places.bookmarksPanel') && \n" +
				"	XMigemoPlaces.isValidInput(query.searchTerms)) \n" +
				"	XMigemoPlaces.startProgressiveLoad(query, options, this, \n" +
				"		XMigemoPlaces.bookmarksInRangeSQL); \n" +
				"else \n" +
				"	$& \n"
			)
		);
	}
 
}; 
  
window.addEventListener('load', XMigemoBookmarksPanelOverlay, false); 
 	
