Components.utils.import('resource://gre/modules/Services.jsm');
Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/places.jsm');

function log(...aArgs) 
{
	if (Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.places'))
		Services.console.logStringMessage('history: ' + aArgs.join(', '));
}

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
		log('window.searchHistory => '+window.searchHistory.toSource());

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
		log('tree.applyFilter => '+tree.applyFilter.toSource());
	}
 
}; 
  
window.addEventListener('load', XMigemoHistoryPanelOverlay, false); 
 	
