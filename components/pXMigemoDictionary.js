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
 
function pXMigemoDictionary() {} 

pXMigemoDictionary.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/dictionary;1';
	},
	get classDescription() {
		return 'This is a dictionary service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{20309e9a-cef4-11db-8314-0800200c9a66}');
	},
	 
	initialized : false, 
 
	RESULT_OK                      : 1, 
	RESULT_ERROR_INVALID_YOMI      : 2,
	RESULT_ERROR_ALREADY_EXIST     : 4,
	RESULT_ERROR_NOT_EXIST         : 8,
	RESULT_ERROR_NO_TARGET         : 16,
	RESULT_ERROR_INVALID_OPERATION : 32,
 
	list : [], 
 
/* File I/O */ 
	 
	load : function() 
	{
		// dicPath
		//cはconsonant(英語:"子音")
		var cList  = new Array('', 'k', 's', 't', 'h', 'm', 'n', 'y', 'r', 'w', 'd', 'z', 'g', 'p', 'b', 'alph');
		var failed = new Array();
		var file;
		var dicDir = decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath')));

		var util = Components
					.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
					.getService(Components.interfaces.pIXMigemoFileAccess);

		var error = false;

		for (var i = 0, maxi = cList.length; i < maxi; i++)
		{
			file = null;

			if (dicDir) {
				file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
				file.initWithPath(dicDir);
				file.append(cList[i] + 'a2.txt');
			}
			if (file && file.exists()) {
				mydump(cList[i]);
				this.list[cList[i]] = util.readFrom(file, 'Shift_JIS');
			}
			else {
				this.list[cList[i]] = '';
				error = true;
			}

			// ユーザー辞書
			if (dicDir) {
				file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
				file.initWithPath(dicDir);
				file.append(cList[i] + 'a2.user.txt');
			}
			if (file && file.exists()) {
				mydump(cList[i] + '-user');
				this.list[cList[i] + '-user'] = util.readFrom(file, 'Shift_JIS');
			}
			else {
				this.list[cList[i] + '-user'] = '';
			}
		}

		this.initialized = true;

		return !error;
	},
 
	reload : function() 
	{
		this.load();
	},
 
	saveUserDic : function(aKey) 
	{
		if (!(aKey+'-user' in this.list)) return;

		var file;
		var dicDir = decodeURIComponent(escape(Prefs.getCharPref('xulmigemo.dicpath')));
		if (!dicDir) return;

		file = Components
				.classes["@mozilla.org/file/local;1"]
				.createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(dicDir);
		file.append(aKey + 'a2.user.txt');

		var util = Components
					.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
					.getService(Components.interfaces.pIXMigemoFileAccess);
		util.writeTo(file, (this.list[aKey+'-user'] || ''), 'Shift_JIS');
	},
  
	getDicInternal : function(aLetter, aUser) 
	{
		var suffix = aUser ? '-user' : '' ;

		switch (aLetter)
		{
			case 'l':
			case 'q':
			case 'x':
				return false;

			case 'c':
				return this.list['t' + suffix];

			case 'k':
			case 's':
			case 't':
			case 'h':
			case 'm':
			case 'n':
			case 'r':
			case 'd':
			case 'z':
			case 'g':
			case 'p':
			case 'b':
				return this.list[aLetter + suffix];

			case 'w':
			case 'y':
				return [this.list[aLetter + suffix], this.list['' + suffix]].join('\n');

			case 'a':
			case 'i':
			case 'u':
			case 'e':
			case 'o':
				return this.list['' + suffix];

			case 'j':
				return this.list['z' + suffix];

			case 'f':
				return this.list['h' + suffix];

			case 'v':
				return this.list['' + suffix];
		}
	},
	 
	getDic : function(aLetter) 
	{
		return this.getDicInternal(aLetter, false);
	},
 
	getUserDic : function(aLetter) 
	{
		return this.getDicInternal(aLetter, true);
	},
  
	getAlphaDic : function() 
	{
		return this.list['alph'];
	},
 
	getUserAlphaDic : function() 
	{
		return this.list['alph-user'];
	},
 
	getDicForTerm : function(aYomi) 
	{
		if (!aYomi) return null;

		if (/^[a-z0-9]+$/i.test(aYomi)) return 'alph';

		var XMigemoTextService = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1']
				.getService(Components.interfaces.pIXMigemoTextTransform);

		var firstLetter = XMigemoTextService.hira2roman(aYomi.charAt(0)).charAt(0);
		switch (firstLetter)
		{
			case 'a':
			case 'i':
			case 'u':
			case 'e':
			case 'o':
			case 'l':
				return '';

			default:
				return firstLetter;
		}
	},
 
	modifyDic : function(aTermSet, aOperation) 
	{
		if (
			!aOperation ||
			(aOperation != 'add' && aOperation != 'remove')
			)
			return this.RESULT_ERROR_INVALID_OPERATION;

		var XMigemoTextService = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1']
				.getService(Components.interfaces.pIXMigemoTextTransform);

		var yomi = aTermSet.yomi ? String(aTermSet.yomi) : '' ;
		var term = aTermSet.term ? String(aTermSet.term) : '' ;
		if (!yomi || !XMigemoTextService.isYomi(yomi))
			return this.RESULT_ERROR_INVALID_YOMI;

		yomi = XMigemoTextService.normalizeForYomi(yomi);
		if (aTermSet) aTermSet.yomi = yomi;

		var key = this.getDicForTerm(yomi);
		if (key === null) {
			return this.RESULT_ERROR_INVALID_YOMI;
		}

		if (aOperation == 'add' && !term) {
			return this.RESULT_ERROR_NO_TARGET;
		}

		var systemDic = this.list[key];
		var userDic   = this.list[key+'-user'];

		var regexp = new RegExp();

		if (aOperation == 'add') {
			// デフォルトの辞書に入っている単語は追加しない
			regexp.compile('^'+yomi+'\t(.+)$', 'm');
			if (regexp.test(systemDic)) {
				var terms = RegExp.$1.split('\t').join('\n');
				regexp.compile('^'+XMigemoTextService.sanitize(term)+'$', 'm');
				if (regexp.test(terms))
					return this.RESULT_ERROR_ALREADY_EXIST;
			}
		}

		regexp.compile('^'+yomi+'\t(.+)$', 'm');
		if (regexp.test(userDic)) {
			var terms = RegExp.$1.split('\t').join('\n');
			regexp.compile('^'+XMigemoTextService.sanitize(term)+'$', 'm');
			if ((aOperation == 'remove' && !term) || regexp.test(terms)) {
				// ユーザ辞書にすでに登録済みである場合
				switch (aOperation)
				{
					case 'add':
						return this.RESULT_ERROR_ALREADY_EXIST;

					case 'remove':
						if (term) {
							terms = terms.replace(regexp, '').replace(/\n\n+/g, '\n').split('\n').join('\t');
							mydump('terms:'+terms.replace(/\t/g, ' / '));
							if (terms) {
								regexp.compile('^('+yomi+'\t.+)$', 'm');
								regexp.test(userDic);
								entry = yomi + '\t' + terms.replace(/(^\t|\t$)/, '');
								this.list[key+'-user'] = userDic.replace(regexp, entry);
								break;
							}
						}

						regexp.compile('\n?^('+yomi+'\t.+)\n?', 'm');
						entry = yomi + '\t';
						this.list[key+'-user'] = userDic.replace(regexp, '');
						break;
				}
			}
			else {
				// ユーザ辞書にエントリはあるが、その語句は登録されていない場合
				switch (aOperation)
				{
					case 'add':
						regexp.compile('^('+yomi+'\t.+)$', 'm');
						regexp.test(userDic);
						entry = RegExp.$1 + '\t' + term;
						this.list[key+'-user'] = userDic.replace(regexp, entry);
						break;

					case 'remove':
						return this.RESULT_ERROR_NOT_EXIST;
				}
			}
		}
		else {
			// ユーザ辞書に未登録の場合
			switch (aOperation)
			{
				case 'add':
					entry = yomi + '\t' + term;
					this.list[key+'-user'] = [userDic, entry, '\n'].join('');
					break;

				case 'remove':
					return this.RESULT_ERROR_NOT_EXIST;
			}
		}

		this.saveUserDic(key);

		mydump('XMigemo:dictionaryModified('+aOperation+') '+entry);
		ObserverService.notifyObservers(this, 'XMigemo:dictionaryModified',
			[
				key,
				aOperation + '\t' + yomi + '\t' + term,
				entry
			].join('\n'));

		return this.RESULT_OK;
	},
	 
	addTerm : function(aYomi, aTerm) 
	{
		return this.modifyDic(
			{
				yomi : String(arguments[0]),
				term : String(arguments[1])
			},
			'add'
		);
	},
 
	removeTerm : function(aYomi, aTerm) 
	{
		return this.modifyDic(
			{
				yomi : String(arguments[0]),
				term : (arguments[1] ? String(arguments[1]) : null )
			},
			'remove'
		);
	},
  
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoDictionary) &&
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
			CID        : pXMigemoDictionary.prototype.classID,
			contractID : pXMigemoDictionary.prototype.contractID,
			className  : pXMigemoDictionary.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoDictionary()).QueryInterface(aIID);
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
 
