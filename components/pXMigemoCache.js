/* This depends on: 
	pIXMigemoFileAccess
	pIXMigemoTextTransform
*/
var DEBUG = false;
 
var ObserverService = Components 
			.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);;

var Prefs = Components
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
function pXMigemoCache() {} 

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
	 
	initialized : false, 
 
	memCache       : '', 
	diskCacheClone : '',
 
	getCacheFor : function (aRoman) 
	{
		var XMigemoTextService = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1']
				.getService(Components.interfaces.pIXMigemoTextTransform);

		var miexp = new RegExp('(^'+XMigemoTextService.sanitize(aRoman)+'\t.+\n)', 'im');
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
		var XMigemoTextService = Components
			.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1']
			.getService(Components.interfaces.pIXMigemoTextTransform);

		var tmpexp = new RegExp('(^'+XMigemoTextService.sanitize(aRoman)+'\t.+\n)', 'im');
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

		var XMigemoTextService = Components
			.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1']
			.getService(Components.interfaces.pIXMigemoTextTransform);

		var newCache = this.diskCacheClone;
		var tmpexp = new RegExp('(^' + XMigemoTextService.sanitize(aRoman) + '\t.+\n)', 'im');
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
			try {
				this.cacheFileHolder = Components.classes['@mozilla.org/file/local;1'].createInstance();
				if (this.cacheFileHolder instanceof Components.interfaces.nsILocalFile) {
					this.cacheFileHolder.initWithPath(decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath'))));
					this.cacheFileHolder.append('migemocache.txt');
				}
			}
			catch(e) {
				this.cacheFileHolder = null;
			}
		}
		return this.cacheFileHolder;
	},
	cacheFileHolder : null,
 
	load : function() 
	{
		var file = this.cacheFile;
		if (!file || !file.exists()) return false;

		var util = Components
					.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
					.getService(Components.interfaces.pIXMigemoFileAccess);

		this.diskCacheClone = util.readFrom(file, 'Shift_JIS');

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
		dump((aString.length > 20 ? aString.substring(0, 20) : aString )+'\n');
}
 
