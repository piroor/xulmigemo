/* This depends on: 
	pIXMigemoDictionary
	pIXMigemoTextTransform
*/
var DEBUG = false;
 
var Prefs = Components 
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);

const pIXMigemoEngine = Components.interfaces.pIXMigemoEngine;
 
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
			var id = '@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+this.lang;
			if (id in Components.classes) {
				this._dictionary = Components
					.classes[id]
					.getService(Components.interfaces.pIXMigemoDictionary);
			}
			else {
				this._dictionary = Components
					.classes['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang=*']
					.createInstance(Components.interfaces.pIXMigemoDictionary)
					.QueryInterface(Components.interfaces.pIXMigemoDictionaryUniversal);
				this._dictionary.lang = this.lang;
			}
		}
		return this._dictionary;
	},
	_dictionary : null,
 
	get textTransform() 
	{
		if (!this._textTransform) {
			this._textTransform = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1?lang=*']
				.getService(Components.interfaces.pIXMigemoTextTransform);
		}
		return this._textTransform;
	},
	_textTransform : null,
 
	getRegExpFor : function(aInput) 
	{
		if (!aInput || !this.lang) return null;

		aInput = aInput.toLowerCase();

		var XMigemoTextService = this.textTransform;
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		mydump('noCache');
		var str = XMigemoTextUtils.sanitize(aInput);

		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			str = XMigemoTextService.addLatinModifiers(str);

		var lines = this.gatherEntriesFor(aInput, this.ALL_DIC, {});

		var pattern = '';
		if (lines.length) {
			searchterm = lines.join('\n').replace(/(\t|\n\n)+/g, '\n');
			searchterm = searchterm
				.split('\n')
				.sort()
				.join('\n')
				.replace(/^(.+)$(\n\1$)+/img, '$1');

			searchterm = XMigemoTextUtils.sanitize(searchterm)
				.replace(/\n/g, '|');
			pattern += (pattern ? '|' : '') + searchterm;
			pattern += (pattern ? '|' : '') + str;

			pattern = pattern.replace(/\n/g, '');
			mydump('pattern:'+pattern);
		}
		else { // 辞書に引っかからなかった模様なので自前の文字列だけ
			pattern = str;
			mydump('pattern:'+pattern);
		}

		return pattern.replace(/\n|^\||\|$/g, '')
				.replace(/\|\|+/g, '|')
				.replace(/\(\|/g, '(')
				.replace(/\|\)/g, ')');
	},
 
	splitInput : function(aInput, aCount) 
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

		aCount.value = terms.length;
		return terms;
	},
 
	gatherEntriesFor : function(aInput, aTargetDic, aCount) 
	{
		if (!aInput || !this.lang) {
			aCount.value = 0;
			return [];
		}

		var XMigemoTextService = this.textTransform;
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		var str = XMigemoTextUtils.sanitize(aInput);
		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			str = XMigemoTextService.addLatinModifiers(str);

		var tmp = '^(' + str + ').+$';
		var exp = new RegExp(tmp, 'img');

		var lines = [];

		const XMigemoDic = this.dictionary;

		var mydicU = (aTargetDic & this.USER_DIC) ? XMigemoDic.getUserDic() : null ;
		var mydic  = (aTargetDic & this.SYSTEM_DIC)   ? XMigemoDic.getDic() : null ;

		if (mydicU) {
			var lineU = mydicU.match(exp);
			if (lineU) {
				lines = lines.concat(lineU);
				mydump(' found '+lineU.length+' terms');
			}
		}
		if (mydic) {
			var line = mydic.match(exp);//アルファベットの辞書を検索
			if (line) {
				lines = lines.concat(line);
				mydump(' found '+line.length+' terms');
			}
		}

		aCount.value = lines.length;
		return lines;
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(pIXMigemoEngine) &&
			!aIID.equals(Components.interfaces.pIXMigemoEngineUniversal) &&
			!aIID.equals(Components.interfaces.nsIObserver) &&
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
 
