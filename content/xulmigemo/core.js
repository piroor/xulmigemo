var XMigemoCore = { 
	 
	getRegExp : function(aRoman) 
	{
		return this.XMigemo.getRegExp(aRoman);
	},
 
	gatherEntriesFor : function(aRoman, aTargetDic) 
	{
		return this.XMigemo.gatherEntriesFor(aRoman, aTargetDic, {});
	},
 
	getCachedRegExp : function(aInput) 
	{
		if (!(aInput in this.cache)) {
			this.cache[aInput] = new RegExp(this.getRegExp(aInput), 'i');
		}
		return this.cache[aInput];
	},
	cache : {},
 
	flattenRegExp : function(aRegExp) 
	{
		return this.XMigemo.flattenRegExp(aRegExp, {});
	},
 
	getTermsFromSource : function(aRegExp, aSource) 
	{
		var regexp = new RegExp(
				((typeof aRegExp == 'string') ? aRegExp : aRegExp.source ),
				'gim'
			);
		var result = (aSource || '').match(regexp);
		result.sort();
		return result.join('\n')
				.toLowerCase()
				.replace(/^(.+)(\n\1$)+/gim, '$1')
				.split('\n');
	},
	getTermsForInputFromSource : function(aInput, aSource)
	{
		return this.getTermsFromSource(this.getRegExp(aInput), aSource);
	},
 	
	get places() 
	{
		if (this._places !== void(0))
			return this._places;

		this._places = null;

		const DirectoryService = Components
			.classes['@mozilla.org/file/directory_service;1']
			.getService(Components.interfaces.nsIProperties);
		var file = DirectoryService.get('ProfD', Components.interfaces.nsIFile);
		file.append('places.sqlite');
		if (file.exists()) {
			const StorageService = Components
				.classes['@mozilla.org/storage/service;1']
				.getService(Components.interfaces.mozIStorageService);
			this._places = StorageService.openDatabase(file);
		}

		return this._places;
	},
//	_places : null,
	 
	get placesSource() 
	{
		if (!this.places) return '';

		var statement = this.places.createStatement(<![CDATA[
		    SELECT GROUP_CONCAT(p.title, ?1),
		           GROUP_CONCAT(p.url, ?1),
		           GROUP_CONCAT(b.title, ?1)
		      FROM moz_places p
		           LEFT JOIN moz_bookmarks b ON b.fk = p.id
		     WHERE p.hidden <> 1
		  ]]>.toString());
		statement.bindStringParameter(0, '\n');

		var sources = [];
		while(statement.executeStep()) {
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
		if (!this.places) return '';

		var statement = this.places.createStatement(<![CDATA[
		    SELECT GROUP_CONCAT(title, ?1),
		           GROUP_CONCAT(url, ?1)
		      FROM moz_places
		     WHERE hidden <> 1
		  ]]>.toString());
		statement.bindStringParameter(0, '\n');

		var sources = [];
		while(statement.executeStep()) {
			sources.push(statement.getString(0));
			sources.push(statement.getString(1));
		};
		statement.reset();

		sources.push(PlacesUtils.tagging.allTags.join('\n'));
		return sources.join('\n');
	},
 
	get bookmarksSource() 
	{
		if (!this.places) return '';

		var statement = this.places.createStatement(<![CDATA[
		    SELECT GROUP_CONCAT(b.title, ?1),
		           GROUP_CONCAT(p.url, ?1)
		      FROM moz_bookmarks b
		           LEFT JOIN moz_places p ON b.fk = p.id
		  ]]>.toString());
		statement.bindStringParameter(0, '\n');

		var sources = [];
		while(statement.executeStep()) {
			sources.push(statement.getString(0));
			sources.push(statement.getString(1));
		};
		statement.reset();

		sources.push(PlacesUtils.tagging.allTags.join('\n'));
		return sources.join('\n');
	},
  
	expandNavHistoryQuery : function(aQuery, aSource) 
	{
		var queries = [aQuery];
		var terms = this.getTermsForInputFromSource(
				aQuery.searchTerms,
				aSource
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
 
/* Find */ 
	
	regExpFind : function(aRegExp, aFindRange, aStartPoint, aEndPoint, aFindBackwards) 
	{
		var flags = [];
		if (aRegExp.ignoreCase) flags.push('i');
		if (aRegExp.global) flags.push('g');
		if (aRegExp.multiline) flags.push('m');
		flags = flags.join('');

		return this.XMigemo.regExpFind(aRegExp.source, flags, aFindRange, aStartPoint, aEndPoint, (aFindBackwards ? true : false ));
	},
 
	regExpFindArr : function(aRegExp, aFindRange, aStartPoint, aEndPoint) 
	{
		var flags = [];
		if (aRegExp.ignoreCase) flags.push('i');
		if (aRegExp.global) flags.push('g');
		if (aRegExp.multiline) flags.push('m');
		flags = flags.join('');

		var result = this.XMigemo.regExpFindArr(aRegExp.source, flags, aFindRange, aStartPoint, aEndPoint, {});
		return result;
	},
 
	regExpFindArrRecursively : function(aRegExp, aWindow, aOnlyFindStr) 
	{
		var results = [];
		var frames = aWindow.frames;
		for (var i = 0, maxi = frames.length; i < maxi; i++)
		{
			results = results.concat(this.regExpFindArrRecursively(aRegExp, frames[i], aOnlyFindStr));
		}

		var doc = aWindow.document;
		var range = doc.createRange();
		range.selectNodeContents(doc.documentElement);

		if (aOnlyFindStr) {
			var XMigemoTextUtils = Components
					.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
					.getService(Components.interfaces.pIXMigemoTextUtils);
			var arrTerms = XMigemoTextUtils.range2Text(range).match(aRegExp);
			if (arrTerms)
				results = results.concat(arrTerms);
		}
		else {
			results = results.concat(this.regExpFindArr(aRegExp, range));
		}
		return results;
	},
  
	get XMigemo() { 
		if (!this._XMigemo) {
			try {
				this._XMigemo = Components
					.classes['@piro.sakura.ne.jp/xmigemo/factory;1']
					.getService(Components.interfaces.pIXMigemoFactory)
					.getService('ja');
			}
			catch(e) {
				throw e;
			}
		}
		return this._XMigemo;
	},
	_XMigemo : null
 
}; 
  
var xulMigemoCore = XMigemoCore; 
 
