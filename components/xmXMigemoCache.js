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
 	
	memCache       : {}, 
	diskCacheClone : {},
	DICTIONARY_TYPES : [
		Ci.xmIXMigemoEngine.SYSTEM_DIC,
		Ci.xmIXMigemoEngine.USER_DIC,
		Ci.xmIXMigemoEngine.ALL_DIC
	],
	encoding : 'UTF-8',
 
	getCacheFor : function (aRoman, aTargetDic) 
	{
		aTargetDic = aTargetDic || Ci.xmIXMigemoEngine.ALL_DIC;
		var miexp = new RegExp('(^'+this.textUtils.sanitize(aRoman)+'\t.+\n)', 'im');
		if (this.memCache[aTargetDic].match(miexp)) {
			mydump('use memCache');
			return RegExp.$1.split('\t')[1];
		}
		else if (this.diskCacheClone[aTargetDic].match(miexp)) {
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
		aTargetDic = aTargetDic || Ci.xmIXMigemoEngine.ALL_DIC;
		var miexp = new RegExp('(^'+aRoman+'\t.+\n)', 'im');

		var cache = this.memCache[aTargetDic] || '';
		this.memCache[aTargetDic] = cache.replace(miexp, '');
		if (RegExp.$1) mydump('update memCache for "'+aRoman+'"');

		cache = this.diskCacheClone[aTargetDic] || '';
		this.diskCacheClone[aTargetDic] = cache.replace(miexp, '');
		if (RegExp.$1) mydump('update diskCache for "'+aRoman+'"');
	},
 
	clearAll : function(aDisk, aTargetDic) 
	{
		aTargetDic = aTargetDic || Ci.xmIXMigemoEngine.ALL_DIC;
		this.memCache[aTargetDic] = '';
		if (aDisk)
			this.diskCacheClone[aTargetDic] = '';
	},
 
	setMemCache : function(aRoman, aRegExp, aTargetDic) 
	{
		aTargetDic = aTargetDic || Ci.xmIXMigemoEngine.ALL_DIC;
		var cache = this.memCache[aTargetDic] || '';
		var tmpexp = new RegExp('(^'+this.textUtils.sanitize(aRoman)+'\t.+\n)', 'im');
		if (cache.match(tmpexp)) {
			return;
		}
		else {
			this.memCache[aTargetDic] += aRoman + '\t' + aRegExp + '\n';
			//mydump(this.memCache);

			ObserverService.notifyObservers(null, 'XMigemo:memCacheAdded', aRoman+'\n'+aRegExp);

			return;
		}
	},
 
	setDiskCache : function (aRoman, aMyRegExp, aTargetDic) 
	{
		aTargetDic = aTargetDic || Ci.xmIXMigemoEngine.ALL_DIC;
		var file = this.getCacheFile(aTargetDic);
		if (!file) return;

		var newCache = this.diskCacheClone[aTargetDic] || '';
		var tmpexp = new RegExp('(^' + this.textUtils.sanitize(aRoman) + '\t.+\n)', 'im');
		newCache = [newCache.replace(tmpexp, ''), aRoman, '\t', aMyRegExp, '\n'].join('');

		var oldCache = this.fileUtils.readFrom(file, this.encoding);

		if (newCache != oldCache) {
			this.save(aTargetDic);
		}
	},
 
/* File I/O */ 
	 
	getCacheFile : function(aTargetDic) 
	{
		aTargetDic = aTargetDic || Ci.xmIXMigemoEngine.ALL_DIC;
		return this.cacheFileHolders[aTargetDic];
	},
	setCacheFile : function(aFile, aTargetDic) 
	{
		aTargetDic = aTargetDic || Ci.xmIXMigemoEngine.ALL_DIC;
		this.cacheFileHolders[aTargetDic] = aFile;
	},
 
	get cacheFile() 
	{
		return this.getCacheFile();
	},
	set cacheFile(val)
	{
		this.setCacheFile(val);
		return this.cacheFile;
	},
	cacheFileHolders : {},
	init : function(aFileName, aEncoding)
	{
		if (!aFileName)
			return;

		if (aEncoding)
			this.encoding = aEncoding;

		this.DICTIONARY_TYPES.forEach(function(aType) {
			this.memCache[aType] = '';
			this.diskCacheClone[aType] = '';

			var fileName = aFileName + (aType != Ci.xmIXMigemoEngine.ALL_DIC ? '-'+aType : '' );
			try {
				var file = Cc['@mozilla.org/file/local;1']
						.createInstance(Ci.nsILocalFile);
				file.initWithPath(this.dicpath);
				file.append(fileName);
				this.setCacheFile(file, aType);
			}
			catch(e) {
				this.setCacheFile(null, aType);
			}
		}, this);
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
  
	load : function(aTargetType) 
	{
		if (aTargetType) {
			if (!this.loadFor(aTargetType))
				return false;
		}
		else {
			var failedCount = 0;
			this.DICTIONARY_TYPES.forEach(this.loadFor, this);
		}
		this.initialized = this.DICTIONARY_TYPES.every(this.getCacheFile, this);
		if (this.initialized) {
			mydump('xmIXMigemoCache: loaded');
			return true;
		}
		else {
			return false;
		}
	},
	loadFor : function(aTargetType) 
	{
		var file = this.getCacheFile(aTargetType);
		if (!file)
			return false;

		if (!file.exists()) {
			this.fileUtils.writeTo(file, '', this.encoding);
		}
		else {
			this.diskCacheClone[aTargetType] = this.fileUtils.readFrom(file, this.encoding);
		}
		return true;
	},
 
	reload : function(aTargetType) 
	{
		this.load(aTargetType);
	},
 
	save : function (aTargetType) 
	{
		if (aTargetType)
			this.saveFor(aTargetType);
		else
			this.DICTIONARY_TYPES.forEach(this.saveFor, this);
	},
	saveFor : function (aTargetType)
	{
		var file = this.getCacheFile(aTargetType);
		if (!file)
			return false;

		var cache = this.fileUtils.readFrom(file, this.encoding);
		var clone = this.diskCacheClone[aTargetType];
		if (cache != clone)
			this.fileUtils.writeTo(file, clone, this.encoding);

		return true;
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
 
