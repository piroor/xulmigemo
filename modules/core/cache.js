var EXPORTED_SYMBOLS = ['MigemoCache', 'MigemoCacheFactory'];

/* This depends on: 
	MigemoFileAccess
	MigemoTextUtils
*/
var DEBUG = false;
function log(...aArgs) 
{
	if (DEBUG ||
		Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.cache')) {
		Services.console.logStringMessage('cache: '+aArgs.join(', '));
		dump('cache: '+aArgs.join(', ')+'\n');
	}
}

var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
 
Cu.import('resource://xulmigemo-modules/lib/inherit.jsm');

Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');
Cu.import('resource://xulmigemo-modules/core/fileAccess.js');
 
function MigemoCache() {
}
MigemoCache.prototype = inherit(MigemoConstants, {
	initialized : false, 
 
	memCache       : {}, 
	diskCacheClone : {},
	DICTIONARIES_ALL : [
		MigemoConstants.SYSTEM_DIC,
		MigemoConstants.USER_DIC,
		MigemoConstants.ALL_DIC
	],
	DICTIONARIES_CHANGABLE : [
		MigemoConstants.USER_DIC,
		MigemoConstants.ALL_DIC
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

			var fileName = aFileName + (aType != this.ALL_DIC ? '-'+aType : '' );
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
		aTargetDic = aTargetDic || this.ALL_DIC;
		var miexp = new RegExp('(^'+MigemoTextUtils.sanitize(aRoman)+'\t.+\n)', 'im');
		if (this.memCache[aTargetDic].match(miexp)) {
			log('use memCache');
			return RegExp.$1.split('\t')[1];
		}
		else if (this.diskCacheClone[aTargetDic].match(miexp)) {
			log('use diskCacheClone');
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
		Services.obs.notifyObservers(null, 'XMigemo:cacheCleared', patterns.join('\n'));
	},
 
	clearCacheFor : function (aRoman) 
	{
		this.clearCacheSilentlyFor(aRoman);

		this.save();
		Services.obs.notifyObservers(null, 'XMigemo:cacheCleared', aRoman);
	},
 
	clearCacheSilentlyFor : function (aRoman) 
	{
		var miexp = new RegExp('(^'+aRoman+'\t.+\n)', 'im');
		this.DICTIONARIES_CHANGABLE.forEach(function(aType) {
			var cache = this.memCache[aType] || '';
			this.memCache[aType] = cache.replace(miexp, '');
			if (RegExp.$1) log('update memCache for "'+aRoman+'"');

			cache = this.diskCacheClone[aType] || '';
			this.diskCacheClone[aType] = cache.replace(miexp, '');
			if (RegExp.$1) log('update diskCache for "'+aRoman+'"');
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
				MigemoFileAccess.writeTo(file, '', this.encoding);
			this.diskCacheClone[aTargetDic] = '';
		}
	},
 
	setMemCache : function(aRoman, aRegExp, aTargetDic) 
	{
		aTargetDic = aTargetDic || this.ALL_DIC;
		var cache = this.memCache[aTargetDic] || '';
		var tmpexp = new RegExp('(^'+MigemoTextUtils.sanitize(aRoman)+'\t.+\n)', 'im');
		if (cache.match(tmpexp)) {
			return;
		}
		else {
			this.memCache[aTargetDic] = cache + aRoman + '\t' + aRegExp + '\n';
			//log(this.memCache);

			Services.obs.notifyObservers(null, 'XMigemo:memCacheAdded', aRoman+'\n'+aRegExp);

			return;
		}
	},
 
	setDiskCache : function (aRoman, aMyRegExp, aTargetDic) 
	{
		aTargetDic = aTargetDic || this.ALL_DIC;
		var file = this.getCacheFile(aTargetDic);
		if (!file) return;

		var oldCache = this.diskCacheClone[aTargetDic] || '' ;
		var tmpexp = new RegExp('^' + MigemoTextUtils.sanitize(aRoman) + '\t.+\n', 'im');
		var newCache = oldCache.replace(tmpexp, '')+aRoman+'\t'+aMyRegExp+'\n';
		this.diskCacheClone[aTargetDic] = newCache;
		if (newCache != oldCache)
			this.save(aTargetDic);
	},
 
/* File I/O */ 
	
	getCacheFile : function(aTargetDic) 
	{
		aTargetDic = aTargetDic || this.ALL_DIC;
		return aTargetDic in this.cacheFileHolders ?
				this.cacheFileHolders[aTargetDic] :
				null ;
	},
	setCacheFile : function(aFile, aTargetDic)
	{
		aTargetDic = aTargetDic || this.ALL_DIC;
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
		var fullPath = MigemoFileAccess.getExistingPath(
				decodeURIComponent(escape(Services.prefs.getCharPref('xulmigemo.dicpath')))
			);
		var relPath = MigemoFileAccess.getExistingPath(
				decodeURIComponent(escape(Services.prefs.getCharPref('xulmigemo.dicpath-relative')))
			);
		if (relPath && (!fullPath || fullPath != relPath))
			Services.prefs.setCharPref('xulmigemo.dicpath', unescape(encodeURIComponent(relPath)));

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
			log('MigemoCache: loaded');
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
			MigemoFileAccess.writeTo(file, '', this.encoding);
		}
		else {
			this.diskCacheClone[aTargetDic] = MigemoFileAccess.readFrom(file, this.encoding);
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

		var cache = MigemoFileAccess.readFrom(file, this.encoding);
		var clone = this.diskCacheClone[aTargetDic];
		if (cache != clone)
			MigemoFileAccess.writeTo(file, clone, this.encoding);

		return true;
	}
  
}); 

var MigemoCacheFactory = {
	_instances : {},
	get : function(aKey, aEncoding)
	{
		if (!this._instances[aKey]) {
			this._instances[aKey] = new MigemoCache();

			var lang = Services.prefs.getCharPref('xulmigemo.lang');

			var fileNameOverride;
			try {
				fileNameOverride = Services.prefs.getCharPref('xulmigemo.cache.override.'+lang);
			}
			catch(e) {
			}
			var fileName = fileNameOverride || aKey+'.cache.txt';

			var encodingOverride;
			try {
				encodingOverride = Services.prefs.getCharPref('xulmigemo.cache.override.'+lang+'.encoding');
			}
			catch(e) {
			}
			aEncoding = encodingOverride || aEncoding || 'UTF-8';

			this._instances[aKey].init(fileName, aEncoding);
		}
		return this._instances[aKey];
	}
};
