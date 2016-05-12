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
				' \
				if (XMigemoService.getPref("xulmigemo.places.historyPanel") && \
					XMigemoPlaces.isValidInput(query.searchTerms)) \
					XMigemoPlaces.startProgressiveLoad(query, options, gHistoryTree, \
						XMigemoPlaces.historyInRangeSQL); \
				else \
					$& \
				'
			)
		);

		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				' \
				if (XMigemoService.getPref("xulmigemo.places.historyPanel") && \
					XMigemoPlaces.isValidInput(query.searchTerms)) \
					XMigemoPlaces.startProgressiveLoad(query, options, this, \
						XMigemoPlaces.historyInRangeSQL); \
				else \
					$& \
				'
			)
		);
	}
 
}; 
  
window.addEventListener('load', XMigemoHistoryPanelOverlay, false); 
 	
