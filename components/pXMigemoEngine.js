/* This depends on: 
	pIXMigemoDictionary
	pIXMigemoTextTransform
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);

const pIXMigemoEngine = Ci.pIXMigemoEngine;
 
function pXMigemoEngine() { 
	mydump('create instance pIXMigemoEngine(lang=*)');
}

pXMigemoEngine.prototype = {
	lang : '',

	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/engine;1?lang=*';
	},
	get classDescription() {
		return 'This is a Migemo service itself, for Japanese language.';
	},
	get classID() {
		return Components.ID('{706170f0-36fb-11dc-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	SYSTEM_DIC : pIXMigemoEngine.SYSTEM_DIC, 
	USER_DIC   : pIXMigemoEngine.USER_DIC,
	ALL_DIC    : pIXMigemoEngine.ALL_DIC,
 
	get dictionary() 
	{
		if (!this._dictionary && this.lang) {
			var constructor;
			if (TEST) {
				eval('constructor = pXMigemoDictionary'+
						this.lang.replace(/^./, function(aChar) {
							return aChar.toUpperCase();
						})
				);
			}
			if (constructor) {
				this._dictionary = new constructor();
			}
			else {
				var id = '@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+this.lang;
				if (id in Cc) {
					this._dictionary = Cc[id]
						.getService(Ci.pIXMigemoDictionary);
				}
				else {
					this._dictionary = Cc['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang=*']
						.createInstance(Ci.pIXMigemoDictionary)
						.QueryInterface(Ci.pIXMigemoDictionaryUniversal);
					this._dictionary.lang = this.lang;
				}
			}
		}
		return this._dictionary;
	},
	_dictionary : null,
 
	get textUtils() 
	{
		if (!this._textUtils) {
			if (TEST && pXMigemoTextUtils) {
				this._textUtils = new pXMigemoTextUtils();
			}
			else {
				this._textUtils = Cc['@piro.sakura.ne.jp/xmigemo/text-utility;1']
						.getService(Ci.pIXMigemoTextUtils);
			}
		}
		return this._textUtils;
	},
	_textUtils : null,
 
	get textTransform() 
	{
		if (!this._textTransform) {
			if (TEST && pXMigemoTextTransform) {
				this._textTransform = new pXMigemoTextTransform();
			}
			else {
				this._textTransform = Cc['@piro.sakura.ne.jp/xmigemo/text-transform;1?lang=*']
						.getService(Ci.pIXMigemoTextTransform);
			}
		}
		return this._textTransform;
	},
	_textTransform : null,
 
	getRegExpFor : function(aInput) 
	{
		if (!aInput || !this.lang) return null;

		aInput = aInput.toLowerCase();

		mydump('noCache');
		var str = this.textUtils.sanitize(aInput);

		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			str = this.textTransform.addLatinModifiers(str);

		var lines = this.gatherEntriesFor(aInput, this.ALL_DIC);

		var pattern = '';
		if (lines.length) {
			searchterm = lines.join('\n').replace(/(\t|\n\n)+/g, '\n');
			searchterm = searchterm
				.split('\n')
				.sort()
				.join('\n')
				.replace(/^(.+)$(\n\1$)+/img, '$1');

			searchterm = this.textUtils.sanitize(searchterm)
				.replace(/\n/g, '|');
			pattern += (pattern ? '|' : '') + searchterm;
			pattern += (pattern ? '|' : '') + str;

			pattern = pattern.replace(/\n/g, '');
			mydump('pattern:'+pattern);
		}
		else { // é´èëÇ…à¯Ç¡Ç©Ç©ÇÁÇ»Ç©Ç¡ÇΩñÕólÇ»ÇÃÇ≈é©ëOÇÃï∂éöóÒÇæÇØ
			pattern = str;
			mydump('pattern:'+pattern);
		}

		return pattern.replace(/\n|^\||\|$/g, '')
				.replace(/\|\|+/g, '|')
				.replace(/\(\|/g, '(')
				.replace(/\|\)/g, ')');
	},
 
	splitInput : function(aInput) 
	{
		var terms = aInput
				.replace(/([\uff66-\uff9fa-z])([0-9])/i, '$1\t$2')
				.replace(/([0-9a-z])([\uff66-\uff9f])/i, '$1\t$2')
				.replace(/([0-9\uff66-\uff9f])([a-z])/i, '$1\t$2')
				.replace(new RegExp('([!"#\$%&\'\\(\\)=~\\|\\`\\{\\+\\*\\}<>\\?_\\-\\^\\@\\[\\;\\:\\]\\/\\\\\\.,\uff61\uff64]+)', 'g'), '\t$1\t');

		terms = terms
				.replace(/ +|\t\t+/g, '\t')
				.replace(/^[\s\t]+|[\s\t]+$/g, '')
				.split('\t');

		return terms;
	},
 
	gatherEntriesFor : function(aInput, aTargetDic) 
	{
		if (!aInput || !this.lang) {
			return [];
		}

		var str = this.textUtils.sanitize(aInput);
		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			str = this.textTransform.addLatinModifiers(str);

//		var tmp = '^(' + str + ').+$';
//		var exp = new RegExp(tmp, 'img');

		var lines = [];

		if (aTargetDic & this.USER_DIC)
			lines = lines.concat(this.dictionary.getUserEntriesFor(str, null));
		if (aTargetDic & this.SYSTEM_DIC)
			lines = lines.concat(this.dictionary.getEntriesFor(str, null));

		return lines;
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(pIXMigemoEngine) &&
			!aIID.equals(Ci.pIXMigemoEngineUniversal) &&
			!aIID.equals(Ci.nsIObserver) &&
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
		aComponentManager = aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
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
			CID        : pXMigemoEngine.prototype.classID,
			contractID : pXMigemoEngine.prototype.contractID,
			className  : pXMigemoEngine.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoEngine()).QueryInterface(aIID);
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
		dump((aString.length > 1024 ? aString.substring(0, 1024) : aString )+'\n');
}
 
