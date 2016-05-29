var EXPORTED_SYMBOLS = ['MigemoDicManager'];

/* This depends on: 
	MigemoDictionary
	MigemoCache
*/
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

Cu.import('resource://xulmigemo-modules/lib/prefs.js');
 
Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/core/core.js');
Cu.import('resource://xulmigemo-modules/core/cache.js');
Cu.import('resource://xulmigemo-modules/core/fileAccess.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('dicManager', ...aArgs); }
 	
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
					case MigemoConstants.BASE+'dicpath':
					case MigemoConstants.BASE+'dicpath-relative':
						if (this.autoReloadDisabled) return;
						this.reload();
						break;

					case MigemoConstants.BASE+'ignoreHiraKata':
					case MigemoConstants.BASE+'splitTermsAutomatically':
						this.cache.clearAll();
						break;
				}
				return;

			case 'XMigemo:dictionaryModified':
				var test = aData.split('\n')[1].match(/(.+)\t(.+)\t(.*)/);
				var operation = RegExp.$1;
				var input = RegExp.$2;
				var term = RegExp.$3;

				var lang = prefs.getPref(MigemoConstants.BASE+'lang');
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
		var fullPath = MigemoFileAccess.getExistingPath(prefs.getPref(MigemoConstants.BASE+'dicpath'));
		var relPath = MigemoFileAccess.getExistingPath(prefs.getPref(MigemoConstants.BASE+'dicpath-relative'));
		if (relPath && (!fullPath || fullPath != relPath)) {
			this.autoReloadDisabled = true;
			prefs.setPref(MigemoConstants.BASE+'dicpath', relPath);
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
			var lang = prefs.getPref(MigemoConstants.BASE+'lang') || '';

			var leafNameSuffix = '';
			var moduleNameSuffix = '';
			if (lang.indexOf('en') !== 0) {
				leafNameSuffix = '.' + lang;
				moduleNameSuffix = lang.charAt(0).toUpperCase() + lang.slice(1);
			}

			var ns = Components.utils.import('resource://xulmigemo-modules/core/dictionary' + leafNameSuffix + '.js', {});
			this._dictionary = ns['MigemoDictionary' + moduleNameSuffix];
			if (!this._dictionary.lang)
				this._dictionary.lang = lang;
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
			var lang = prefs.getPref(MigemoConstants.BASE+'lang');
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
			Services.wm.getMostRecentWindow(null),
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
		var existing = Services.wm.getMostRecentWindow('xulmigemo:initializer');
		if (existing) {
			existing.focus();
			return;
		}

		Services.ww.openWindow(
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
			var pbi = Services.prefs.QueryInterface(Ci.nsIPrefBranchInternal);
			pbi.addObserver(this.domain, this, false);
		}
		catch(e) {
		}

		Services.obs.addObserver(this, 'quit-application', false);
		Services.obs.addObserver(this, 'XMigemo:dictionaryModified', false);

		if (
			this.dicpath &&
			this.dictionary.load() &&
			this.cache.load()
			) {
			var relPath = prefs.getPref(MigemoConstants.BASE+'dicpath-relative');
			if (!relPath) {
				relPath = this.dicpath;
				relPath = MigemoFileAccess.getRelativePath(relPath);
				if (relPath && relPath != this.dicpath) {
					this.autoReloadDisabled = true;
					prefs.setPref(MigemoConstants.BASE+'dicpath-relative', unescape(encodeURIComponent(relPath)));
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
			var pbi = Services.prefs.QueryInterface(Ci.nsIPrefBranchInternal);
			pbi.removeObserver(this.domain, this, false);
		}
		catch(e) {
		}

		Services.obs.removeObserver(this, 'quit-application');
		Services.obs.removeObserver(this, 'XMigemo:dictionaryModified');
	},
 
	get strbundle() 
	{
		delete this.strbundle;
		let { stringBundle } = Components.utils.import('resource://xulmigemo-modules/lib/stringBundle.js', {});
		return this.strbundle = stringBundle.get('chrome://xulmigemo/locale/xulmigemo.properties');
	}
 
}; 
 
