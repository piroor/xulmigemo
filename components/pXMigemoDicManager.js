/* This depends on: 
	pIXMigemoDictionary
	pIXMigemoCache
*/
var DEBUG = false;
 
var ObserverService = Components 
		.classes['@mozilla.org/observer-service;1']
		.getService(Components.interfaces.nsIObserverService);;

var Prefs = Components
		.classes['@mozilla.org/preferences;1']
		.getService(Components.interfaces.nsIPrefBranch);

var WindowManager = Components
		.classes['@mozilla.org/appshell/window-mediator;1']
		.getService(Components.interfaces.nsIWindowMediator);
 
function pXMigemoDicManager() { 
	mydump('create instance pIXMigemoDicManager');
}

pXMigemoDicManager.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/dictionary-manager;1';
	},
	get classDescription() {
		return 'This is a dictionary management service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{25e5efa2-cef4-11db-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	domain : 'xulmigemo', 
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'nsPref:changed':
				// nsIPrefListener(?)
				switch (aData)
				{
					case 'xulmigemo.dicpath':
					case 'xulmigemo.dicpath-relative':
						if (this.autoReloadDisabled) return;
						this.reload();
						break;

					case 'xulmigemo.ignoreHiraKata':
					case 'xulmigemo.splitTermsAutomatically':
						this.cache.clearAll();
						break;
				}
				return;

			case 'XMigemo:dictionaryModified':
				var test = aData.split('\n')[1].match(/(.+)\t(.+)\t(.*)/);
				var operation = RegExp.$1;
				var input = RegExp.$2;
				var term = RegExp.$3;

				const XMigemo = Components
					.classes['@piro.sakura.ne.jp/xmigemo/core;1?lang='+Prefs.getCharPref('xulmigemo.lang')]
					.getService(Components.interfaces.pIXMigemo);

				this.cache.clearCacheForAllPatterns(XMigemo.textTransform.normalizeKeyInput(input));
				return;

				return;

			case 'quit-application':
				this.destroy();
				return;
		}
	},
	isUpdating : false,
 
	get dicpath() 
	{
		var fullPath = this.fileUtils.getExistingPath(
				decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath')))
			);
		var relPath = this.fileUtils.getExistingPath(
				decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath-relative')))
			);
		if (relPath && (!fullPath || fullPath != relPath)) {
			this.autoReloadDisabled = true;
			Prefs.setCharPref('xulmigemo.dicpath', unescape(encodeURIComponent(relPath)));
			this.autoReloadDisabled = false;
		}

		return fullPath || relPath;
	},
	 
	get fileUtils() 
	{
		if (!this._fileUtils) {
			this._fileUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
				.getService(Components.interfaces.pIXMigemoFileAccess);
		}
		return this._fileUtils;
	},
	_fileUtils : null,
  	
	set dictionary(val) 
	{
		this._dictionary = val;
		return this.dictionary;
	},
	get dictionary()
	{
		if (!this._dictionary) { // default dictionary; can be overridden.
			var id = '@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+Prefs.getCharPref('xulmigemo.lang');
			if (id in Components.classes) {
				this._dictionary = Components
					.classes[id]
					.getService(Components.interfaces.pIXMigemoDictionary);
			}
			else {
				this._dictionary = Components
					.classes['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang=*']
					.createInstance(Components.interfaces.pIXMigemoDictionary)
					.QueryInterface(Components.interfaces.pIXMigemoDictionaryUniversal);
				this._dictionary.lang = Prefs.getCharPref('xulmigemo.lang');
			}
		}
		return this._dictionary;
	},
	_dictionary : null,
 
	set cache(val) 
	{
		this._cache = val;
		return this.cache;
	},
	get cache()
	{
		if (!this._cache) { // default cache; can be overridden.
			this._cache = Components
				.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
				.getService(Components.interfaces.pIXMigemoCache);
		}
		return this._cache;
	},
	_cache : null,
 
	reload : function() 
	{
		this.dictionary.load();
		this.cache.reload();
	},
 
	showDirectoryPicker : function(aDefault) 
	{
		var filePicker = Components
				.classes['@mozilla.org/filepicker;1']
				.createInstance(Components.interfaces.nsIFilePicker);

		var current = aDefault || this.dicpath;
		var displayDirectory = Components.classes['@mozilla.org/file/local;1'].createInstance();
		if (displayDirectory instanceof Components.interfaces.nsILocalFile) {
			try {
				displayDirectory.initWithPath(current);
				filePicker.displayDirectory = displayDirectory;
			}
			catch(e) {
			}
		}

		filePicker.init(
			WindowManager.getMostRecentWindow(null),
			this.strbundle.getString('dic.picker.title'),
			filePicker.modeGetFolder
		);

		if (filePicker.show() != filePicker.returnCancel) {
			return filePicker.file.path;
		}
		return '';
	},
 
	init : function(aDictionary, aCache) 
	{
		if (aDictionary) this.dictionary = aDictionary;
		if (aCache)      this.cache      = aCache;

		if (
			this.initialized ||
			(this.dictionary.initialized && this.cache.initialized)
			) {
			this.initialized = true;
			return;
		}

		try {
			var pbi = Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			pbi.addObserver(this.domain, this, false);
		}
		catch(e) {
		}

		ObserverService.addObserver(this, 'quit-application', false);
		ObserverService.addObserver(this, 'XMigemo:dictionaryModified', false);

		if (
			!this.dicpath ||
			!this.dictionary.load() ||
			!this.cache.load()
			) {
			if (
				Prefs.getBoolPref('xulmigemo.dictionary.useInitializeWizard') &&
				!WindowManager.getMostRecentWindow('xulmigemo:initializer')
				) {
				var WindowWatcher = Components
					.classes['@mozilla.org/embedcomp/window-watcher;1']
					.getService(Components.interfaces.nsIWindowWatcher);
				WindowWatcher.openWindow(
					null,
					'chrome://xulmigemo/content/initializer/initializer.xul',
					'xulmigemo:initializer',
					'chrome,dialog,modal,centerscreen,dependent',
					null
				);
			}
		}
		else {
			var relPath = Prefs.getCharPref('xulmigemo.dicpath-relative');
			if (!relPath) {
				relPath = this.dicpath;
				relPath = this.fileUtils.getRelativePath(relPath);
				if (relPath && relPath != this.dicpath) {
					this.autoReloadDisabled = true;
					Prefs.setCharPref('xulmigemo.dicpath-relative', unescape(encodeURIComponent(relPath)));
					this.autoReloadDisabled = false;
				}
			}
		}

		this.initialized = true;
	},
 
	destroy : function() 
	{
		try {
			var pbi = Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			pbi.removeObserver(this.domain, this, false);
		}
		catch(e) {
		}

		ObserverService.removeObserver(this, 'quit-application');
		ObserverService.removeObserver(this, 'XMigemo:dictionaryModified');
	},
 
	get strbundle() 
	{
		if (!this._strbundle)
			this._strbundle = new XMigemoStringBundle('chrome://xulmigemo/locale/xulmigemo.properties');
		return this._strbundle;
	},
	_strbundle : null,
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoDicManager) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
function XMigemoStringBundle(aStringBundle) 
{
	this.strbundle = this.stringBundleService.createBundle(aStringBundle);
}
XMigemoStringBundle.prototype = {
	get stringBundleService()
	{
		if (!this._stringBundleService) {
			this._stringBundleService = Components
				.classes['@mozilla.org/intl/stringbundle;1']
				.getService(Components.interfaces.nsIStringBundleService);
		}
		return this._stringBundleService;
	},
	_stringBundleService : null,
	strbundle : null,
	getString : function(aKey) {
		try {
			return this.strbundle.GetStringFromName(aKey);
		}
		catch(e) {
			dump(e);
		}
		return '';
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
			CID        : pXMigemoDicManager.prototype.classID,
			contractID : pXMigemoDicManager.prototype.contractID,
			className  : pXMigemoDicManager.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoDicManager()).QueryInterface(aIID);
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
 
