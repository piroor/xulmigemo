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
							XMigemoCore.expandNavHistoryQuery(
								query,
								XMigemoCore.historySource
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
							XMigemoCore.expandNavHistoryQuery(
								query,
								XMigemoCore.bookmarksSource
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
 	
