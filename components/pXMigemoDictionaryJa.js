/* This depends on: 
	pIXMigemoDatabase
	pIXMigemoFileAccess
	pIXMigemoTextUtils
	pIXMigemoTextTransformJa
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
var ObserverService = Cc['@mozilla.org/observer-service;1'] 
			.getService(Ci.nsIObserverService);

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);

var pIXMigemoDictionary = Ci.pIXMigemoDictionary;
 
function pXMigemoDictionaryJa() { 
	mydump('create instance pIXMigemoDictionary(lang=ja)');
}

pXMigemoDictionaryJa.prototype = {
	lang : 'ja',

	kSYSTEM_DIC_TABLE : 'dictionary_ja',
	kUSER_DIC_TABLE   : 'user_dictionary_ja',

	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+this.lang;
	},
	get classDescription() {
		return 'This is a dictionary service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{20309e9a-cef4-11db-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	// pIXMigemoDictionary 
	 
	initialized : false, 
 
	get database() 
	{
		if (!this._database) {
			if (TEST && pXMigemoDatabase) {
				this._database = new pXMigemoDatabase();
			}
			else {
				this._database = Cc['@piro.sakura.ne.jp/xmigemo/database;1']
						.getService(Ci.pIXMigemoDatabase);
			}
		}
		return this._database;
	},
	_database : null,
 
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
 
	get textTransform() 
	{
		if (!this._textTransform) {
			if (TEST && pXMigemoTextTransformJa) {
				this._textTransform = new pXMigemoTextTransformJa();
			}
			else {
				this._textTransform = Cc['@piro.sakura.ne.jp/xmigemo/text-transform;1?lang='+this.lang]
					.getService(Ci.pIXMigemoTextTransform)
					.QueryInterface(Ci.pIXMigemoTextTransformJa);
			}
		}
		return this._textTransform;
	},
	_textTransform : null,
 
	get fileUtils() 
	{
		if (!this._fileUtils) {
			if (TEST && pXMigemoFileAccess) {
				this._fileUtils = new pXMigemoFileAccess();
			}
			else {
				this._fileUtils = Cc['@piro.sakura.ne.jp/xmigemo/file-access;1']
						.getService(Ci.pIXMigemoFileAccess);
			}
		}
		return this._fileUtils;
	},
	_fileUtils : null,
 
	RESULT_OK                      : pIXMigemoDictionary.RESULT_OK, 
	RESULT_ERROR_INVALID_INPUT     : pIXMigemoDictionary.RESULT_ERROR_INVALID_INPUT,
	RESULT_ERROR_ALREADY_EXIST     : pIXMigemoDictionary.RESULT_ERROR_ALREADY_EXIST,
	RESULT_ERROR_NOT_EXIST         : pIXMigemoDictionary.RESULT_ERROR_NOT_EXIST,
	RESULT_ERROR_NO_TARGET         : pIXMigemoDictionary.RESULT_ERROR_NO_TARGET,
	RESULT_ERROR_INVALID_OPERATION : pIXMigemoDictionary.RESULT_ERROR_INVALID_OPERATION,
 
/* File I/O */ 
	 
	get dicpath() 
	{
		var fullPath = this.fileUtils.getExistingPath(
				decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath')))
			);
		var relPath = this.fileUtils.getExistingPath(
				decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath-relative')))
			);
		if (relPath && (!fullPath || fullPath != relPath))
			Prefs.setCharPref('xulmigemo.dicpath', unescape(encodeURIComponent(relPath)));

		return fullPath || relPath;
	},
 
	load : function() 
	{
		if (
			this.database.tableExists(this.kSYSTEM_DIC_TABLE) &&
			this.database.tableExists(this.kUSER_DIC_TABLE)
			) {
			this.initialized = true;
			return true;
		}

		// migration

		var dicDir = this.dicpath;
		var error = false;
		var SQLStatements = [];

		//consonant(英語:"子音")
		this.cList.forEach(function(aConstant) {
			var file;

			if (dicDir) {
				file = Cc['@mozilla.org/file/local;1']
					.createInstance(Ci.nsILocalFile);
				file.initWithPath(dicDir);
				file.append(aConstant + 'a2.txt');
			}
			if (file && file.exists()) {
				this.database.initTermsTable(this.kSYSTEM_DIC_TABLE);
				SQLStatements.push(
					this.textUtils.trim(this.fileUtils.readFrom(file, 'Shift_JIS'))
						.replace(/'/g, "''")
						.replace(/^([^\t]+)\t/gm, "INSERT OR REPLACE INTO "+this.kSYSTEM_DIC_TABLE+" (key, terms) VALUES('$1', '")
						.replace(/(.)$/gm, "$1');")
				);
			}
			else {
				error = true;
			}

			// ユーザー辞書
			if (dicDir) {
				file = Cc["@mozilla.org/file/local;1"]
					.createInstance(Ci.nsILocalFile);
				file.initWithPath(dicDir);
				file.append(aConstant + 'a2.user.txt');
			}
			if (file && file.exists()) {
				this.database.initTermsTable(this.kUSER_DIC_TABLE);
				SQLStatements.push(
					this.textUtils.trim(this.fileUtils.readFrom(file, 'Shift_JIS'))
						.replace(/'/g, "''")
						.replace(/^([^\t]+)\t/gm, "INSERT OR REPLACE INTO "+this.kUSER_DIC_TABLE+" (key, terms) VALUES('$1', '")
						.replace(/(.)$/gm, "$1');")
				);
			}
		}, this);

		if (error) {
			this.database.dropTable(systemTable);
			this.database.dropTable(userTable);
		}
		else {
			var connection = this.database.DBConnection
								.QueryInterface(Ci.mozIStorageConnection);
			if (connection.transactionInProgress)
				connection.commitTransaction();
			if (!connection.transactionInProgress)
				connection.beginTransaction();
			connection.executeSimpleSQL(SQLStatements.join('\n'));
			if (connection.transactionInProgress)
				connection.commitTransaction();
		}

		this.initialized = true;
		mydump('pIXMigemoDictionary: loaded');

		return !error;
	},
	cList : ['', 'k', 's', 't', 'h', 'm', 'n', 'y', 'r', 'w', 'd', 'z', 'g', 'p', 'b', 'alph'],
  
	addTerm : function(aInput, aTerm) 
	{
		if (!aInput || !this.textTransform.isYomi(aInput))
			return this.RESULT_ERROR_INVALID_INPUT;

		aTerm = this.textUtils.trim(aTerm);
		if (!aTerm)
			return this.RESULT_ERROR_NO_TARGET;

		aInput = this.textTransform.normalizeForYomi(aInput);

		var table = this.kSYSTEM_DIC_TABLE;
		var terms = this.database.getTermsForKey(table, aInput);
		if (terms.indexOf(aTerm) > -1)
			return this.RESULT_ERROR_ALREADY_EXIST;

		table = this.kUSER_DIC_TABLE;
		terms = this.database.getTermsForKey(table, aInput);
		if (terms.indexOf(aTerm) > -1)
			return this.RESULT_ERROR_ALREADY_EXIST;

		terms.push(aTerm);
		this.database.setTermsForKey(table, aInput, terms);

		var entry = aInput+'\t'+terms.join('\t');
		mydump('XMigemo:dictionaryModified(add) '+entry);
		ObserverService.notifyObservers(this, 'XMigemo:dictionaryModified',
			[
				'add\t' + aInput + '\t' + aTerm,
				entry
			].join('\n'));

		return this.RESULT_OK;
	},
 
	removeTerm : function(aInput, aTerm) 
	{
		if (!aInput || !this.textTransform.isYomi(aInput))
			return this.RESULT_ERROR_INVALID_INPUT;

		if (aTerm) aTerm = this.textUtils.trim(aTerm);

		aInput = this.textTransform.normalizeForYomi(aInput);

		var table = this.kUSER_DIC_TABLE;
		var terms = this.database.getTermsForKey(table, aInput);
		if (!terms.length)
			return this.RESULT_ERROR_NOT_EXIST;

		if (aTerm) {
			var index = terms.indexOf(aTerm);
			if (index > -1) {
				terms = terms.splice(index, 1);
			}
			else {
				return this.RESULT_ERROR_NOT_EXIST;
			}
			this.database.setTermsForKey(table, aInput, terms);
		}
		else {
			terms = [];
			this.database.clearTermsForKey(table, aInput);
		}

		var entry = aInput+'\t'+terms.join('\t');
		mydump('XMigemo:dictionaryModified(remove) '+entry);
		ObserverService.notifyObservers(this, 'XMigemo:dictionaryModified',
			[
				'remove\t' + aInput + '\t' + (aTerm || ''),
				entry
			].join('\n'));

		return this.RESULT_OK;
	},
 
	_getEntriesFor : function(aTable, aKeyPattern) 
	{
		var allKeysStatement = this.database.createStatement(
				'SELECT GROUP_CONCAT(key, ?1)'+
				'  FROM (SELECT key FROM '+aTable+')'
			);
		allKeysStatement.bindStringParameter(0, '\n');
		var allKeys = '';
		try {
			while(allKeysStatement.executeStep())
			{
				allKeys = allKeysStatement.getString(0);
			}
		}
		finally {
			allKeysStatement.reset();
		}

		var keys = allKeys.match(new RegExp('^'+aKeyPattern, 'mg'));
		if (!keys) return [];

		var statement = this.database.createStatement(
				'SELECT GROUP_CONCAT(key || ?1 || terms, ?2)'+
				'  FROM (SELECT key, terms'+
				'          FROM '+aTable+
				'         WHERE '+keys.map(function(aKey, aIndex) {
				                    return 'key LIKE ?'+(aIndex+3);
				                  }).join(' OR ')+
				'         ORDER BY key DESC)'
			);
		statement.bindStringParameter(0, '\t');
		statement.bindStringParameter(1, '\n');
		keys.forEach(function(aKey, aIndex) {
			statement.bindStringParameter(aIndex+2, aKey+'%');
		}, this);
		var entries = '';
		try {
			while(statement.executeStep())
			{
				entries = statement.getString(0);
			}
		}
		finally {
			statement.reset();
		}
		return entries.split('\n');
	},
 
	getEntriesFor : function(aKeyPattern) 
	{
		return this._getEntriesFor(this.kSYSTEM_DIC_TABLE, aKeyPattern);
	},
 
	getUserEntriesFor : function(aKeyPattern) 
	{
		return this._getEntriesFor(this.kUSER_DIC_TABLE, aKeyPattern);
	},
  
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(pIXMigemoDictionary) &&
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
			CID        : pXMigemoDictionaryJa.prototype.classID,
			contractID : pXMigemoDictionaryJa.prototype.contractID,
			className  : pXMigemoDictionaryJa.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoDictionaryJa()).QueryInterface(aIID);
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
 
