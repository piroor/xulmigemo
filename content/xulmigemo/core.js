var XMigemoCore = { 
	 
	getRegExp : function(aRoman) 
	{
		return this.XMigemo.getRegExp(aRoman);
	},
 
	getRegExpForANDFind : function(aRoman) 
	{
		var self = this;
		aRoman = aRoman
			.replace(/^\s*|\s*$/g, '')
			.split(/\s+/)
			.map(function(aRoman) {
				return self.getRegExp(aRoman);
			});
		return this.expandTerms(aRoman);
//		return '(?:'+aRoman.join(').*(?:')+')';
	},
	 
	get db() 
	{
		if (this._db)
			return this._db;

		const DirectoryService = Components
			.classes['@mozilla.org/file/directory_service;1']
			.getService(Components.interfaces.nsIProperties);
		var file = DirectoryService.get('ProfD', Components.interfaces.nsIFile);
		file.append('xulmigemo.sqlite');

		const StorageService = Components
			.classes['@mozilla.org/storage/service;1']
			.getService(Components.interfaces.mozIStorageService);
		this._db = StorageService.openDatabase(file);

		return this._db;
	},
//	_db : null,
 
	expandTerms : function(aTerms) 
	{
		if (!this.db) return '';

		switch (aTerms.length)
		{
			case 0:
				return '';
			case 1:
				return aTerms[0];
			case 2:
				return '(?:'+aTerms[0]+').*(?:'+aTerms[1]+')|'+
					'(?:'+aTerms[1]+').*(?:'+aTerms[0]+')';
			default:
				break;
		}

		var tableName = 'temp'+parseInt(Math.random() * 65000);
		this.db.executeSimpleSQL('CREATE TEMP TABLE '+tableName+' (term TEXT)');

		try {
			var self = this;
			aTerms.forEach(function(aTerm, aIndex) {
				var statement = self.db.createStatement('INSERT INTO '+tableName+' (term) VALUES (?1)');
				try {
					statement.bindStringParameter(0, aTerm);
					while (statement.executeStep()) {};
				}
				finally {
					statement.reset();
				}
			});
	/*
		SELECT v1.term term1,
		       v2.term term2,
		       v3.term term3,
		       v4.term term4
		  FROM temp v1, temp v2, temp v3, temp v4
		 WHERE term1 NOT IN (term2, term3, term4)
		       AND term2 NOT IN (term1, term3, term4)
		       AND term3 NOT IN (term1, term2, term4)
		       AND term4 NOT IN (term1, term2, term3)
	*/
			var statement = this.db.createStatement(
					'SELECT '+
					aTerms.map(function(aTerm, aIndex) {
						return 'v'+aIndex+'.term term'+aIndex;
					}).join(', ')+
					' FROM '+
					aTerms.map(function(aTerm, aIndex) {
						return tableName+' v'+aIndex;
					}).join(', ')+
					' WHERE '+
					aTerms.map(function(aTerm, aIndex) {
						return 'term'+aIndex+' NOT IN ('+
							aTerms.map(function(aTerm, aRejectIndex) {
								return 'term'+aRejectIndex;
							}).filter(function(aTerm, aRejectIndex) {
								return aRejectIndex != aIndex;
							}).join(', ')+
							')';
					}).join(' AND ')
				);
			var results = [];
			try {
				while (statement.executeStep())
				{
					results.push(
						'('+
						aTerms.map(function(aTerm, aIndex) {
							return statement.getString(aIndex)
						}).join(').*(?:')+
						')'
					);
				}
			}
			finally {
				statement.reset();
			}
		}
		finally {
			this.db.executeSimpleSQL('DROP TABLE '+tableName);
		}

		return results.join('|');
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
		var result = (aSource || '').match(regexp) || [];
		result.sort();
		return result.join('\n')
				.toLowerCase()
				.replace(/^(.+)(\n\1$)+/gim, '$1')
				.split('\n');
	},
	getTermsForInputFromSource : function(aInput, aSource, aIsANDFind)
	{
		return this.getTermsFromSource(
			(aIsANDFind ?
				this.getRegExpForANDFind(aInput) :
				this.getRegExp(aInput)
			),
			aSource);
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
 
