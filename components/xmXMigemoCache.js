/* This depends on: 
	xmIXMigemoFileAccess
	xmIXMigemoTextUtils
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
var ObserverService = Cc['@mozilla.org/observer-service;1'] 
			.getService(Ci.nsIObserverService);

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);
 
function xmXMigemoCache() { 
	mydump('create instance xmIXMigemoCache');
}

xmXMigemoCache.prototype = {
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
 
	get textUtils() 
	{
		if (!this._textUtils) {
			if (TEST && xmXMigemoTextUtils) {
				this._textUtils = new xmXMigemoTextUtils();
			}
			else {
				this._textUtils = Cc['@piro.sakura.ne.jp/xmigemo/text-utility;1']
						.getService(Ci.xmIXMigemoTextUtils);
			}
		}
		return this._textUtils;
	},
	_textUtils : null,
 
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
 	
	memCache       : '', 
	diskCacheClone : '',
 
	getCacheFor : function (aRoman, aTargetDic) 
	{
		var miexp = new RegExp('(^'+this.textUtils.sanitize(aRoman)+'\t.+\n)', 'im');
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
 
	clearCacheForAllPatterns : function (aRoman, aTargetDic) 
	{
		var patterns = [];
		for (var i = aRoman.length-1; i > 0; i--)
		{
			var key = aRoman.substring(0, i);
			patterns.push(key);
			this.clearCacheSilentlyFor(key, aTargetDic);
		}
		this.save();
		ObserverService.notifyObservers(null, 'XMigemo:cacheCleared', patterns.join('\n'));
	},
 
	clearCacheFor : function (aRoman, aTargetDic) 
	{
		this.clearCacheSilentlyFor(aRoman, aTargetDic);

		this.save();
		ObserverService.notifyObservers(null, 'XMigemo:cacheCleared', aRoman);
	},
 
	clearCacheSilentlyFor : function (aRoman, aTargetDic) 
	{
		var miexp = new RegExp('(^'+aRoman+'\t.+\n)', 'im');
		this.memCache = this.memCache.replace(miexp, '');
		if (RegExp.$1) mydump('update memCache for "'+aRoman+'"');
		this.diskCacheClone = this.diskCacheClone.replace(miexp, '');
		if (RegExp.$1) mydump('update diskCache for "'+aRoman+'"');
	},
 
	clearAll : function(aDisk, aTargetDic) 
	{
		this.memCache = '';
		if (aDisk)
			this.diskCacheClone = '';
	},
 
	setMemCache : function(aRoman, aRegExp, aTargetDic) 
	{
		var tmpexp = new RegExp('(^'+this.textUtils.sanitize(aRoman)+'\t.+\n)', 'im');
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
 
	setDiskCache : function (aRoman, aMyRegExp, aTargetDic) 
	{
		var file = this.cacheFile;
		if (!file) return;

		var newCache = this.diskCacheClone;
		var tmpexp = new RegExp('(^' + this.textUtils.sanitize(aRoman) + '\t.+\n)', 'im');
		newCache = [newCache.replace(tmpexp, ''), aRoman, '\t', aMyRegExp, '\n'].join('');

		var oldCache = this.fileUtils.readFrom(file, 'Shift_JIS');

		if (newCache != oldCache) {
			this.save();
		}
	},
 
/* File I/O */ 
	 
	get cacheFile() 
	{
		return this.cacheFileHolder;
	},
	set cacheFile(val)
	{
		this.cacheFileHolder = val;
		return this.cacheFile;
	},
	cacheFileHolder : null,
	initWithFileName : function(aFileName)
	{
		if (!aFileName)
			return;

		try {
			this.cacheFile = Cc['@mozilla.org/file/local;1']
					.createInstance(Ci.nsILocalFile);
			this.cacheFile.initWithPath(this.dicpath);
			this.cacheFile.append(aFileName);
		}
		catch(e) {
			this.cacheFile = null;
		}
	},
	 
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
		var file = this.cacheFile;
		if (!file) return false;

		if (!file.exists()) {
			this.fileUtils.writeTo(file, '', 'Shift_JIS');
			this.initialized = true;
			return true;
		}

		this.diskCacheClone = this.fileUtils.readFrom(file, 'Shift_JIS');

		mydump('xmIXMigemoCache: loaded');
		this.initialized = true;
		return true;
	},
 
	reload : function() 
	{
		this.load();
	},
 
	save : function () 
	{
		var file = this.cacheFile;
		if (!file) return;

		var cache = this.fileUtils.readFrom(file, 'Shift_JIS');
		if (cache != this.diskCacheClone)
			this.fileUtils.writeTo(file, this.diskCacheClone, 'Shift_JIS');
	},
  
	QueryInterface : function(aIID) 
	{
		if (!aIID.equals(Ci.xmIXMigemoCache) &&
			!aIID.equals(Ci.pIXMigemoCache) &&
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
		aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
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
			CID        : xmXMigemoCache.prototype.classID,
			contractID : xmXMigemoCache.prototype.contractID,
			className  : xmXMigemoCache.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new xmXMigemoCache()).QueryInterface(aIID);
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
 
