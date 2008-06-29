var XMigemoPlaces = { 
	 
	get db() 
	{
		if (this._db !== void(0))
			return this._db;

		this._db = null;

		const DirectoryService = Components
			.classes['@mozilla.org/file/directory_service;1']
			.getService(Components.interfaces.nsIProperties);
		var file = DirectoryService.get('ProfD', Components.interfaces.nsIFile);
		file.append('places.sqlite');
		if (file.exists()) {
			const StorageService = Components
				.classes['@mozilla.org/storage/service;1']
				.getService(Components.interfaces.mozIStorageService);
			this._db = StorageService.openDatabase(file);
		}

		return this._db;
	},
//	_db : null,
	
	get placesSource() 
	{
		if (!this.db) return '';

		var statement = this.db.createStatement(<![CDATA[
		    SELECT GROUP_CONCAT(p.title, ?1),
		           GROUP_CONCAT(p.url, ?1),
		           GROUP_CONCAT(b.title, ?1)
		      FROM moz_places p
		           LEFT JOIN moz_bookmarks b ON b.fk = p.id
		     WHERE p.hidden <> 1
		  ]]>.toString());
		statement.bindStringParameter(0, '\n');

		var sources = [];
		while(statement.executeStep())
		{
			sources.push(statement.getString(0));
			sources.push(statement.getString(1));
			sources.push(statement.getString(2));
		};
		statement.reset();

		sources.push(PlacesUtils.tagging.allTags.join('\n'));
		return sources.join('\n');
	},
 
	get historySource() 
	{
		if (!this.db) return '';

		var statement = this.db.createStatement(<![CDATA[
		    SELECT GROUP_CONCAT(title, ?1),
		           GROUP_CONCAT(url, ?1)
		      FROM moz_places
		     WHERE hidden <> 1
		  ]]>.toString());
		statement.bindStringParameter(0, '\n');

		var sources = [];
		while(statement.executeStep())
		{
			sources.push(statement.getString(0));
			sources.push(statement.getString(1));
		};
		statement.reset();

		sources.push(PlacesUtils.tagging.allTags.join('\n'));
		return sources.join('\n');
	},
 
	get bookmarksSource() 
	{
		if (!this.db) return '';

		var statement = this.db.createStatement(<![CDATA[
		    SELECT GROUP_CONCAT(b.title, ?1),
		           GROUP_CONCAT(p.url, ?1)
		      FROM moz_bookmarks b
		           LEFT JOIN moz_places p ON b.fk = p.id
		  ]]>.toString());
		statement.bindStringParameter(0, '\n');

		var sources = [];
		while(statement.executeStep())
		{
			sources.push(statement.getString(0));
			sources.push(statement.getString(1));
		};
		statement.reset();

		sources.push(PlacesUtils.tagging.allTags.join('\n'));
		return sources.join('\n');
	},
  
	getFrecencyFromURI : function(aURI) 
	{
		if (!this.db) return 0;

		var statement = this.db.createStatement(<![CDATA[
		    SELECT frecency
		      FROM moz_places
		     WHERE url = ?1
		  ]]>.toString());
		statement.bindStringParameter(0, aURI);
		var frecency = 0;
		while(statement.executeStep())
		{
			frecency = statement.getDouble(0);
		};
		statement.reset();
		return frecency;
	},
 
	expandNavHistoryQuery : function(aQuery, aSource) 
	{
		var queries = [aQuery];
		var terms = XMigemoCore.getTermsForInputFromSource(
				aQuery.searchTerms,
				aSource,
				true
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
	}
 	
}; 
  
