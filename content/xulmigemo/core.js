var XMigemoCore = { 
	
	getRegExp : function(aInput) 
	{
		return this.XMigemo.getRegExp(aInput);
	},
 
	getRegExps : function(aInput) 
	{
		return this.XMigemo.getRegExps(aInput);
	},
 
	getRegExpFunctional : function(aInput, aTermsRegExp, aExceptionRegExp) 
	{
		return this.XMigemo.getRegExpFunctional(aInput, aTermsRegExp, aExceptionRegExp);
	},
 
	getRegExpsFunctional : function(aInput, aTermsRegExp, aExceptionRegExp) 
	{
		return this.XMigemo.getRegExpsFunctional(aInput, aTermsRegExp, aExceptionRegExp);
	},
 
	get XMigemo() { 
		if (!this._XMigemo) {
			try {
				this._XMigemo = Components
					.classes['@piro.sakura.ne.jp/xmigemo/factory;1']
					.getService(Components.interfaces.xmIXMigemoFactory)
					.getService(migemo.language);
			}
			catch(e) {
				throw e;
			}
		}
		return this._XMigemo;
	},
	_XMigemo : null
 
}; 
XMigemoCore.__proto__ = migemo;
  
var xulMigemoCore = XMigemoCore; 
 
