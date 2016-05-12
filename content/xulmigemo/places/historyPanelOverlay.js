Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/places.jsm');
 
var XMigemoHistoryPanelOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		var tree = document.getElementById('historyTree');
		if (!tree || !('applyFilter' in tree)) return;

		eval('window.searchHistory = '+
			window.searchHistory.toSource().replace(
				'gHistoryTree.load([query], options);',
				"if (XMigemoService.getPref('xulmigemo.places.historyPanel') && \n" +
				"	XMigemoPlaces.isValidInput(query.searchTerms)) \n" +
				"	XMigemoPlaces.startProgressiveLoad(query, options, gHistoryTree, \n" +
				"		XMigemoPlaces.historyInRangeSQL); \n" +
				"else \n" +
				"	$& \n"
			)
		);

		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				"if (XMigemoService.getPref('xulmigemo.places.historyPanel') && \n" +
				"	XMigemoPlaces.isValidInput(query.searchTerms)) \n" +
				"	XMigemoPlaces.startProgressiveLoad(query, options, this, \n" +
				"		XMigemoPlaces.historyInRangeSQL); \n" +
				"else \n" +
				"	$& \n"
			)
		);
	}
 
}; 
  
window.addEventListener('load', XMigemoHistoryPanelOverlay, false); 
 	
