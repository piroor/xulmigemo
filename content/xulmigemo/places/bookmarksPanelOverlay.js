var XMigemoBookmarksPanelOverlay = { 
	 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		var tree = document.getElementById('bookmarks-view');
		if (!('applyFilter' in tree)) return;

		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				<![CDATA[
					this.load(
						(!XMigemoService.getPref('xulmigemo.places.bookmarksPanel') ?
							[query] :
							XMigemoPlaces.expandNavHistoryQuery(
								query,
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
  
window.addEventListener('load', XMigemoBookmarksPanelOverlay, false); 
 	
