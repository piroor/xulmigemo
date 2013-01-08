const EXPORTED_SYMBOLS = ['XMigemoPlaces']; 

const Cc = Components.classes;
const Ci = Components.interfaces;
 
Components.utils.import('resource://xulmigemo-modules/jstimer.jsm'); 
Components.utils.import('resource://xulmigemo-modules/service.jsm');
Components.utils.import('resource://xulmigemo-modules/migemo.jsm');
Components.utils.import('resource://xulmigemo-modules/here.js');
 
var XMigemoPlaces = { 
	
	chunk     : 100, 
	ignoreURI : true,
	minLength : 3,
	boundaryFindAvailable : false,
	excludeJavaScript : true,
	matchBehavior : 1,
	defaultBehavior : 0,
	openPageAvailable : false,
 
	textUtils : Cc['@piro.sakura.ne.jp/xmigemo/text-utility;1'] 
			.getService(Ci.xmIXMigemoTextUtils),
 
	isValidInput : function(aInput) 
	{
		var converted = aInput.replace(/\s+/g, '\n');
		return (
			(
				!this.ignoreURI ||
				!/^\w+:\/\//.test(aInput)
			) &&
			this.minLength <= aInput.length &&
			migemo.isValidFunctionalInput(aInput)
			);
	},
 
	parseInput : function(aInput) 
	{
		var info = {
				input            : aInput,
				findFlag         : 0,
				findMode         : Ci.xmIXMigemoFind.FIND_MODE_NATIVE,
				findRegExps      : [],
				termsRegExp      : null,
				exceptionsRegExp : null
			};

		var updatedInput = {};
		info.findFlag = this.getFindFlagFromInput(aInput, updatedInput);
		info.input = updatedInput.value;

		var findInput = info.input;
		if (this.autoStartRegExpFind &&
			this.textUtils.isRegExp(findInput)) {
			var flags = 'gm';
			if (/\/[^\/]*i[^\/]*$/.test(findInput)) flags += 'i';
			var source = this.textUtils.extractRegExpSource(findInput);
			info.termsRegExp = new RegExp(source, flags);
			info.findRegExps = [info.termsRegExp];
			info.findMode = Ci.xmIXMigemoFind.FIND_MODE_REGEXP;
		}
		else {
			let termsRegExp = {};
			let exceptionsRegExp = {};
			info.findRegExps = XMigemoCore.getRegExpsFunctional(findInput, termsRegExp, exceptionsRegExp)
								.map(function(aSource) {
									return new RegExp(aSource, 'gim');
								});
			info.termsRegExp = termsRegExp.value ? new RegExp(termsRegExp.value, 'gim') : null ;
			info.exceptionsRegExp = exceptionsRegExp.value ? new RegExp(exceptionsRegExp.value, 'im') : null ;
			info.findMode = Ci.xmIXMigemoFind.FIND_MODE_MIGEMO;
		}

		return info;
	},
	
	kRESTRICT_HISTORY    : (1 << 0), 
	kRESTRICT_BOOKMARKS  : (1 << 1),
	kRESTRICT_TAGGED     : (1 << 2),
	kFIND_TITLE          : (1 << 3),
	kFIND_URI            : (1 << 4),
	kRESTRICT_TYPED      : (1 << 5),
	kRESTRICT_JAVASCRIPT : (1 << 6),
	kRESTRICT_OPENPAGE   : (1 << 7),

	findHistoryKey   : null,
	findBookmarksKey : null,
	findTaggedKey    : null,
	findTypedKey     : null,
	findTitleKey     : null,
	findURIKey       : null,
	findOpenPageKey  : null,
	findKeyRegExp    : null,
	findKeyExtractRegExp : null,
 
	getFindFlagFromInput : function(aInput, aNewInput) 
	{
		if (!aNewInput) aNewInput = {};
		var keys = this.extractFindKeysFromInput(aInput, aNewInput);
		var sourcesFlag = this.defaultBehavior;

		if (!keys.length) return sourcesFlag;

		var flag = 0;

		if (this.findHistoryKey === '' ||
			(this.findHistoryKey && keys.indexOf(this.findHistoryKey) > -1))
			flag |= this.kRESTRICT_HISTORY;
		if (this.findBookmarksKey === '' ||
			(this.findBookmarksKey && keys.indexOf(this.findBookmarksKey) > -1))
			flag |= this.kRESTRICT_BOOKMARKS;
		if (this.findTaggedKey === '' ||
			(this.findTaggedKey && keys.indexOf(this.findTaggedKey) > -1))
			flag |= this.kRESTRICT_TAGGED;
		if (this.findTypedKey === '' ||
			(this.findTypedKey && keys.indexOf(this.findTypedKey) > -1))
			flag |= this.kRESTRICT_TYPED;
		if (this.findOpenPageKey === '' ||
			(this.findOpenPageKey && keys.indexOf(this.findOpenPageKey) > -1))
			flag |= this.kRESTRICT_OPENPAGE;

		if (!flag) flag |= sourcesFlag;

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
		if (this.findTypedKey) keys.push(this.findTypedKey);
		if (this.findOpenPageKey) keys.push(this.findOpenPageKey);
		if (this.findTitleKey) keys.push(this.findTitleKey);
		if (this.findURIKey) keys.push(this.findURIKey);

		if (keys.length) {
			keys = keys.map(function(aKey) {
					return this.textUtils.sanitize(aKey);
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
  
/* SQL */ 
	
/* Placesデータベース全体の検索 */ 
	
	getPlacesSourceInRangeSQL : function(aFindFlag) 
	{
		var sql = this.placesSourceInRangeSQLBase
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(aFindFlag));
		sql = this.insertJavaScriptCondition(
					this.insertTypedCondition(
						this.insertTaggedCondition(
							this.insertOpenPageCondition(
								this.insertFilter(
									sql,
									aFindFlag
								),
								aFindFlag
							),
							aFindFlag
						),
						aFindFlag
					),
					aFindFlag
				);
		return sql;
	},
	
	placesSourceInRangeSQLBase : here(/* 
		SELECT GROUP_CONCAT(%FINDKEY_CONTENTS%, %PLACE_FOR_LINEBREAK%)
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
		               %ONLY_OPENPAGE%
		         ORDER BY frecency DESC
		         LIMIT %PLACE_FOR_START%,%PLACE_FOR_RANGE%)
	*/),
  
	getPlacesItemsSQL : function(aFindFlag) 
	{
		var sql = this.placesItemsSQLBase
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%OPEN_COUNT%', this.openCountColumnSQLFragment)
				.replace('%OPEN_COUNT_FINAL%', this.openCountFinalColumnSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(aFindFlag));
		sql = this.insertJavaScriptCondition(
					this.insertTypedCondition(
						this.insertTaggedCondition(
							this.insertOpenPageCondition(
								this.insertFilter(
									sql,
									aFindFlag
								),
								aFindFlag
							),
							aFindFlag
						),
						aFindFlag
					),
					aFindFlag
				);
		return sql;
	},
	
	placesItemsSQLBase : here(/* 
		SELECT title, uri, favicon, bookmark, tags, findkey %OPEN_COUNT_FINAL%
		  FROM (SELECT *,
		        GROUP_CONCAT(%FINDKEY_CONTENTS%, ' ') findkey
		    FROM (SELECT p.title title,
		                 p.url uri,
		                 f.url favicon,
		                 p.frecency frecency,
		                 p.typed typed,
		                 %BOOKMARK_TITLE%,
		                 %TAGS%
		                 %OPEN_COUNT%
		            FROM moz_places p
		                 LEFT OUTER JOIN moz_favicons f ON f.id = p.favicon_id
		                 %SOURCE_FILTER%
		           WHERE p.frecency <> 0 AND p.hidden <> 1
		                 %EXCLUDE_JAVASCRIPT%
		                 %ONLY_TYPED%
		                 %ONLY_TAGGED%
		                 %ONLY_OPENPAGE%
		           ORDER BY frecency DESC
		           %SOURCES_LIMIT_PART%)
		   GROUP BY uri)
		   WHERE %TERMS_RULES%
	*/),
   
/* 入力履歴の検索 */ 
	
	getInputHistorySourceInRangeSQL : function(aFindFlag) 
	{
		var sql = this.inputHistorySourceInRangeSQLBase
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(aFindFlag));
		sql = this.insertJavaScriptCondition(
					this.insertTypedCondition(
						this.insertTaggedCondition(
							this.insertOpenPageCondition(
								this.insertFilter(
									sql,
									aFindFlag
								),
								aFindFlag
							),
							aFindFlag
						),
						aFindFlag
					),
					aFindFlag
				);
		return sql;
	},
	
	inputHistorySourceInRangeSQLBase : here(/* 
		SELECT GROUP_CONCAT(%FINDKEY_CONTENTS%, %PLACE_FOR_LINEBREAK%)
		  FROM (SELECT p.title title,
		               p.url uri,
		               p.frecency frecency,
		               %BOOKMARK_TITLE%,
		               %TAGS%,
		               i.rank rank
		          FROM (SELECT ROUND(
		                         MAX(
		                           (
		                             (i.input = ?1) + (SUBSTR(i.input, 1, LENGTH(?1)) = ?1)
		                           ) * i.use_count
		                         ),
		                         1
		                       ) AS rank,
		                       place_id
		                  FROM moz_inputhistory i
		                 GROUP BY i.place_id HAVING rank > 0
		               ) AS i
		               LEFT OUTER JOIN moz_places p ON i.place_id = p.id
		               %SOURCE_FILTER%
		         WHERE 1 %EXCLUDE_JAVASCRIPT%
		                 %ONLY_TYPED%
		                 %ONLY_TAGGED%
		                 %ONLY_OPENPAGE%
		         ORDER BY rank DESC, frecency DESC
		         LIMIT %PLACE_FOR_START%,%PLACE_FOR_RANGE%)
	*/),
  
	getInputHistoryItemsSQL : function(aFindFlag) 
	{
		var sql = this.inputHistoryItemsSQLBase
				.replace('%BOOKMARK_TITLE%', this.bookmarkTitleSQLFragment)
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(aFindFlag));
		sql = this.insertJavaScriptCondition(
					this.insertTypedCondition(
						this.insertTaggedCondition(
							this.insertOpenPageCondition(
								this.insertFilter(
									sql,
									aFindFlag
								),
								aFindFlag
							),
							aFindFlag
						),
						aFindFlag
					),
					aFindFlag
				);
		return sql;
	},
	
	inputHistoryItemsSQLBase : here(/*
		SELECT title, uri, favicon, bookmark, tags, findkey
		  FROM (SELECT *,
		        GROUP_CONCAT(%FINDKEY_CONTENTS%, ' ') findkey
		    FROM (SELECT p.title title,
		                 p.url uri,
		                 f.url favicon,
		                 p.frecency frecency,
		                 %BOOKMARK_TITLE%,
		                 %TAGS%,
		                 i.rank rank
		            FROM (SELECT ROUND(
		                           MAX(
		                             (
		                               (i.input = ?1) + (SUBSTR(i.input, 1, LENGTH(?1)) = ?1)
		                             ) * i.use_count
		                           ),
		                           1
		                         ) AS rank,
		                         place_id
		                    FROM moz_inputhistory i
		                   GROUP BY i.place_id HAVING rank > 0
		                 ) AS i
		                 LEFT OUTER JOIN moz_places p ON i.place_id = p.id
		                 %SOURCE_FILTER%
		                 LEFT OUTER JOIN moz_favicons f ON f.id = p.favicon_id
		           WHERE 1 %EXCLUDE_JAVASCRIPT%
		                   %ONLY_TYPED%
		                   %ONLY_TAGGED%
		                   %ONLY_OPENPAGE%
		           %SOURCES_LIMIT_PART%)
		   GROUP BY uri
		   ORDER BY rank DESC, frecency DESC)
		   WHERE %TERMS_RULES%
	*/),
   
/* スマートキーワードの検索 */ 
	
	keywordSearchSourceInRangeSQL : here(/* 
		SELECT GROUP_CONCAT(search_url, %PLACE_FOR_LINEBREAK%)
		  FROM (SELECT REPLACE(s.url, '%s', ?2) search_url
		          FROM moz_keywords k
		               JOIN moz_bookmarks b ON b.keyword_id = k.id
		               JOIN moz_places s ON s.id = b.fk
		               LEFT OUTER JOIN moz_places h ON h.url = search_url
		          WHERE LOWER(k.keyword) = LOWER(?1)
		          ORDER BY h.frecency DESC
                  LIMIT %PLACE_FOR_START%,%PLACE_FOR_RANGE%)
	*/),
 
	keywordSearchItemInRangeSQL : here(/*
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
	*/),
  
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
	
	historyInRangeSQLBase : here(/*
		SELECT GROUP_CONCAT(%FINDKEY_CONTENTS%, %PLACE_FOR_LINEBREAK%)
		  FROM (SELECT p.id id,
		               p.title title,
		               p.url uri,
		               p.title bookmark,
		               %TAGS%
		          FROM moz_places p
		         WHERE p.hidden <> 1
		         LIMIT %PLACE_FOR_START%,%PLACE_FOR_RANGE%)
	*/),
  
	get bookmarksInRangeSQL() 
	{
		if (!this._bookmarksInRangeSQL) {
			this._bookmarksInRangeSQL = this.bookmarksInRangeSQLBase
				.replace('%TAGS%', this.tagsSQLFragment)
				.replace('%FINDKEY_CONTENTS%', this.getFindKeyContentsFromFlag(0));
		}
		return this._bookmarksInRangeSQL;
	},
	
	bookmarksInRangeSQLBase : here(/*
		SELECT GROUP_CONCAT(%FINDKEY_CONTENTS%, %PLACE_FOR_LINEBREAK%)
		  FROM (SELECT b.id id,
		               b.title title,
		               p.url uri,
		               b.title bookmark,
		               %TAGS%
		          FROM moz_bookmarks b
		               LEFT OUTER JOIN moz_places p ON b.fk = p.id
		         WHERE b.type = 1 AND b.title IS NOT NULL
		         LIMIT %PLACE_FOR_START%,%PLACE_FOR_RANGE%)
	*/),
   
	insertFilter : function(aSQL, aFindFlag) 
	{
		return aSQL.replace(
				'%SOURCE_FILTER%',
				this.openCountSourceSQLFragment +
				((aFindFlag & this.kRESTRICT_HISTORY) ?
					' JOIN moz_historyvisits filter1 ON p.id = filter1.place_id ' :
					'' ) +
				((aFindFlag & this.kRESTRICT_BOOKMARKS || aFindFlag & this.kRESTRICT_TAGGED) ?
					' JOIN moz_bookmarks filter2 ON p.id = filter2.fk ' :
					'' )
			);
	},
 
	insertJavaScriptCondition : function(aSQL, aFindFlag) 
	{
		return aSQL.replace(
				'%EXCLUDE_JAVASCRIPT%',
				this.excludeJavaScript ?
					'AND p.url NOT LIKE "javascript:%"' :
					''
			);
	},
 
	insertTypedCondition : function(aSQL, aFindFlag) 
	{
		return aSQL.replace(
				'%ONLY_TYPED%',
				(aFindFlag & this.kRESTRICT_TYPED) ?
					'AND p.typed = 1' :
					''
			);
	},
 
	insertTaggedCondition : function(aSQL, aFindFlag) 
	{
		return aSQL.replace(
				'%ONLY_TAGGED%',
				aFindFlag & this.kRESTRICT_TAGGED ?
					'AND tags NOT NULL' :
					''
			);
	},
 
	insertOpenPageCondition : function(aSQL, aFindFlag) 
	{
		return aSQL.replace(
				'%ONLY_OPENPAGE%',
				(
					this.openPageAvailable &&
					(aFindFlag & this.kRESTRICT_OPENPAGE)
				) ?
					'AND o.open_count IS NOT NULL AND o.open_count > 0' :
					''
			);
	},
 
	parentFolderSQLFragment : here(/*
		SELECT b.parent
		  FROM moz_bookmarks b
		       JOIN moz_bookmarks t
		       ON t.id = b.parent
		       AND t.parent != (SELECT folder_id
		                          FROM moz_bookmarks_roots
		                         WHERE root_name = 'tags')
		 WHERE b.type = 1 AND b.fk = p.id
		 ORDER BY b.lastModified DESC LIMIT 1
	*/),
 
	bookmarkTitleSQLFragment : here(/*
		(SELECT b.title
		  FROM moz_bookmarks b
		       JOIN moz_bookmarks t
		       ON t.id = b.parent
		       AND t.parent != (SELECT folder_id
		                          FROM moz_bookmarks_roots
		                         WHERE root_name = 'tags')
		 WHERE b.type = 1 AND b.fk = p.id
		 ORDER BY b.lastModified DESC LIMIT 1) bookmark
	*/),
 
	tagsSQLFragment : here(/*
		(SELECT GROUP_CONCAT(t.title, ',')
		  FROM moz_bookmarks b
		       JOIN moz_bookmarks t
		       ON t.id = b.parent
		       AND t.parent = (SELECT folder_id
		                         FROM moz_bookmarks_roots
		                        WHERE root_name = 'tags')
		 WHERE b.type = 1 AND b.fk = p.id) tags
	*/),
 
	openCountColumnSQLFragment      : ', o.open_count open_count', 
	openCountFinalColumnSQLFragment : ', open_count',
	openCountSourceSQLFragment      : ' LEFT OUTER JOIN moz_openpages_temp o ON o.place_id = p.id',
  
	/* output of the SQL must be:
		SELECT single_string
		  FROM ...
	 */
	getSingleStringFromRange : function(aSQL, aStart, aRange, aAdditionalBinding) 
	{
		if (!aSQL || !this.db) return '';

		aStart = Math.max(0, aStart);
		aRange = Math.max(0, aRange);
		if (!aRange) return '';

		var offset = aAdditionalBinding ? aAdditionalBinding.length : 0 ;
		var offsets = {
				PLACE_FOR_LINEBREAK : -1,
				PLACE_FOR_START     : -1,
				PLACE_FOR_RANGE     : -1
			};
		var regexp;
		for (var i in offsets)
		{
			if (aSQL.indexOf('%'+i+'%') < 0) continue;
			regexp = new RegExp('%'+i+'%', 'g');
			offsets[i] = offset;
			offset++;
			aSQL = aSQL.replace(regexp, '?'+offset);
		}

		var statement = this.getSingleStringFromRange_lastStatement;
		if (!statement || aSQL != this.getSingleStringFromRange_lastSQL) {
			this.getSingleStringFromRange_lastStatement = null;
			this.getSingleStringFromRange_lastSQL = aSQL;
			if (statement && 'finalize' in statement) statement.finalize();
			try {
				statement = this.db.createStatement(aSQL);
				this.getSingleStringFromRange_lastStatement = statement;
			}
			catch(e) {
				this.getSingleStringFromRange_lastSQL = null;
				dump(e+'\n'+aSQL+'\n');
				throw e;
			}
		}

		if (aAdditionalBinding && aAdditionalBinding.length) {
			aAdditionalBinding.forEach(function(aValue, aIndex) {
				if (typeof aValue == 'number')
					statement.bindDoubleParameter(aIndex, aValue);
				else
					statement.bindStringParameter(aIndex, aValue);
			});
		}

		if (offsets.PLACE_FOR_LINEBREAK > -1)
			statement.bindStringParameter(offsets.PLACE_FOR_LINEBREAK, '\n');
		if (offsets.PLACE_FOR_START > -1)
			statement.bindDoubleParameter(offsets.PLACE_FOR_START, aStart);
		if (offsets.PLACE_FOR_RANGE > -1)
			statement.bindDoubleParameter(offsets.PLACE_FOR_RANGE, aRange);

		var sources;
		while(statement.executeStep())
		{
			sources = statement.getString(0);
		}
		statement.reset();
		return this.textUtils.trim(sources || '');
	},
	getSingleStringFromRange_lastStatement : null,
	getSingleStringFromRange_lastSQL : null,
	
	get db() 
	{
		if (this._db !== void(0))
			return this._db;

		this._db = Cc['@mozilla.org/browser/nav-history-service;1']
				.getService(Ci.nsINavHistoryService)
				.QueryInterface(Ci.nsPIPlacesDatabase)
				.DBConnection;
		return this._db;
	},
	set db(val) // for test
	{
		if (!val) {
			delete this._db;
			return val;
		}

		this._db = val;
		if (!(this._db instanceof Ci.mozIStorageConnection)) {
			var file = this._db;
			if (typeof this._db == 'string') {
				if (this._db.indexOf('file://') == 0) {
					file = Cc['@mozilla.org/network/io-service;1']
							.getService(Ci.nsIIOService)
							.getProtocolHandler('file')
							.QueryInterface(Ci.nsIFileProtocolHandler)
							.getFileFromURLSpec(this._db);
				}
				else {
					file = Cc['@mozilla.org/file/local;1']
							.createInstance(Ci.nsILocalFile);
					file.initWithPath(this._db);
				}
			}
			this._db = StorageService = Cc['@mozilla.org/storage/service;1']
						.getService(Ci.mozIStorageService)
						.openDatabase(file);
		}

		return this._db;
	},
//	_db : null,
  
	startProgressiveLoad : function(aBaseQuery, aOptions, aTree, aSourceSQL, aSaveCommand) 
	{
		this.stopProgressiveLoad();
		if (!aBaseQuery || !aOptions || !aTree || !aSourceSQL) return;

		// clear now
		var blankQuery = aBaseQuery.clone();
		blankQuery.maxVisits = 0;
		blankQuery.minVisits = 1;
		aTree.load([blankQuery], aOptions);

		if (aSaveCommand) aSaveCommand.setAttribute('disabled', true);

		this.lastFindRegExp = null;
		this.lastTermsRegExp = null;
		this.lastExceptionsRegExp = null;

		if (
			this.autoStartRegExpFind &&
			this.textUtils.isRegExp(aBaseQuery.searchTerms)
			) {
			var flags = 'gm';
			if (/\/[^\/]*i[^\/]*$/.test(aBaseQuery.searchTerms)) flags += 'i';
			this.lastFindRegExp =
				this.lastTermsRegExp = new RegExp(this.textUtils.extractRegExpSource(aQuery.searchTerms), flags);
		}
		else {
			let termsRegExp = {};
			let exceptionsRegExp = {};
			this.lastFindRegExp = XMigemoCore.getRegExpFunctional(aBaseQuery.searchTerms, termsRegExp, exceptionsRegExp);
			this.lastFindRegExp = new RegExp(this.lastFindRegExp, 'gim');
			this.lastTermsRegExp = termsRegExp.value ? new RegExp(termsRegExp.value, 'gim') : null ;
//			this.lastExceptionsRegExp = exceptionsRegExp.value ? new RegExp(exceptionsRegExp.value, 'im') : null ;
		}
		this.lastTermSets = [];
		this.lastQueries = [];

		var current = 0;
		var lastQueriesCount = 0;
		this.progressiveLoadTimer = setInterval(function(aSelf) {
			if (aSelf.updateQuery(aBaseQuery, aSourceSQL, current, aSelf.chunk)) {
				if (aSelf.lastQueries.length != lastQueriesCount) {
					aTree.load(aSelf.lastQueries, aOptions);
					if (aSaveCommand) aSaveCommand.removeAttribute('disabled');
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
		clearInterval(this.progressiveLoadTimer);
		this.progressiveLoadTimer = null;
	},
	progressiveLoadTimer : null,
 
	updateQuery : function(aBaseQuery, aSourceSQL, aStart, aRange) 
	{
		var source = this.getSingleStringFromRange(aSourceSQL, aStart, aRange);
		if (!source) return false;

//		if (this.lastExceptionsRegExp)
//			source = source.replace(this.lastExceptionsRegExp, '');

		var termSets = source.match(this.lastFindRegExp);
		if (!termSets) return true;

		var regexp = this.lastTermsRegExp;
		var utils = this.textUtils;
		termSets = this.textUtils.brushUpTerms(termSets)
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

		this.lastTermSets = this.textUtils.brushUpTerms(this.lastTermSets.concat(termSets));
		this.lastQueries = this.lastTermSets.map(function(aTermSet) {
			var newQuery = aBaseQuery.clone();
			newQuery.searchTerms = aTermSet;
			return newQuery;
		});
		return true;
	},
  
/* event handling */ 
	
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
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
				this.excludeJavaScript = value;
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
			case 'browser.urlbar.restrict.typed':
				this.findTypedKey = value;
				this.updateFindKeyRegExp();
				return;
			case 'browser.urlbar.restrict.openpage':
				this.findOpenPageKey = value;
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

			case 'browser.urlbar.matchBehavior':
				this.matchBehavior = value;
				return;

			case 'browser.urlbar.default.behavior':
				this.defaultBehavior = value || 0;
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
	preferences : here(/*
		xulmigemo.places.enableBoundaryFind
		xulmigemo.places.ignoreURI
		xulmigemo.places.chunk
		xulmigemo.places.minLength
		xulmigemo.autostart.regExpFind
		browser.urlbar.filter.javascript
		browser.urlbar.restrict.history
		browser.urlbar.restrict.bookmark
		browser.urlbar.restrict.tag
		browser.urlbar.restrict.typed
		browser.urlbar.restrict.openpage
		browser.urlbar.match.title
		browser.urlbar.match.url
		browser.urlbar.matchBehavior
		browser.urlbar.default.behavior
	*/),
  
	init : function() 
	{
		this.openPageAvailable = XMigemoService.Comparator.compare(XMigemoService.XULAppInfo.version, '3.7a6pre') >= 0;
		if (!this.openPageAvailable) {
			this.openCountColumnSQLFragment = '';
			this.openCountFinalColumnSQLFragment = '';
			this.openCountSourceSQLFragment = '';
		}

		XMigemoService.addPrefListener(this);
		XMigemoService.firstListenPrefChange(this);
	}
 
}; 
  
XMigemoPlaces.init(); 
 
