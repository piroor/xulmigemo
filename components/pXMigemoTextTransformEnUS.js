function pXMigemoTextTransformEnUS() {} 

pXMigemoTextTransformEnUS.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/text-transform;1?lang=en-US';
	},
	get classDescription() {
		return 'This is a text transformation service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{323b8fbe-1deb-11dc-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	nonAsciiRegExp : /[^a-zA-Z0-9\!\_\-\?\/\\\~\|\{\}\(\)\'\"\&\%\$\<\>\[\]\@\`\+\*\;\:]/gi, 
 
	isValidInput : function(aInput) 
	{
		return this.normalizeInput(aInput) ? true : false ;
	},
 
	normalizeInput : function(aInput) 
	{
		return aInput.replace(this.nonAsciiRegExp, '');
	},
 
	normalizeKeyInput : function(aInput) 
	{
		return aInput.replace(this.nonAsciiRegExp, '');
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoTextTransform) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
var gModule = { 
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Components.interfaces.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		manager : {
			CID        : pXMigemoTextTransformEnUS.prototype.classID,
			contractID : pXMigemoTextTransformEnUS.prototype.contractID,
			className  : pXMigemoTextTransformEnUS.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoTextTransformEnUS()).QueryInterface(aIID);
				}
			}
		}
	},

	canUnload : function (aComponentManager)
	{
		return true;
	}
};

function NSGetModule(compMgr, fileSpec)
{
	return gModule;
}
 
