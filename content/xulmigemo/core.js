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
		return '(?:'+aRoman.join(').*(?:')+')';
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
 
