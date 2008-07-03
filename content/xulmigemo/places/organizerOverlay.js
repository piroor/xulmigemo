var XMigemoOrganizerOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		eval('PlacesSearchBox.search = '+
			PlacesSearchBox.search.toSource().replace(
				'content.load([query], options)',
				<![CDATA[
					content.load(
						(!XMigemoService.getPref('xulmigemo.places.organizer') ?
							[query] :
							XMigemoPlaces.expandNavHistoryQuery(
								query,
								XMigemoPlaces.historySource
							)
						),
						options
					);
				]]>
			)
		);

		var tree = document.getElementById('placeContent');
		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				<![CDATA[
					this.load(
						(!XMigemoService.getPref('xulmigemo.places.organizer') ?
							[query] :
							XMigemoPlaces.expandNavHistoryQuery(
								query,
								options.queryType == Ci.nsINavHistoryQueryOptions.QUERY_TYPE_HISTORY ?
									XMigemoPlaces.historySource :
									XMigemoPlaces.allBookmarksSource
							)
						),
						options
					);
				]]>
			)
		);
	}
 
}; 
  
window.addEventListener('load', XMigemoOrganizerOverlay, false); 
 	
