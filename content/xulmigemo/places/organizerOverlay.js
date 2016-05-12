Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/places.jsm');
 
var XMigemoOrganizerOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		eval('PlacesSearchBox.search = '+
			PlacesSearchBox.search.toSource().replace(
				'content.load([query], options)',
				"if (XMigemoService.getPref('xulmigemo.places.organizer') && \n" +
				"	XMigemoPlaces.isValidInput(query.searchTerms)) \n" +
				"	XMigemoPlaces.startProgressiveLoad(query, options, content, \n" +
				"		XMigemoPlaces.historyInRangeSQL); \n" +
				"else \n" +
				"	$&  \n"
			)
		);

		var tree = document.getElementById('placeContent');
		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				"if (XMigemoService.getPref('xulmigemo.places.organizer') && \n" +
				"	XMigemoPlaces.isValidInput(query.searchTerms)) { \n" +
				"	XMigemoPlaces.startProgressiveLoad(query, options, this, \n" +
				"		options.queryType == Ci.nsINavHistoryQueryOptions.QUERY_TYPE_HISTORY ? \n" +
				"			XMigemoPlaces.historyInRangeSQL : \n" +
				"			XMigemoPlaces.bookmarksInRangeSQL, \n" +
				"		XMigemoOrganizerOverlay.saveCommand \n" +
				"	); \n" +
				"} \n" +
				"else { \n" +
				"	if (XMigemoOrganizerOverlay.saveCommand) \n" +
				"		XMigemoOrganizerOverlay.saveCommand.removeAttribute('disabled'); \n" +
				"	$& \n" +
				"} \n"
			)
		);
	},

	get saveCommand()
	{
		return document.getElementById('OrganizerCommand_search:save');
	}
 
}; 
  
window.addEventListener('load', XMigemoOrganizerOverlay, false); 
 	
