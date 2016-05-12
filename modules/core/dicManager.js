var EXPORTED_SYMBOLS = ['MigemoDicManager'];

/* This depends on: 
	xmIXMigemoDictionary
	xmIXMigemoCache
*/
var DEBUG = false;
var TEST = false;
const Cc = Components.classes;
const Ci = Components.interfaces;
 
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm'); 
Components.utils.import('resource://xulmigemo-modules/core/core.js');
Components.utils.import('resource://xulmigemo-modules/core/fileAccess.js');

var namespace = {};

const ObserverService = Cc['@mozilla.org/observer-service;1']
		.getService(Ci.nsIObserverService);;

const Prefs = Cc['@mozilla.org/preferences;1']
		.getService(Ci.nsIPrefBranch);

const WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);
 	
var MigemoDicManager = {
	available : false,

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

				var lang = Prefs.getCharPref('xulmigemo.lang');
				var core = MigemoCoreFactory.get(lang);
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
		var fullPath = MigemoFileAccess.getExistingPath(
				decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath')))
			);
		var relPath = MigemoFileAccess.getExistingPath(
				decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath-relative')))
			);
		if (relPath && (!fullPath || fullPath != relPath)) {
			this.autoReloadDisabled = true;
			Prefs.setCharPref('xulmigemo.dicpath', unescape(encodeURIComponent(relPath)));
			this.autoReloadDisabled = false;
		}

		return fullPath || relPath;
	},

	set dictionary(val) 
	{
		this._dictionary = val;
		return this.dictionary;
	},
	get dictionary()
	{
		if (!this._dictionary) { // default dictionary; can be overridden.
			var lang = Prefs.getCharPref('xulmigemo.lang');

			var leafNameSuffix = '';
			var moduleNameSuffix = '';
			if (lang) {
				leafNameSuffix = '.' + lang;
				moduleNameSuffix = lang.charAt(0).toUpperCase() + this.lang.slice(1);
			}

			var ns = Components.utils.import('resource://xulmigemo-modules/core/dictionary' + leafNameSuffix + '.js', {});
			this._dictionary = ns['MigemoDictionary' + moduleNameSuffix];
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
			var lang = Prefs.getCharPref('xulmigemo.lang');
			this._cache = MigemoCacheFactory.get(lang);
		}
		return this._cache;
	},
	_cache : null,
 
	reload : function() 
	{
		this.available = this.dictionary.load() && this.cache.load();
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

		function findExistingFolder(aFile) {
			// Windows's file picker sometimes returns wrong path like
			// "c:\folder\folder" even if I actually selected "c:\folder".
			// However, when the "OK" button is chosen, any existing folder
			// must be selected. So, I find existing ancestor folder from
			// the path.
			while (aFile && !aFile.exists() && aFile.parent)
			{
				aFile = aFile.parent;
			}
			return aFile;
		}

		if (typeof filePicker.open != 'function') { // Firefox 18 and olders
			let folder = (filePicker.show() == filePicker.returnOK) ?
							filePicker.file.QueryInterface(Components.interfaces.nsILocalFile) : null ;
			folder = findExistingFolder(folder);
			return folder ? folder.path : '' ;
		}

		var folder;
		filePicker.open({ done: function(aResult) {
			if (aResult == filePicker.returnOK) {
				folder = filePicker.file.QueryInterface(Components.interfaces.nsILocalFile);
			}
			else {
				folder = null;
			}
		}});

		// this must be rewritten in asynchronous style.
		// this is required just for backward compatibility.
		var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
		while (folder === undefined)
		{
			thread.processNextEvent(true);
		}

		folder = findExistingFolder(folder);
		return folder ? folder.path : '' ;
	},
 
	showInitializeWizard : function(aOwner) 
	{
		var existing = WindowManager.getMostRecentWindow('xulmigemo:initializer');
		if (existing) {
			existing.focus();
			return;
		}

		var WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
			.getService(Ci.nsIWindowWatcher);
		WindowWatcher.openWindow(
			aOwner,
			'chrome://xulmigemo/content/initializer/initializer.xul',
			'xulmigemo:initializer',
			'chrome,dialog,modal,centerscreen,dependent',
			null
		);
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
			this.dicpath &&
			this.dictionary.load() &&
			this.cache.load()
			) {
			var relPath = Prefs.getCharPref('xulmigemo.dicpath-relative');
			if (!relPath) {
				relPath = this.dicpath;
				relPath = MigemoFileAccess.getRelativePath(relPath);
				if (relPath && relPath != this.dicpath) {
					this.autoReloadDisabled = true;
					Prefs.setCharPref('xulmigemo.dicpath-relative', unescape(encodeURIComponent(relPath)));
					this.autoReloadDisabled = false;
				}
			}
			this.available = true;
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
			Components.utils.import('resource://xulmigemo-modules/lib/stringBundle.js');
			Components.utils.import('resource://xulmigemo-modules/lib/namespace.jsm', namespace);
			window = namespace.getNamespaceFor('piro.sakura.ne.jp');
		}

		return window['piro.sakura.ne.jp'].stringBundle
				.get('chrome://xulmigemo/locale/xulmigemo.properties');
	}
 
}; 
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 80 ? aString.substring(0, 80) : aString )+'\n');
}
 
