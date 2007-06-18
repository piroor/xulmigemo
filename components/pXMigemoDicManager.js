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
	this.init();
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
						this.reload();
						break;

					case 'xulmigemo.ignoreHiraKata':
					case 'xulmigemo.splitTermsAutomatically':
						var XMigemoCache = Components
								.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
								.getService(Components.interfaces.pIXMigemoCache);
						XMigemoCache.clearAll();
						break;
				}
				return;

			case 'XMigemo:dictionaryModified':
				var test = aData.split('\n')[1].match(/(.+)\t(.+)\t(.*)/);
				var operation = RegExp.$1;
				var yomi = RegExp.$2;
				var term = RegExp.$3;

				const XMigemo = Components
					.classes['@piro.sakura.ne.jp/xmigemo/core;1?lang='+Prefs.getCharPref('xulmigemo.lang')]
					.getService(Components.interfaces.pIXMigemo);

				var XMigemoCache = Components
						.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
						.getService(Components.interfaces.pIXMigemoCache);
				XMigemoCache.clearCacheForAllPatterns(XMigemo.textTransform.normalizeKeyInput(yomi));
				return;

				return;

			case 'quit-application':
				this.destroy();
				return;
		}
	},
 
	reload : function() 
	{
		var XMigemoDic = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+Prefs.getCharPref('xulmigemo.lang')]
				.getService(Components.interfaces.pIXMigemoDictionary);
		XMigemoDic.load();

		var XMigemoCache = Components
				.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
				.getService(Components.interfaces.pIXMigemoCache);
		XMigemoCache.reload();
	},
 
	showDirectoryPicker : function(aDefault) 
	{
		var filePicker = Components
				.classes['@mozilla.org/filepicker;1']
				.createInstance(Components.interfaces.nsIFilePicker);

		var current = aDefault || decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath')));
		var displayDirectory = Components.classes['@mozilla.org/file/local;1'].createInstance();
		if (displayDirectory  instanceof Components.interfaces.nsILocalFile) {
			try {
				displayDirectory .initWithPath(current);
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
 	
	init : function() 
	{
		var XMigemoDic = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+Prefs.getCharPref('xulmigemo.lang')]
				.getService(Components.interfaces.pIXMigemoDictionary);
		var XMigemoCache = Components
				.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
				.getService(Components.interfaces.pIXMigemoCache);

		if (
			this.initialized ||
			(XMigemoDic.initialized && XMigemoCache.initialized)
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

		this.strbundle = new XMigemoStringBundle('chrome://xulmigemo/locale/xulmigemo.properties');

		ObserverService.addObserver(this, 'quit-application', false);
		ObserverService.addObserver(this, 'XMigemo:dictionaryModified', false);

		if (
			(
				!decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath'))) ||
				!XMigemoDic.load() ||
				!XMigemoCache.load()
			) &&
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
			this._stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
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
		dump((aString.length > 20 ? aString.substring(0, 20) : aString )+'\n');
}
 
