var XMigemoOrganizerOverlay = { 
	 
	expandQuery : function(aQuery) 
	{
		var queries = [aQuery];
		var terms = XMigemoCore.getTermsForInputFromSource(
				aQuery.searchTerms,
				XMigemoCore.smartLocationBarFindSource
			);
		if (terms.length) {
			queries = queries
				.concat(terms.map(function(aTerm) {
					var newQuery = aQuery.clone();
					newQuery.searchTerms = aTerm;
					return newQuery;
				}));
		}
		return queries;
	},
 
	handleEvent : function(aEvent) 
	{
		window.removeEventListener('load', this, false);

		eval('PlacesSearchBox.search = '+
			PlacesSearchBox.search.toSource().replace(
				'content.load([query], options)',
				'content.load(XMigemoOrganizerOverlay.expandQuery(query), options);'
			)
		);

		var tree = document.getElementById('placeContent');
		eval('tree.applyFilter = '+
			tree.applyFilter.toSource().replace(
				'this.load([query], options);',
				'this.load(XMigemoOrganizerOverlay.expandQuery(query), options);'
			)
		);
	}
 
}; 
  
window.addEventListener('load', XMigemoOrganizerOverlay, false); 
 	
