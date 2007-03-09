var XMigemoCore = { 
	 
	getRegExp : function(aRoman) 
	{
		return this.XMigemo.getRegExp(aRoman);
	},
 
	gatherEntriesFor : function(aRoman, aTargetDic) 
	{
		return this.XMigemo.gatherEntriesFor(aRoman, aTargetDic).split('\n');
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

		var result = this.XMigemo.regExpFindAll(aRegExp.source, flags, aFindRange, aStartPoint, aEndPoint);

		var range;
		var arr = [];
		while (result.hasMoreElements())
		{
			range = result.getNext();
			range = range.QueryInterface(Components.interfaces.nsIDOMRange);
			arr.push(range);
		}

		return arr;
	},
  
	get XMigemo() { 
		if (!this._XMigemo)
			this.XMigemo = Components
				.classes['@piro.sakura.ne.jp/xmigemo/core;1']
				.getService(Components.interfaces.pIXMigemo);
		return this._XMigemo;
	},
	_XMigemo : null
 
}; 
 	 
var xulMigemoCore = XMigemoCore; 
 
