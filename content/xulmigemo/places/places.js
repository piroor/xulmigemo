var XMigemoPlaces = { 
	 
	chunk     : 100, 
	ignoreURI : true,
	minLength : 3,
 
	TextUtils : Components 
			.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
			.getService(Components.interfaces.pIXMigemoTextUtils),
 	
	isValidInput : function(aInput) 
	{
		return (
			(
				!this.ignoreURI ||
				!/^\w+:\/\//.test(aInput)
			) &&
			this.minLength <= aInput.length
			);
	},
 
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
		         COALESCE(bookmark, title) || ' ' ||
		         COALESCE(tags, '')        || ' ' ||
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
  
	get historyInRangeSQL() 
	{
		if (!this._historyInRangeSQL) {
			this._historyInRangeSQL = this.historyInRangeSQLBase
				.replace('%TAGS%', this.tagsSQLFragment);
		}
		return this._historyInRangeSQL;
	},
	
	historyInRangeSQLBase : <![CDATA[ 
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
		         WHERE p.hidden <> 1
		         LIMIT ?2,?3)
	]]>.toString(),
  
	get bookmarksInRangeSQL() 
	{
		if (!this._bookmarksInRangeSQL) {
			this._bookmarksInRangeSQL = this.bookmarksInRangeSQLBase
				.replace('%TAGS%', this.tagsSQLFragment);
		}
		return this._bookmarksInRangeSQL;
	},
	
	bookmarksInRangeSQLBase : <![CDATA[ 
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
		               LEFT OUTER JOIN moz_places p ON b.fk = p.id
		         WHERE b.type = 1 AND b.title IS NOT NULL
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
		          COALESCE(bookmark, title) || ' ' ||
		          COALESCE(tags, '')        || ' ' ||
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
  
	getSourceInRange : function(aSQL, aStart, aRange) 
	{
		if (!this.db) return '';

		aStart = Math.max(0, aStart);
		aRange = Math.max(0, aRange);
		if (!aRange) return '';

		var statement = this.db.createStatement(aSQL);
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
  
	startProgressiveLoad : function(aBaseQuery, aOptions, aTree, aSourceSQL) 
	{
		this.stopProgressiveLoad();
		if (!aBaseQuery || !aOptions || !aTree || !aSourceSQL) return;

		if (
			this.autoStartRegExpFind &&
			this.TextUtils.isRegExp(aBaseQuery.searchTerms)
			) {
			this.lastFindRegExp =
				this.lastTermsRegExp = new RegExp(this.TextUtils.extractRegExpSource(aQuery.searchTerms), 'gim');
		}
		else {
			var regexps = XMigemoCore.getRegExps(aBaseQuery.searchTerms);
			this.lastFindRegExp = new RegExp(
				(XMigemoService.getPref('xulmigemo.places.enableANDFind') ?
					this.TextUtils.getANDFindRegExpFromTerms(regexps) :
					XMigemoCore.getRegExp(aBaseQuery.searchTerms)
				), 'gim');
			this.lastTermsRegExp = new RegExp(this.TextUtils.getORFindRegExpFromTerms(regexps), 'gim');
		}
		this.lastTermSets = [];
		this.lastQueries = [];

		var current = 0;
		var lastQueriesCount = 0;
		this.progressiveLoadTimer = window.setInterval(function(aSelf) {
			if (aSelf.updateQuery(aBaseQuery, aSourceSQL, current, aSelf.chunk)) {
				if (aSelf.lastQueries.length != lastQueriesCount) {
					aTree.load(aSelf.lastQueries, aOptions);
					lastQueriesCount = aSelf.lastQueries.length;
				}
				current += aSelf.chunk;
			}
			else {
				aSelf.stopProgressiveLoad();
			}
		}, 1, this);
	},
	 
	stopProgressiveLoad : function() 
	{
		if (!this.progressiveLoadTimer) return;
		window.clearInterval(this.progressiveLoadTimer);
		this.progressiveLoadTimer = null;
	},
	progressiveLoadTimer : null,
 
	updateQuery : function(aBaseQuery, aSourceSQL, aStart, aRange) 
	{
		var source = this.getSourceInRange(aSourceSQL, aStart, aRange);
		if (!source) return false;

		var termSets = source.match(this.lastFindRegExp);
		if (!termSets) return true;

		var regexp = this.lastTermsRegExp;
		var utils = this.TextUtils;
		termSets = this.TextUtils.brushUpTerms(termSets)
			.map(function(aTermSet) {
				return aTermSet.match(regexp)
					.filter(function(aTerm) {
						return utils.trim(aTerm);
					})
					.join(' ');
			})
			.filter(function(aTerm) {
				return utils.trim(aTerm);
			});

		this.lastTermSets = this.TextUtils.brushUpTerms(this.lastTermSets.concat(termSets));
		this.lastQueries = this.lastTermSets.map(function(aTermSet) {
			var newQuery = aBaseQuery.clone();
			newQuery.searchTerms = aTermSet;
			return newQuery;
		});
		return true;
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
			var utils = this.TextUtils;
			while(statement.executeStep())
			{
				terms = this.TextUtils.brushUpTerms(
						statement.getString(5).match(aTermsRegExp) ||
						[]
					).filter(function(aTerm) {
						return utils.trim(aTerm);
					});
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
	},
 
/* event handling */ 
	 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
			case 'xulmigemo.places.chunk':
				this.chunk = value;
				return;

			case 'xulmigemo.places.ignoreURI':
				this.ignoreURI = value;
				return;

			case 'xulmigemo.places.minLength':
				this.minLength = value;
				return;

			case 'xulmigemo.autostart.regExpFind':
				this.autoStartRegExpFind = value;
				return;

			default:
				return;
		}
	},
	domains : [
		'xulmigemo.places',
		'xulmigemo.autostart.regExpFind'
	],
	preferences : <![CDATA[
		xulmigemo.places.ignoreURI
		xulmigemo.places.chunk
		xulmigemo.places.minLength
		xulmigemo.autostart.regExpFind
	]]>.toString(),
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				this.init();
				break;

			case 'unload':
				this.destroy();
				break;
		}
	},
	 
	init : function() 
	{
		window.removeEventListener('load', this, false);

		XMigemoService.addPrefListener(this);
		window.addEventListener('unload', this, false);
	},
 
	destroy : function() 
	{
		window.removeEventListener('unload', this, false);
		XMigemoService.removePrefListener(this);
	}
   
}; 
  
