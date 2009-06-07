var XMigemoCore = { 
	 
	getRegExp : function(aRoman) 
	{
		return this.XMigemo.getRegExp(aRoman);
	},
 
	getRegExps : function(aRoman) 
	{
		return this.XMigemo.getRegExps(aRoman);
	},
 	
	gatherEntriesFor : function(aRoman, aTargetDic) 
	{
		return this.XMigemo.gatherEntriesFor(aRoman, aTargetDic);
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
		return this.XMigemo.flattenRegExp(aRegExp);
	},
 
	get andFindAvailable() 
	{
		return this.XMigemo.andFindAvailable;
	},
 
	get notFindAvailable() 
	{
		return this.XMigemo.notFindAvailable;
	},
 
	getRegExpFunctional : function(aInput, aTermsRegExp, aExceptionRegExp) 
	{
		return this.XMigemo.getRegExpFunctional(aInput, aTermsRegExp, aExceptionRegExp);
	},
 
	getRegExpsFunctional : function(aInput, aTermsRegExp, aExceptionRegExp) 
	{
		return this.XMigemo.getRegExpsFunctional(aInput, aTermsRegExp, aExceptionRegExp);
	},
 
	isValidFunctionalInput : function(aInput) 
	{
		return this.XMigemo.isValidFunctionalInput(aInput);
	},
 
	trimFunctionalInput : function(aInput) 
	{
		return this.XMigemo.trimFunctionalInput(aInput);
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

		var result = this.XMigemo.regExpFindArr(aRegExp.source, flags, aFindRange, aStartPoint, aEndPoint);
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
			var arrTerms = this.TextUtils.range2Text(range).match(aRegExp);
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
	_XMigemo : null,
 
	get TextUtils() { 
		if (!this._TextUtils) {
			try {
				this._TextUtils = Components
					.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
					.getService(Components.interfaces.pIXMigemoTextUtils);
			}
			catch(e) {
				throw e;
			}
		}
		return this._TextUtils;
	},
	_TextUtils : null
 
}; 
  
var xulMigemoCore = XMigemoCore; 
 
