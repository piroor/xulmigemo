/* This depends on: 
	xmIXMigemoDictionary
	xmIXMigemoCache
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm'); 

var namespace = {};

var ObserverService = Cc['@mozilla.org/observer-service;1']
		.getService(Ci.nsIObserverService);;

var Prefs = Cc['@mozilla.org/preferences;1']
		.getService(Ci.nsIPrefBranch);

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);
 	
function xmXMigemoDicManager() { 
	mydump('create instance xmIXMigemoDicManager');
}

xmXMigemoDicManager.prototype = {
	classDescription : 'xmXMigemoDicManager',
	contractID : '@piro.sakura.ne.jp/xmigemo/dictionary-manager;1',
	classID : Components.ID('{25e5efa2-cef4-11db-8314-0800200c9a66}'),

	QueryInterface : XPCOMUtils.generateQI([
		Ci.xmIXMigemoDicManager,
		Ci.pIXMigemoDicManager
	]),

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

				var lang = Prefs.getCharPref('xulmigemo.lang')
				var core;
				if (TEST && xmXMigemoCore) {
					core = new xmXMigemoCore();
					core.init(lang);
				}
				else {
					core = Cc['@piro.sakura.ne.jp/xmigemo/factory;1']
						.getService(Ci.xmIXMigemoFactory)
						.getService(lang);
				}
				this.cache.clearCacheForAllPatterns(core.textTransform.normalizeKeyInput(input));
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
			if (TEST && xmXMigemoFileAccess) {
				this._fileUtils = new xmXMigemoFileAccess();
			}
			else {
				this._fileUtils = Cc['@piro.sakura.ne.jp/xmigemo/file-access;1']
						.getService(Ci.xmIXMigemoFileAccess);
			}
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
			var lang = Prefs.getCharPref('xulmigemo.lang');
			var constructor;
			if (TEST) {
				eval('constructor = xmXMigemoDictionary'+
						lang.replace(/^./, function(aChar) {
							return aChar.toUpperCase();
						})
				);
			}
			if (constructor) {
				this._dictionary = new constructor();
			}
			else {
				var id = '@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+lang;
				if (id in Cc) {
					this._dictionary = Cc[id]
						.getService(Ci.xmIXMigemoDictionary);
				}
				else {
					this._dictionary = Cc['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang=*']
						.createInstance(Ci.xmIXMigemoDictionary)
						.QueryInterface(Ci.xmIXMigemoDictionaryUniversal);
					this._dictionary.lang = Prefs.getCharPref('xulmigemo.lang');
				}
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
			if (TEST && xmXMigemoCache) {
				this._cache = new xmXMigemoCache();
			}
			else {
				this._cache = Cc['@piro.sakura.ne.jp/xmigemo/cache;1']
					.getService(Ci.xmIXMigemoCache);
			}
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
		var filePicker = Cc['@mozilla.org/filepicker;1']
				.createInstance(Ci.nsIFilePicker);

		var current = aDefault || this.dicpath;
		var displayDirectory = Cc['@mozilla.org/file/local;1'].createInstance();
		if (displayDirectory instanceof Ci.nsILocalFile) {
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
			var pbi = Prefs.QueryInterface(Ci.nsIPrefBranchInternal);
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
				var WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
					.getService(Ci.nsIWindowWatcher);
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
			var pbi = Prefs.QueryInterface(Ci.nsIPrefBranchInternal);
			pbi.removeObserver(this.domain, this, false);
		}
		catch(e) {
		}

		ObserverService.removeObserver(this, 'quit-application');
		ObserverService.removeObserver(this, 'XMigemo:dictionaryModified');
	},
 
	get strbundle() 
	{
		if (!('getNamespaceFor' in namespace)) {
			Components.utils.import('resource://xulmigemo-modules/stringBundle.js');
			Components.utils.import('resource://xulmigemo-modules/namespace.jsm', namespace);
			window = namespace.getNamespaceFor('piro.sakura.ne.jp');
		}

		return window['piro.sakura.ne.jp'].stringBundle
				.get('chrome://xulmigemo/locale/xulmigemo.properties');
	}
 
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([xmXMigemoDicManager]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([xmXMigemoDicManager]);
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 80 ? aString.substring(0, 80) : aString )+'\n');
}
 
