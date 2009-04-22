var DEBUG = false; 
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
function pXMigemoDatabase() { 
	mydump('create instance pIXMigemoDatabase');
}

pXMigemoDatabase.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/database;1';
	},
	get classDescription() {
		return 'This is a database service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{4651c440-2e87-11de-8c30-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	kDATABASE : 'xulmigemo.sqlite', 
 
	get textUtils() 
	{
		if (!this._textUtils) {
			if (TEST && pXMigemoTextUtils) {
				this._textUtils = new pXMigemoTextUtils();
			}
			else {
				this._textUtils = Cc['@piro.sakura.ne.jp/xmigemo/text-utility;1']
						.getService(Ci.pIXMigemoTextUtils);
			}
		}
		return this._textUtils;
	},
	_textUtils : null,
 
	get DBConnection() 
	{
		if (!this._DBConnection) {
			const DirectoryService = Cc['@mozilla.org/file/directory_service;1']
					.getService(Ci.nsIProperties);
			var file = DirectoryService.get('ProfD', Ci.nsIFile);
			file.append(this.kDATABASE);

			var storageService = Cc['@mozilla.org/storage/service;1']
					.getService(Ci.mozIStorageService);
			this._DBConnection = storageService.openDatabase(file);
		}
		return this._DBConnection;
	},
	_DBConnection : null,
 
	tableExists : function(aTable)
	{
		return this.DBConnection.tableExists(aTable);
	},
 
	createTable : function(aTable, aDefinitions)
	{
		if (this.tableExists(aTable)) return;
		dump(aTable+' / '+ aDefinitions+'\n');
		this.DBConnection.createTable(aTable, aDefinitions);
	},
 
	dropTable : function(aTable)
	{
	},
 
	createStatement : function(aSQL) 
	{
		if (!(aSQL in this._statements)) {
			this._statements[aSQL] = this.DBConnection.createStatement(aSQL);
		}
		return this._statements[aSQL];
	},
	_statements : {},
 
	initTermsTable : function(aTable)
	{
		this.createTable(aTable, 'key TEXT PRIMARY KEY, decomposed_key TEXT, terms TEXT');
	},
 
	getTermsForKey : function(aTable, aKey, aDecomposedKey)
	{
		try {
			var statement = this.createStatement(
					aKey ?
						'SELECT terms FROM '+aTable+' WHERE key = ?1' :
						'SELECT terms FROM '+aTable+' WHERE decomposed_key = ?1'
				);
			statement.bindStringParameter(0, aKey || aDecomposedKey);
			var terms = '';
			try {
				while(statement.executeStep())
				{
					terms = statement.getString(0);
				}
			}
			catch(e) {
			}
			finally {
				statement.reset();
			}
			return this.testUtils.trim(terms).split(/\t+/);
		}
		catch(e) {
			return [];
		}
	},
 
	setTermsForKey : function(aTable, aKey, aDecomposedKey, aTerms)
	{
		try {
			var statement = this.createStatement(
					'INSERT OR REPLACE INTO '+aTable+
					' (key, decomposed_key, terms)'+
					' VALUES(?1, ?2, ?3)'
				);
			statement.bindStringParameter(0, aKey);
			statement.bindStringParameter(1, aDecomposedKey);
			statement.bindStringParameter(2, this.textUtils.brushUpTerms(aTerms).join('\t'));
			try {
				while(statement.executeStep()) {}
			}
			catch(e) {
			}
			finally {
				statement.reset();
			}
		}
		catch(e) {
		}
	},
 
	addTermsForKey : function(aTable, aKey, aDecomposedKey, aTerms)
	{
		var oldTerms = this.getTermsForKey(aTable, aKey, aDecomposedKey);
		this.setTermsForKey(aTable, aKey, aDecomposedKey, aTerms.concat(oldTerms));
	},
 
	clearTermsForKey : function(aTable, aKey, aDecomposedKey)
	{
		try {
			var statement = this.createStatement(
					aKey ?
						'DELETE FROM '+aTable+' WHERE key = ?1' :
						'DELETE FROM '+aTable+' WHERE decomposed_key = ?1'
				);
			statement.bindStringParameter(0, aKey);
			try {
				while(statement.executeStep()) {}
			}
			catch(e) {
			}
			finally {
				statement.reset();
			}
		}
		catch(e) {
		}
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Ci.pIXMigemoDatabase) &&
			!aIID.equals(Ci.nsISupports))
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
		aComponentManager = aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Ci.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		manager : {
			CID        : pXMigemoDatabase.prototype.classID,
			contractID : pXMigemoDatabase.prototype.contractID,
			className  : pXMigemoDatabase.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoDatabase()).QueryInterface(aIID);
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
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 80 ? aString.substring(0, 80) : aString )+'\n');
}
 
