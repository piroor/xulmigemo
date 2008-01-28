var XMigemoCore = { 
	 
	getRegExp : function(aRoman) 
	{
		return this.XMigemo.getRegExp(aRoman);
	},
 
	gatherEntriesFor : function(aRoman, aTargetDic) 
	{
		return this.XMigemo.gatherEntriesFor(aRoman, aTargetDic, {});
	},
 
	flattenRegExp : function(aRegExp) 
	{
		return this.XMigemo.flattenRegExp(aRegExp, {});
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
			var startPoint = doc.createRange();
			startPoint.setStart(range.startContainer, range.startOffset);
			var endPoint = doc.createRange();
			endPoint.setStart(range.endContainer, range.endOffset);

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
 
