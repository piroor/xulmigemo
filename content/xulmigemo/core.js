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
	 
	get smartLocationBarFindSource() 
	{
		if (!this.places) return '';

		var statement = this.places.createStatement(<![CDATA[
		    SELECT GROUP_CONCAT(p.title, ?1),
		           GROUP_CONCAT(p.url, ?1),
		           GROUP_CONCAT(b.title, ?1)
		      FROM moz_places p
		           LEFT JOIN moz_bookmarks b ON b.fk = p.id
		     WHERE hidden <> 1
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
 
