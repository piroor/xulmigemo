var XMigemoOrganizerOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		eval('PlacesSearchBox.search = '+
			PlacesSearchBox.search.toSource().replace(
				'content.load([query], options)',
				<![CDATA[
					if (XMigemoService.getPref('xulmigemo.places.organizer') &&
						XMigemoPlaces.isValidInput(query.searchTerms))
						XMigemoPlaces.startProgressiveLoad(query, options, content,
							XMigemoPlaces.historyInRangeSQL);
					else
						$&
				]]>
			)
		);

		var tree = document.getElementById('placeContent');
		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				<![CDATA[
					if (XMigemoService.getPref('xulmigemo.places.organizer') &&
						XMigemoPlaces.isValidInput(query.searchTerms)) {
						XMigemoPlaces.startProgressiveLoad(query, options, this,
							options.queryType == Ci.nsINavHistoryQueryOptions.QUERY_TYPE_HISTORY ?
								XMigemoPlaces.historyInRangeSQL :
								XMigemoPlaces.bookmarksInRangeSQL,
							XMigemoOrganizerOverlay.saveCommand
						);
					}
					else {
						if (XMigemoOrganizerOverlay.saveCommand)
							XMigemoOrganizerOverlay.saveCommand.removeAttribute('disabled');
						$&
					}
				]]>
			)
		);
	},

	get saveCommand()
	{
		return document.getElementById('OrganizerCommand_search:save');
	}
 
}; 
  
window.addEventListener('load', XMigemoOrganizerOverlay, false); 
 	
