var XMigemoPlaces = { 
	 
	chunk     : 100, 
	ignoreURI : true,
	minLength : 3,
	andFindAvailable : true,
	notFindAvailable : true,
	boundaryFindAvailable : false,
	filterJavaScript : true,
	filterTyped : false,
	matchBehavior : 1,
 
	TextUtils : Components 
			.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
			.getService(Components.interfaces.pIXMigemoTextUtils),
 
	isValidInput : function(aInput) 
	{
		var converted = aInput.replace(/\s+/g, '\n');
		return (
			(
				!this.ignoreURI ||
				!/^\w+:\/\//.test(aInput)
			) &&
			this.minLength <= aInput.length &&
			(
				this.TextUtils.isRegExp(aInput) ||
				this.kMIGEMO_PATTERN.test(converted) ||
				(this.notFindAvailable && this.kNOT_PATTERN.test(converted))
			)
			);
	},
	kMIGEMO_PATTERN : /^[\w\-\:\}\{\$\?\*\+\.\^\/\;\\]+$/im,
	kNOT_PATTERN : /^-/im,
 
/* SQL */ 
	 
	kFIND_HISTORY   : 1, 
	kFIND_BOOKMARKS : 2,
	kFIND_TAGGED    : 4,
	kFIND_TITLE     : 8,
	kFIND_URI       : 16,

	findHistoryKey   : null,
	findBookmarksKey : null,
	findTaggedKey    : null,
	findTitleKey     : null,
	findURIKey       : null,
	findKeyRegExp    : null,
	findKeyExtractRegExp : null,
	 
	getFindFlagFromInput : function(aInput, aNewInput) 
	{
		if (!aNewInput) aNewInput = {};
		var keys = this.extractFindKeysFromInput(aInput, aNewInput);
		var flag = 0;

		if (!keys.length) return flag;

		if (this.findHistoryKey === '' ||
			(this.findHistoryKey && keys.indexOf(this.findHistoryKey) > -1))
			flag |= this.kFIND_HISTORY;
		if (this.findBookmarksKey === '' ||
			(this.findBookmarksKey && keys.indexOf(this.findBookmarksKey) > -1))
			flag |= this.kFIND_BOOKMARKS;
		if (this.findTaggedKey === '' ||
			(this.findTaggedKey && keys.indexOf(this.findTaggedKey) > -1))
			flag |= this.kFIND_TAGGED;

		if (this.findTitleKey === '' ||
			(this.findTitleKey && keys.indexOf(this.findTitleKey) > -1))
			flag |= this.kFIND_TITLE;
		if (this.findURIKey === '' ||
			(this.findURIKey && keys.indexOf(this.findURIKey) > -1))
			flag |= this.kFIND_URI;

		return flag;
	},
	
	extractFindKeysFromInput : function(aInput, aNewInput) 
	{
		if (!aNewInput) aNewInput = {};
		aNewInput.value = aInput;
		var extracted = [];
		var keys = !this.findKeyRegExp ?
				null :
				aInput.match(this.findKeyRegExp);
		if (!keys) return extracted;

		aNewInput.value = aInput.replace(this.findKeyRegExp, ' ');

		keys.forEach(function(aKey) {
			var matched = aKey.match(this.findKeyExtractRegExp);
			if (matched) extracted = extracted.concat(matched);
		}, this);
		return extracted;
	},
  
	updateFindKeyRegExp : function() 
	{
		var keys = [];
		if (this.findHistoryKey) keys.push(this.findHistoryKey);
		if (this.findBookmarksKey) keys.push(this.findBookmarksKey);
		if (this.findTaggedKey) keys.push(this.findTaggedKey);
		if (this.findTitleKey) keys.push(this.findTitleKey);
		if (this.findURIKey) keys.push(this.findURIKey);

		if (keys.length) {
			keys = keys.map(function(aKey) {
					return this.TextUtils.sanitize(aKey);
				}, this).join('|');
			this.findKeyRegExp = new RegExp('(?:^|\\s+)('+keys+')(?:$|\\s+)', 'gi');
			this.findKeyExtractRegExp = new RegExp('('+keys+')', 'gi');
		}
		else {
			this.findKeyRegExp = null;
			this.findKeyExtractRegExp = null;
		}
	},
 
	getFindKeyContentsFromFlag : function(aFindFlag) 
	{
		var contents = [];
		if (aFindFlag & this.kFIND_TITLE) {
			contents.push('COALESCE(bookmark, title) || " "');
		}
		if (aFindFlag & this.kFIND_URI) {
			contents.push('uri');
		}
		if (!contents.length) {
			contents.push('COALESCE(bookmark, title) || " "');
			contents.push('COALESCE(tags, "") || " "');
			contents.push('uri');
		}
		return contents.join(' || ');
	},
 
	getFindTargetsFromFlag : function(aItem, aFindFlag) 
	{
		var target = [];
		if (aFindFlag & this.kFIND_TITLE)
			target.push(aItem.title);
		if (aFindFlag & this.kFIND_URI)
			target.push(aItem.uri);
		if (!target.length) {
			target.push(aItem.title);
			target.push(aItem.uri);
			if (aItem.tags)
				target = target.concat(aItem.tags.split(','));
		}
		return target;
	},
 	
	getFindSourceFilterFromFlag : function(aFindFlag) 
	{
		if (
			aFindFlag & this.kFIND_HISTORY &&
			!(aFindFlag & this.kFIND_BOOKMARKS) &&
			!(aFindFlag & this.kFIND_TAGGED)
			) {
			return ' JOIN moz_historyvisits filter ON p.id = filter.place_id ';
		}
		else if (
			!(aFindFlag & this.kFIND_HISTORY) &&
			(
				aFindFlag & this.kFIND_BOOKMARKS ||
				aFindFlag & this.kFIND_TAGGED
			)
			) {
			return ' JOIN moz_bookmarks filter ON p.id = filter.fk ';
		}
		return '';
	},
  
/* Placesデータベース全体の検索 */ 
	
	getPlacesSourceInRangeSQL : function(aFindFlag) 
	{
		var sql = this.placesSourceInRangeSQLBase
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(aFindFlag))
				.replace('%SOURCE_FILTER%', this.getFindSourceFilterFromFlag(aFindFlag));
		sql = this.insertJavaScriptCondition(
					this.insertTypedCondition(
						this.insertTaggedCondition(
							sql,
							aFindFlag
						)
					)
				);
		return sql;
	},
	 
	placesSourceInRangeSQLBase : <![CDATA[ 
		SELECT GROUP_CONCAT(%FINDKEY_CONTENTS%, ?1)
		  FROM (SELECT p.id id,
		               p.title title,
		               p.url uri,
		               p.frecency frecency,
		               p.typed typed,
		               %BOOKMARK_TITLE%,
		               %TAGS%
		          FROM moz_places p
		               LEFT OUTER JOIN moz_favicons f ON f.id = p.favicon_id
		               %SOURCE_FILTER%
		         WHERE p.frecency <> 0 AND p.hidden <> 1
		               %EXCLUDE_JAVASCRIPT%
		               %ONLY_TYPED%
		               %ONLY_TAGGED%
		         ORDER BY frecency DESC
		         LIMIT ?2,?3)
	]]>.toString(),
  
	getPlacesItemsSQL : function(aFindFlag) 
	{
		var sql = this.placesItemsSQLBase
				.replace('%PARENT_FOLDER%', this.parentFolderSQLFragment)
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(aFindFlag))
				.replace('%SOURCE_FILTER%', this.getFindSourceFilterFromFlag(aFindFlag));
		sql = this.insertJavaScriptCondition(
					this.insertTypedCondition(
						this.insertTaggedCondition(
							sql,
							aFindFlag
						)
					)
				);
		return sql;
	},
	
	placesItemsSQLBase : <![CDATA[ 
		SELECT title, uri, favicon, bookmark, tags, findkey
		  FROM (SELECT *,
		        GROUP_CONCAT(%FINDKEY_CONTENTS%, ' ') findkey
		    FROM (SELECT p.title title,
		                 p.url uri,
		                 f.url favicon,
		                 p.frecency frecency,
		                 p.typed typed,
		                 %BOOKMARK_TITLE%,
		                 %TAGS%
		            FROM moz_places p
		                 LEFT OUTER JOIN moz_favicons f ON f.id = p.favicon_id
		                 %SOURCE_FILTER%
		           WHERE p.frecency <> 0 AND p.hidden <> 1
		                 %EXCLUDE_JAVASCRIPT%
		                 %ONLY_TYPED%
		                 %ONLY_TAGGED%
		           ORDER BY frecency DESC
		           %SOURCES_LIMIT_PART%)
		   GROUP BY uri)
		   WHERE %TERMS_RULES%
	]]>.toString(),
   
/* 入力履歴の検索 */ 
	
	getInputHistorySourceInRangeSQL : function(aFindFlag) 
	{
		var sql = this.inputHistorySourceInRangeSQLBase
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(aFindFlag))
				.replace('%SOURCE_FILTER%', this.getFindSourceFilterFromFlag(aFindFlag));
		sql = this.insertJavaScriptCondition(
					this.insertTypedCondition(
						this.insertTaggedCondition(
							sql,
							aFindFlag
						)
					)
				);
		return sql;
	},
	 
	inputHistorySourceInRangeSQLBase : <![CDATA[ 
		SELECT GROUP_CONCAT(%FINDKEY_CONTENTS%, ?1)
		  FROM (SELECT p.title title,
		               p.url uri,
		               p.frecency frecency,
		               %BOOKMARK_TITLE%,
		               %TAGS%,
		               ROUND(
		                 MAX(0,
		                   (
		                     (i.input = ?4) +
		                     (SUBSTR(i.input, 1, LENGTH(?4)) = ?4)
		                    ) * i.use_count
		                 ),
		                 1
		               ) rank
		          FROM moz_inputhistory i
		               JOIN moz_places p ON i.place_id = p.id
		               %SOURCE_FILTER%
		         WHERE 1 %EXCLUDE_JAVASCRIPT%
		                 %ONLY_TYPED%
		                 %ONLY_TAGGED%
		         GROUP BY i.place_id HAVING rank > 0
		         ORDER BY rank DESC, frecency DESC
		         LIMIT ?2,?3)
	]]>.toString(),
  
	getInputHistoryItemsSQL : function(aFindFlag) 
	{
		var sql = this.inputHistoryItemsSQLBase
				.replace('%PARENT_FOLDER%', this.parentFolderSQLFragment)
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(aFindFlag))
				.replace('%SOURCE_FILTER%', this.getFindSourceFilterFromFlag(aFindFlag));
		sql = this.insertJavaScriptCondition(
					this.insertTypedCondition(
						this.insertTaggedCondition(
							sql,
							aFindFlag
						)
					)
				);
		return sql;
	},
	 
	inputHistoryItemsSQLBase : <![CDATA[ 
		SELECT title, uri, favicon, bookmark, tags, findkey
		  FROM (SELECT *,
		        GROUP_CONCAT(%FINDKEY_CONTENTS%, ' ') findkey
		    FROM (SELECT p.title title,
		                 p.url uri,
		                 f.url favicon,
		                 p.frecency frecency,
		                 %BOOKMARK_TITLE%,
		                 %TAGS%,
		                 ROUND(
		                   MAX(0,
		                     (
		                       (i.input = ?1) +
		                       (SUBSTR(i.input, 1, LENGTH(?1)) = ?1)
		                      ) * i.use_count
		                   ),
		                   1
		                 ) rank
		            FROM moz_inputhistory i
		                 JOIN moz_places p ON i.place_id = p.id
		                 %SOURCE_FILTER%
		                 LEFT OUTER JOIN moz_favicons f ON f.id = p.favicon_id
		           WHERE 1 %EXCLUDE_JAVASCRIPT%
		                   %ONLY_TYPED%
		                   %ONLY_TAGGED%
		           GROUP BY i.place_id HAVING rank > 0
		           ORDER BY rank DESC, frecency DESC
		           %SOURCES_LIMIT_PART%)
		   GROUP BY uri)
		   WHERE %TERMS_RULES%
	]]>.toString(),
   
/* スマートキーワードの検索 */ 
	
	get keywordSearchSourceInRangeSQL() 
	{
		if (!this._keywordSearchSourceInRangeSQL) {
			this._keywordSearchSourceInRangeSQL = <![CDATA[
				SELECT GROUP_CONCAT(search_url, ?1)
				  FROM (SELECT REPLACE(s.url, '%s', ?5) search_url
				          FROM moz_keywords k
				               JOIN moz_bookmarks b ON b.keyword_id = k.id
				               JOIN moz_places s ON s.id = b.fk
				               LEFT OUTER JOIN moz_places h ON h.url = search_url
				          WHERE LOWER(k.keyword) = LOWER(?4)
				          ORDER BY h.frecency DESC
		                  LIMIT ?2,?3)
			]]>.toString();
		}
		return this._keywordSearchSourceInRangeSQL;
	},
 
	get keywordSearchItemInRangeSQL() 
	{
		if (!this._keywordSearchItemInRangeSQL) {
			this._keywordSearchItemInRangeSQL = <![CDATA[
				SELECT h.title,
				       REPLACE(s.url, '%s', ?2) search_url,
				       IFNULL(f.url,
				              (SELECT f.url
				                 FROM moz_places r
				                      JOIN moz_favicons f ON f.id = r.favicon_id
				                WHERE r.rev_host = s.rev_host
				                ORDER BY r.frecency DESC LIMIT 1)),
				       b.title,
				       NULL,
				       REPLACE(s.url, '%s', ?2) search_source
				  FROM moz_keywords k
				       JOIN moz_bookmarks b ON b.keyword_id = k.id
				       JOIN moz_places s ON s.id = b.fk
				       LEFT OUTER JOIN moz_places h ON h.url = search_url
				       LEFT OUTER JOIN moz_favicons f ON f.id = h.favicon_id
				 WHERE LOWER(k.keyword) = LOWER(?1)
				 ORDER BY h.frecency DESC
		         %SOURCES_LIMIT_PART%
			]]>.toString();
		}
		return this._keywordSearchItemInRangeSQL;
	},
  
/* Places Organizerとサイドバーの検索 */ 
	
	get historyInRangeSQL() 
	{
		if (!this._historyInRangeSQL) {
			this._historyInRangeSQL = this.historyInRangeSQLBase
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(0));
		}
		return this._historyInRangeSQL;
	},
	
	historyInRangeSQLBase : <![CDATA[ 
		SELECT GROUP_CONCAT(%FINDKEY_CONTENTS%, ?1)
		  FROM (SELECT p.id id,
		               p.title title,
		               p.url uri,
		               p.title bookmark,
		               %TAGS%
		          FROM moz_places p
		         WHERE p.hidden <> 1
		         LIMIT ?2,?3)
	]]>.toString(),
  
	get bookmarksInRangeSQL() 
	{
		if (!this._bookmarksInRangeSQL) {
			this._bookmarksInRangeSQL = this.bookmarksInRangeSQLBase
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(0));
		}
		return this._bookmarksInRangeSQL;
	},
	
	bookmarksInRangeSQLBase : <![CDATA[ 
		SELECT GROUP_CONCAT(%FINDKEY_CONTENTS%, ?1)
		  FROM (SELECT b.id id,
		               b.title title,
		               p.url uri,
		               b.title bookmark,
		               %TAGS%
		          FROM moz_bookmarks b
		               LEFT OUTER JOIN moz_places p ON b.fk = p.id
		         WHERE b.type = 1 AND b.title IS NOT NULL
		         LIMIT ?2,?3)
	]]>.toString(),
   
	insertJavaScriptCondition : function(aSQL) 
	{
		return aSQL.replace(
				'%EXCLUDE_JAVASCRIPT%',
				this.filterJavaScript ?
					'AND p.url NOT LIKE "javascript:%"' :
					''
			);
	},
 
	insertTypedCondition : function(aSQL) 
	{
		return aSQL.replace(
				'%ONLY_TYPED%',
				this.filterTyped ?
					'AND p.typed = 1' :
					''
			);
	},
 
	insertTaggedCondition : function(aSQL, aFindFlag) 
	{
		return aSQL.replace(
				'%ONLY_TAGGED%',
				aFindFlag & this.kFIND_TAGGED ?
					'AND tags NOT NULL' :
					''
			);
	},
 
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
		(SELECT b.title
		  FROM moz_bookmarks b
		       JOIN moz_bookmarks t
		       ON t.id = b.parent
		       AND t.parent != (SELECT folder_id
		                          FROM moz_bookmarks_roots
		                         WHERE root_name = 'tags')
		 WHERE b.type = 1 AND b.fk = p.id
		 ORDER BY b.lastModified DESC LIMIT 1) bookmark
	]]>.toString(),
 
	tagsSQLFragment : <![CDATA[ 
		(SELECT GROUP_CONCAT(t.title, ',')
		  FROM moz_bookmarks b
		       JOIN moz_bookmarks t
		       ON t.id = b.parent
		       AND t.parent = (SELECT folder_id
		                         FROM moz_bookmarks_roots
		                        WHERE root_name = 'tags')
		 WHERE b.type = 1 AND b.fk = p.id) tags
	]]>.toString(),
  
	getSourceInRange : function(aSQL, aStart, aRange, aAdditionalBinding) 
	{
		if (!this.db) return '';

		aStart = Math.max(0, aStart);
		aRange = Math.max(0, aRange);
		if (!aRange) return '';

		var statement;
		try {
			statement = this.db.createStatement(aSQL);
		}
		catch(e) {
			dump(e+'\n'+aSQL+'\n');
			throw e;
		}
		statement.bindStringParameter(0, '\n');
		statement.bindDoubleParameter(1, aStart);
		statement.bindDoubleParameter(2, aRange);
		if (aAdditionalBinding && aAdditionalBinding.length) {
			var offset = 3;
			aAdditionalBinding.forEach(function(aValue, aIndex) {
				if (typeof aValue == 'number')
					statement.bindDoubleParameter(aIndex + offset, aValue);
				else
					statement.bindStringParameter(aIndex + offset, aValue);
			});
		}

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
		if ('nsPIPlacesDatabase' in Components.interfaces) { // Firefox 3.1 or later
			this._db = Components
					.classes['@mozilla.org/browser/nav-history-service;1']
					.getService(Components.interfaces.nsINavHistoryService)
					.QueryInterface(Components.interfaces.nsPIPlacesDatabase)
					.DBConnection;
		}
		else { // Firefox 3.0.x
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
		}
		return this._db;
	},
//	_db : null,
  
	parseInputForKeywordSearch : function(aInput) { 
		var input = aInput;
		var index = input.search(/\s/);
		if (index < 0) index = input.length;
		return {
			keyword : this.TextUtils.trim(input.substring(0, index)),
			terms   : this.TextUtils.trim(input.substring(index+1))
				.replace(/\+/g, '%2B')
				.replace(/\s+/g, '+')
		};
	},
 
	startProgressiveLoad : function(aBaseQuery, aOptions, aTree, aSourceSQL) 
	{
		this.stopProgressiveLoad();
		if (!aBaseQuery || !aOptions || !aTree || !aSourceSQL) return;

		this.lastExceptions = [];
		if (
			this.autoStartRegExpFind &&
			this.TextUtils.isRegExp(aBaseQuery.searchTerms)
			) {
			this.lastFindRegExp =
				this.lastTermsRegExp = new RegExp(this.TextUtils.extractRegExpSource(aQuery.searchTerms), 'gim');
		}
		else {
//			if (this.notFindAvailable) {
//				var exceptions = {};
//				findInput = this.siftExceptions(findInput, exceptions);
//				this.lastExceptions = exceptions.value;
//			}
			var regexps = XMigemoCore.getRegExps(aBaseQuery.searchTerms);
			this.lastFindRegExp = new RegExp(
				(this.andFindAvailable ?
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
  
	siftExceptions : function(aInput, aExceptions) 
	{
		if (!aExceptions) aExceptions = {};
		aExceptions.value = [];
		var findInput = aInput.split(/\s+/).filter(function(aTerm) {
			if (aTerm.indexOf('-') == 0) {
				aExceptions.value.push(aTerm.substring(1));
				return false;
			}
			return true;
		}).join(' ');
		return findInput;
	},
 
/* event handling */ 
	
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
			case 'xulmigemo.places.enableANDFind':
				this.andFindAvailable = value;
				return;

			case 'xulmigemo.places.enableNOTFind':
				this.notFindAvailable = value;
				return;

			case 'xulmigemo.places.enableBoundaryFind':
				this.boundaryFindAvailable = value;
				return;

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

			case 'browser.urlbar.filter.javascript':
				this.filterJavaScript = value;
				return;

			case 'browser.urlbar.restrict.history':
				this.findHistoryKey = value;
				this.updateFindKeyRegExp();
				return;
			case 'browser.urlbar.restrict.bookmark':
				this.findBookmarksKey = value;
				this.updateFindKeyRegExp();
				return;
			case 'browser.urlbar.restrict.tag':
				this.findTaggedKey = value;
				this.updateFindKeyRegExp();
				return;

			case 'browser.urlbar.match.title':
				this.findTitleKey = value;
				this.updateFindKeyRegExp();
				return;
			case 'browser.urlbar.match.url':
				this.findURIKey = value;
				this.updateFindKeyRegExp();
				return;

			case 'browser.urlbar.matchOnlyTyped':
				this.filterTyped = value;
				return;

			case 'browser.urlbar.matchBehavior':
				this.matchBehavior = value;
				return;

			default:
				return;
		}
	},
	domains : [
		'xulmigemo.places',
		'xulmigemo.autostart.regExpFind',
		'browser.urlbar'
	],
	preferences : <![CDATA[
		xulmigemo.places.enableANDFind
		xulmigemo.places.enableNOTFind
		xulmigemo.places.enableBoundaryFind
		xulmigemo.places.ignoreURI
		xulmigemo.places.chunk
		xulmigemo.places.minLength
		xulmigemo.autostart.regExpFind
		browser.urlbar.filter.javascript
		browser.urlbar.restrict.history
		browser.urlbar.restrict.bookmark
		browser.urlbar.restrict.tag
		browser.urlbar.match.title
		browser.urlbar.match.url
		browser.urlbar.matchOnlyTyped
		browser.urlbar.matchBehavior
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
 
window.addEventListener('load', XMigemoPlaces, false); 
  
