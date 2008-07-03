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
					if (XMigemoService.getPref('xulmigemo.places.bookmarksPanel'))
						XMigemoPlaces.startProgressiveLoad(query, options, this,
							XMigemoPlaces.bookmarksInRangeSQL);
					else
						$&
				]]>
			)
		);
	}
 
}; 
  
window.addEventListener('load', XMigemoBookmarksPanelOverlay, false); 
 	
