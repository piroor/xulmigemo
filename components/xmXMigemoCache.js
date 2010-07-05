/* This depends on: 
	xmIXMigemoFileAccess
	xmIXMigemoTextUtils
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm'); 

var ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);
 
function xmXMigemoCache() { 
	mydump('create instance xmIXMigemoCache');
}

xmXMigemoCache.prototype = {
	classDescription : 'XUL/Migemo Cache Service',
	contractID : '@piro.sakura.ne.jp/xmigemo/cache;1',
	classID : Components.ID('{0c6119e4-cef4-11db-8314-0800200c9a66}'),

	QueryInterface : XPCOMUtils.generateQI([
		Ci.xmIXMigemoCache,
		Ci.pIXMigemoCache
	]),

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
	DICTIONARIES_ALL : [
		Ci.xmIXMigemoEngine.SYSTEM_DIC,
		Ci.xmIXMigemoEngine.USER_DIC,
		Ci.xmIXMigemoEngine.ALL_DIC
	],
	DICTIONARIES_CHANGABLE : [
		Ci.xmIXMigemoEngine.USER_DIC,
		Ci.xmIXMigemoEngine.ALL_DIC
	],
	encoding : 'UTF-8',
 
	init : function(aFileName, aEncoding) 
	{
		if (!aFileName)
			return;

		if (aEncoding)
			this.encoding = aEncoding;

		this.DICTIONARIES_ALL.forEach(function(aType) {
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
	initWithFileName : function(aFileName)
	{
		this.init(aFileName);
	},
 
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
		this.DICTIONARIES_CHANGABLE.forEach(function(aType) {
			var cache = this.memCache[aType] || '';
			this.memCache[aType] = cache.replace(miexp, '');
			if (RegExp.$1) mydump('update memCache for "'+aRoman+'"');

			cache = this.diskCacheClone[aType] || '';
			this.diskCacheClone[aType] = cache.replace(miexp, '');
			if (RegExp.$1) mydump('update diskCache for "'+aRoman+'"');
		}, this);
	},
 
	clearAll : function(aDisk, aTargetDic) 
	{
		if (aTargetDic)
			this.clearAllFor(aTargetDic);
		else
			this.DICTIONARIES_ALL.forEach(this.clearAllFor, this);
	},
	clearAllFor : function (aTargetDic)
	{
		this.memCache[aTargetDic] = '';
		if (aDisk) {
			var file = this.getCacheFile(aTargetDic);
			if (file)
				this.fileUtils.writeTo(file, '', this.encoding);
			this.diskCacheClone[aTargetDic] = '';
		}
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
			this.memCache[aTargetDic] = cache + aRoman + '\t' + aRegExp + '\n';
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

		var oldCache = this.diskCacheClone[aTargetDic] || '' ;
		var tmpexp = new RegExp('^' + this.textUtils.sanitize(aRoman) + '\t.+\n', 'im');
		var newCache = oldCache.replace(tmpexp, '')+aRoman+'\t'+aMyRegExp+'\n';
		this.diskCacheClone[aTargetDic] = newCache;
		if (newCache != oldCache)
			this.save(aTargetDic);
	},
 
/* File I/O */ 
	
	getCacheFile : function(aTargetDic) 
	{
		aTargetDic = aTargetDic || Ci.xmIXMigemoEngine.ALL_DIC;
		return aTargetDic in this.cacheFileHolders ?
				this.cacheFileHolders[aTargetDic] :
				null ;
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
  
	load : function(aTargetDic) 
	{
		if (aTargetDic) {
			if (!this.loadFor(aTargetDic))
				return false;
		}
		else {
			var failedCount = 0;
			this.DICTIONARIES_ALL.forEach(this.loadFor, this);
		}
		this.initialized = this.DICTIONARIES_ALL.every(this.getCacheFile, this);
		if (this.initialized) {
			mydump('xmIXMigemoCache: loaded');
			return true;
		}
		else {
			return false;
		}
	},
	loadFor : function(aTargetDic)
	{
		var file = this.getCacheFile(aTargetDic);
		if (!file)
			return false;

		if (!file.exists()) {
			this.fileUtils.writeTo(file, '', this.encoding);
		}
		else {
			this.diskCacheClone[aTargetDic] = this.fileUtils.readFrom(file, this.encoding);
		}
		return true;
	},
 
	reload : function(aTargetDic) 
	{
		this.load(aTargetDic);
	},
 
	save : function (aTargetDic) 
	{
		if (aTargetDic)
			this.saveFor(aTargetDic);
		else
			this.DICTIONARIES_ALL.forEach(this.saveFor, this);
	},
	saveFor : function (aTargetDic)
	{
		var file = this.getCacheFile(aTargetDic);
		if (!file)
			return false;

		var cache = this.fileUtils.readFrom(file, this.encoding);
		var clone = this.diskCacheClone[aTargetDic];
		if (cache != clone)
			this.fileUtils.writeTo(file, clone, this.encoding);

		return true;
	}
  
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([xmXMigemoCache]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([xmXMigemoCache]);
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 80 ? aString.substring(0, 80) : aString )+'\n');
}
 
