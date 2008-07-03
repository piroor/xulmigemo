var XMigemoPlaces = { 
	 
	TextUtils : Components 
			.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
			.getService(Components.interfaces.pIXMigemoTextUtils),
 
/* SQL */ 
	 
	get placesSourceInRangeSQL() 
	{
		if (!this._placesSourceInRangeSQL) {
			this._placesSourceInRangeSQL = this.placesSourceInRangeSQLBase
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment);
		}
		return this._placesSourceInRangeSQL;
	},
	 
	placesSourceInRangeSQLBase : <![CDATA[ 
		SELECT GROUP_CONCAT(
		         title                  || ' ' ||
		         COALESCE(bookmark, '') || ' ' ||
		         COALESCE(tags,     '') || ' ' ||
		         uri,
		         ?1
		       )
		  FROM (SELECT p.title title,
		               p.url uri,
		               (%BOOKMARK_TITLE%) bookmark,
		               (%TAGS%) tags
		          FROM moz_places p
		         WHERE p.frecency <> 0 AND p.hidden <> 1
		         LIMIT ?2,?3)
	]]>.toString(),
  
	get locationBarItemsSQL() 
	{
		if (!this._locationBarItemsSQL) {
			this._locationBarItemsSQL = this.locationBarItemsSQLBase
				.replace('%PARENT_FOLDER%', this.parentFolderSQLFragment)
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment);
		}
		return this._locationBarItemsSQL;
	},
	 
	locationBarItemsSQLBase : <![CDATA[ 
		SELECT title, uri, favicon, bookmark, tags, findkey
		  FROM (SELECT *,
		        GROUP_CONCAT(
		          title                  || ' ' ||
		          COALESCE(bookmark, '') || ' ' ||
		          COALESCE(tags, '')     || ' ' ||
		          uri,
		          ' '
		        ) findkey
		    FROM (SELECT p.title title,
		                 p.url uri,
		                 f.url favicon,
		                 p.frecency frecency,
		                 p.typed typed,
		                 (%PARENT_FOLDER%) parent,
		                 (%BOOKMARK_TITLE%) bookmark,
		                 (%TAGS%) tags
		            FROM moz_places p
		                 LEFT OUTER JOIN moz_favicons f ON f.id = p.favicon_id
		           WHERE p.frecency <> 0 AND p.hidden <> 1
		           %SOURCES_LIMIT_PART%)
		   GROUP BY uri)
		 WHERE (%TERMS_RULES%)
		       AND %EXCLUDE_JAVASCRIPT%
		       AND %ONLY_TYPED%
		 ORDER BY frecency DESC
		 LIMIT 0,?1
	]]>.toString(),
  
	get allHistorySQL() 
	{
		if (!this._allHistorySQL) {
			this._allHistorySQL = this.allHistorySQLBase
				.replace('%TAGS%', this.tagsSQLFragment);
		}
		return this._allHistorySQL;
	},
	 
	allHistorySQLBase : <![CDATA[ 
		SELECT GROUP_CONCAT(
		         title              || ' ' ||
		         COALESCE(tags, '') || ' ' ||
		         uri,
		         ?1
		       )
		  FROM (SELECT p.id id,
		               p.title title,
		               p.url uri,
		               (%TAGS%) tags
		          FROM moz_places p
		         WHERE p.hidden <> 1)
		 GROUP BY id
	]]>.toString(),
  
	get allBookmarksSQL() 
	{
		if (!this._allBookmarksSQL) {
			this._allBookmarksSQL = this.allBookmarksSQLBase
				.replace('%TAGS%', this.tagsSQLFragment);
		}
		return this._allBookmarksSQL;
	},
	 
	allBookmarksSQLBase : <![CDATA[ 
		SELECT GROUP_CONCAT(
		         title || ' ' ||
		         COALESCE(tags, '') || ' ' ||
		         uri,
		         ?1
		       )
		  FROM (SELECT b.id id,
		               b.title title,
		               p.url uri,
		               (%TAGS%) tags
		          FROM moz_bookmarks b
		               LEFT OUTER JOIN moz_places p ON b.fk = p.id)
		 GROUP BY id
	]]>.toString(),
  
	parentFolderSQLFragment : <![CDATA[ 
		SELECT b.parent
		  FROM moz_bookmarks b
		       JOIN moz_bookmarks t
		       ON t.id = b.parent
		       AND t.parent != (SELECT folder_id
		                          FROM moz_bookmarks_roots
		                         WHERE root_name = 'tags')
		 WHERE b.type = 1 AND b.fk = p.id
		 ORDER BY b.lastModified DESC LIMIT 1
	]]>.toString(),
 
	bookmarkTitleSQLFragment : <![CDATA[ 
		SELECT b.title
		  FROM moz_bookmarks b
		       JOIN moz_bookmarks t
		       ON t.id = b.parent
		       AND t.parent != (SELECT folder_id
		                          FROM moz_bookmarks_roots
		                         WHERE root_name = 'tags')
		 WHERE b.type = 1 AND b.fk = p.id
		 ORDER BY b.lastModified DESC LIMIT 1
	]]>.toString(),
 
	tagsSQLFragment : <![CDATA[ 
		SELECT GROUP_CONCAT(t.title, ',')
		  FROM moz_bookmarks b
		       JOIN moz_bookmarks t
		       ON t.id = b.parent
		       AND t.parent = (SELECT folder_id
		                         FROM moz_bookmarks_roots
		                        WHERE root_name = 'tags')
		 WHERE b.type = 1 AND b.fk = p.id
	]]>.toString(),
  
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
	 
	getPlacesSourceInRange : function(aStart, aRange) 
	{
		if (!this.db) return '';

		aStart = Math.max(0, aStart);
		aRange = Math.max(0, aRange);
		if (!aRange) return '';

		var statement = this.db.createStatement(this.placesSourceInRangeSQL);
		statement.bindStringParameter(0, '\n');
		statement.bindDoubleParameter(1, aStart);
		statement.bindDoubleParameter(2, aRange);

		var sources;
		while(statement.executeStep())
		{
			sources = statement.getString(0);
		};
		statement.reset();
		return this.TextUtils.trim(sources || '');
	},
 
	get historySource() 
	{
		if (!this.db) return '';

		var statement = this.db.createStatement(this.allHistorySQL);
		statement.bindStringParameter(0, '\n');

		var sources = [];
		while(statement.executeStep())
		{
			sources.push(statement.getString(0));
		};
		statement.reset();

		return sources.join('\n');
	},
 
	get allBookmarksSource() 
	{
		if (!this.db) return '';

		var statement = this.db.createStatement(this.allBookmarksSQL);
		statement.bindStringParameter(0, '\n');

		var sources = [];
		while(statement.executeStep())
		{
			sources.push(statement.getString(0));
		};
		statement.reset();

		return sources.join('\n');
	},
  
	expandNavHistoryQuery : function(aQuery, aSource) 
	{
		if (!aSource) {
			var folders = aQuery.getFolders({});
			var self = this;
			aSource = folders.map(function(aFolder) {
				return self.getBookmarksSourceIn(aFolder);
			}).join('\n');
		}

		var regexps = XMigemoCore.getRegExps(aQuery.searchTerms);
		var termsRegExp = new RegExp(this.TextUtils.getORFindRegExpFromTerms(regexps), 'gim');

		var terms = (
				XMigemoService.getPref('xulmigemo.autostart.regExpFind') &&
				this.TextUtils.isRegExp(aQuery.searchTerms)
			) ?
				this.TextUtils.getMatchedTermsFromSource(
					this.TextUtils.extractRegExpSource(aQuery.searchTerms),
					aSource
				) :
				this.TextUtils.getMatchedTermsFromSource(
					(XMigemoService.getPref('xulmigemo.places.splitByWhiteSpaces') ?
						this.TextUtils.getANDFindRegExpFromTerms(regexps) :
						XMigemoCore.getRegExp(aQuery.searchTerms)
					),
					aSource
				).map(function(aTermSet) {
					return aTermSet.match(termsRegExp).join(' ');
				});
		var queries = [];
		if (terms.length) {
			queries = queries
				.concat(terms.map(function(aTermSet) {
					var newQuery = aQuery.clone();
					newQuery.searchTerms = aTermSet;
					return newQuery;
				}));
		}
		else {
			queries.push(aQuery);
		}
		return queries;
	},
 	
	findLocationBarItemsFromTerms : function(aTerms, aTermsRegExp, aStart, aRange) 
	{
		var items = [];
		if (!aTerms.length) return items;

		aTerms = aTerms.slice(0, Math.min(100, aTerms.length));
		// see nsNavHistoryAytoComplete.cpp
		var sql = this.locationBarItemsSQL
			.replace(
				'%TERMS_RULES%',
				aTerms.map(function(aTerm, aIndex) {
					return ('findkey LIKE ?%d%')
							.replace(/%d%/g, aIndex+2);
				}).join(' OR ')
			)
			.replace(
				'%EXCLUDE_JAVASCRIPT%',
				XMigemoService.getPref('browser.urlbar.filter.javascript') ?
					'uri NOT LIKE "javascript:%"' :
					'1'
			)
			.replace(
				'%ONLY_TYPED%',
				XMigemoService.getPref('browser.urlbar.matchOnlyTyped') ?
					'typed = 1' :
					'1'
			);

		if (aStart !== void(0)) {
			aRange = Math.max(0, aRange);
			if (!aRange) return items;
			sql = sql.replace(
				'%SOURCES_LIMIT_PART%',
				'LIMIT ?'+(aTerms.length+2)+',?'+(aTerms.length+3)
			);
		}
		else {
			sql = sql.replace('%SOURCES_LIMIT_PART%', '');
		}


		var statement;
		try {
			statement = this.db.createStatement(sql);
		}
		catch(e) {
			dump(e+'\n'+sql+'\n');
			return items;
		}
		try {
			statement.bindDoubleParameter(0, XMigemoService.getPref('browser.urlbar.maxRichResults'));
			aTerms.forEach(function(aTerm, aIndex) {
				statement.bindStringParameter(aIndex+1, '%'+aTerm+'%');
			});
			if (aStart !== void(0)) {
				statement.bindDoubleParameter(aTerms.length+1, Math.max(0, aStart));
				statement.bindDoubleParameter(aTerms.length+2, Math.max(0, aRange));
			}
			var item, title, terms;
			while(statement.executeStep())
			{
				terms = this.TextUtils.brushUpTerms(statement.getString(5).match(aTermsRegExp) || []);
				item = {
					title : (statement.getIsNull(0) ? '' : statement.getString(0) ),
					uri   : statement.getString(1),
					icon  : (statement.getIsNull(2) ? '' : statement.getString(2) ),
					tags  : (statement.getIsNull(4) ? '' : statement.getString(4) ),
					style : 'favicon',
					terms : terms.join(' ')
				};
				if (title = (statement.getIsNull(3) ? '' : statement.getString(3) )) {
					item.title = title;
					item.style = 'bookmark';
				}
				if (item.tags) {
					item.style = 'tag';
				}
				items.push(item);
			};
		}
		finally {
			statement.reset();
		}
		return items;
	}
 
}; 
  
