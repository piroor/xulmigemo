var XMigemoHistoryPanelOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		var tree = document.getElementById('historyTree');
		if (!tree || !('applyFilter' in tree)) return;

		eval('window.searchHistory = '+
			window.searchHistory.toSource().replace(
				'gHistoryTree.load([query], options);',
				<![CDATA[
					gHistoryTree.load(
						(!XMigemoService.getPref('xulmigemo.places.historyPanel') ?
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

		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				<![CDATA[
					this.load(
						(!XMigemoService.getPref('xulmigemo.places.historyPanel') ?
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
	}
 
}; 
  
window.addEventListener('load', XMigemoHistoryPanelOverlay, false); 
 	
