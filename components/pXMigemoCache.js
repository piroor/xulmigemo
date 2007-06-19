/* This depends on: 
	pIXMigemoFileAccess
	pIXMigemoTextUtils
*/
var DEBUG = true;
 
var ObserverService = Components 
			.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);;

var Prefs = Components
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
function pXMigemoCache() { 
	mydump('create instance pIXMigemoCache');
}

pXMigemoCache.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/cache;1';
	},
	get classDescription() {
		return 'This is a cache service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{0c6119e4-cef4-11db-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	initialized : false, 
 
	memCache       : '', 
	diskCacheClone : '',
 
	getCacheFor : function (aRoman) 
	{
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		var miexp = new RegExp('(^'+XMigemoTextUtils.sanitize(aRoman)+'\t.+\n)', 'im');
		if (this.memCache.match(miexp)) {
			mydump('use memCache');
			return RegExp.$1.split('\t')[1];
		}
		else if (this.diskCacheClone.match(miexp)) {
			mydump('use diskCacheClone');
			return RegExp.$1.split('\t')[1];
		}
		return '';
	},
 
	clearCacheForAllPatterns : function (aRoman) 
	{
		var patterns = [];
		for (var i = aRoman.length-1; i > 0; i--)
		{
			var key = aRoman.substring(0, i);
			patterns.push(key);
			this.clearCacheSilentlyFor(key);
		}
		this.save();
		ObserverService.notifyObservers(null, 'XMigemo:cacheCleared', patterns.join('\n'));
	},
 
	clearCacheFor : function (aRoman) 
	{
		this.clearCacheSilentlyFor(aRoman);

		this.save();
		ObserverService.notifyObservers(null, 'XMigemo:cacheCleared', aRoman);
	},
 
	clearCacheSilentlyFor : function (aRoman) 
	{
		var miexp = new RegExp('(^'+aRoman+'\t.+\n)', 'im');
		this.memCache = this.memCache.replace(miexp, '');
		if (RegExp.$1) mydump('update memCache for "'+aRoman+'"');
		this.diskCacheClone = this.diskCacheClone.replace(miexp, '');
		if (RegExp.$1) mydump('update diskCache for "'+aRoman+'"');
	},
 
	clearAll : function(aDisk) 
	{
		this.memCache = '';
		if (aDisk)
			this.diskCacheClone = '';
	},
 
	setMemCache : function(aRoman, aRegExp) 
	{
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		var tmpexp = new RegExp('(^'+XMigemoTextUtils.sanitize(aRoman)+'\t.+\n)', 'im');
		if (this.memCache.match(tmpexp)) {
			return;
		}
		else {
			this.memCache += aRoman + '\t' + aRegExp + '\n';
			//mydump(this.memCache);

			ObserverService.notifyObservers(null, 'XMigemo:memCacheAdded', aRoman+'\n'+aRegExp);

			return;
		}
	},
 
	setDiskCache : function (aRoman, aMyRegExp) { 
		var file = this.cacheFile;
		if (!file) return;

		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		var newCache = this.diskCacheClone;
		var tmpexp = new RegExp('(^' + XMigemoTextUtils.sanitize(aRoman) + '\t.+\n)', 'im');
		newCache = [newCache.replace(tmpexp, ''), aRoman, '\t', aMyRegExp, '\n'].join('');

		var util = Components
					.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
					.getService(Components.interfaces.pIXMigemoFileAccess);
		var oldCache = util.readFrom(file, 'Shift_JIS');

		if (newCache != oldCache) {
			this.save();
		}
	},
 
/* File I/O */ 
	
	get cacheFile() 
	{
		if (!this.cacheFileHolder) {
			var dir = this.cacheDir;

			var lang = Prefs.getCharPref('xulmigemo.lang');
			var override;
			try {
				override = Prefs.getCharPref('xulmigemo.cache.override.'+lang);
			}
			catch(e) {
			}

			try {
				this.cacheFileHolder = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
				this.cacheFileHolder.initWithPath(dir.path);
				this.cacheFileHolder.append(override || lang+'.cache.txt');
			}
			catch(e) {
				this.cacheFileHolder = null;
			}
		}
		return this.cacheFileHolder;
	},
	set cacheFile(val)
	{
		this.cacheFileHolder = val;
		return this.cacheFile;
	},
	cacheFileHolder : null,

	get cacheDir() 
	{
		if (!this.cacheDirHolder) {
			var util = Components
					.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
					.getService(Components.interfaces.pIXMigemoFileAccess);
			var dicDir = util.getAbsolutePath(decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath'))));

			try {
				this.cacheDirHolder = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
				this.cacheDirHolder.initWithPath(dicDir);
			}
			catch(e) {
				this.cacheDirHolder = null;
			}
		}
		return this.cacheDirHolder;
	},
	set cacheDir(val)
	{
		this.cacheDirHolder = val;
		return this.cacheDir;
	},
	cacheDirHolder : null,
 
	load : function() 
	{
		var util = Components
					.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
					.getService(Components.interfaces.pIXMigemoFileAccess);

		var file = this.cacheFile;
		if (!file || !file.exists()) {
//			return false;
			util.writeTo(file, '', 'Shift_JIS');
			this.initialized = true;
			return true;
		}

		this.diskCacheClone = util.readFrom(file, 'Shift_JIS');

		mydump('pIXMigemoCache: loaded');
		this.initialized = true;
		return true;
	},
 
	reload : function() 
	{
		this.cacheFileHolder = null;
		this.load();
	},
 
	save : function () { 
		var file = this.cacheFile;
		if (!file) return;

		var util = Components
					.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
					.getService(Components.interfaces.pIXMigemoFileAccess);

		var cache = util.readFrom(file, 'Shift_JIS');
		if (cache != this.diskCacheClone)
			util.writeTo(file, this.diskCacheClone, 'Shift_JIS');
	},
  
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoCache) &&
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
			CID        : pXMigemoCache.prototype.classID,
			contractID : pXMigemoCache.prototype.contractID,
			className  : pXMigemoCache.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoCache()).QueryInterface(aIID);
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
 
