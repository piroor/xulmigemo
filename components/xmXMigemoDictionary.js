/* This depends on: 
	xmIXMigemoFileAccess
	xmIXMigemoTextUtils
	xmIXMigemoTextTransform
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

var xmIXMigemoDictionary = Ci.xmIXMigemoDictionary;
 
function xmXMigemoDictionary() { 
	mydump('create instance xmIXMigemoDictionary(lang=*)');
}

xmXMigemoDictionary.prototype = {
	lang : '',

	classDescription : 'xmXMigemoDictionary',
	contractID : '@piro.sakura.ne.jp/xmigemo/dictionary;1?lang=*',
	classID : Components.ID('{2bf35d7c-36f9-11dc-8314-0800200c9a66}'),

	QueryInterface : XPCOMUtils.generateQI([
		Ci.xmIXMigemoDictionary,
		Ci.xmIXMigemoDictionaryUniversal,
		Ci.pIXMigemoDictionary,
		Ci.pIXMigemoDictionaryUniversal
	]),

	get wrappedJSObject() {
		return this;
	},
	
	// xmIXMigemoDictionary 
	
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
 
	get textTransform() 
	{
		if (!this._textTransform) {
			if (TEST && xmXMigemoTextTransform) {
				this._textTransform = new xmXMigemoTextTransform();
			}
			else {
				this._textTransform = Cc['@piro.sakura.ne.jp/xmigemo/text-transform;1?lang=*']
						.getService(Ci.xmIXMigemoTextTransform);
			}
		}
		return this._textTransform;
	},
	_textTransform : null,
 
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
 
	RESULT_OK                      : xmIXMigemoDictionary.RESULT_OK, 
	RESULT_ERROR_INVALID_INPUT     : xmIXMigemoDictionary.RESULT_ERROR_INVALID_INPUT,
	RESULT_ERROR_ALREADY_EXIST     : xmIXMigemoDictionary.RESULT_ERROR_ALREADY_EXIST,
	RESULT_ERROR_NOT_EXIST         : xmIXMigemoDictionary.RESULT_ERROR_NOT_EXIST,
	RESULT_ERROR_NO_TARGET         : xmIXMigemoDictionary.RESULT_ERROR_NO_TARGET,
	RESULT_ERROR_INVALID_OPERATION : xmIXMigemoDictionary.RESULT_ERROR_INVALID_OPERATION,
 
/* File I/O */ 
	
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
		if (!this.lang) return false;

		var file;
		var dicDir = this.dicpath;

		var error = false;

		if (dicDir) {
			file = Cc['@mozilla.org/file/local;1']
				.createInstance(Ci.nsILocalFile);
			file.initWithPath(dicDir);
			file.append(this.lang+'.txt');
		}
		if (file && file.exists()) {
//			dump('system dic loaded from '+file.path+'\n');
			this.list['system'] = this.fileUtils.readFrom(file, 'UTF-8');
		}
		else {
//			dump('system dic not found at '+file.path+'\n');
			this.list['system'] = '';
			error = true;
		}

		// ユーザー辞書
		if (dicDir) {
			file = Cc["@mozilla.org/file/local;1"]
				.createInstance(Ci.nsILocalFile);
			file.initWithPath(dicDir);
			file.append(this.lang+'.user.txt');
		}
		if (file && file.exists()) {
//			dump('user dic loaded from '+file.path+'\n');
			this.list['user'] = this.fileUtils.readFrom(file, 'UTF-8');
		}
		else {
//			dump('user dic not found at '+file.path+'\n');
			this.list['user'] = '';
		}


		this.initialized = true;
		mydump('xmIXMigemoDictionary: loaded');

		return !error;
	},
 
	reload : function() 
	{
		this.load();
	},
 
	saveUserDic : function() 
	{
		if (!('user' in this.list)) return;

		var file;
		var dicDir = this.dicpath;
		if (!dicDir) return;

		file = Cc["@mozilla.org/file/local;1"]
				.createInstance(Ci.nsILocalFile);
		file.initWithPath(dicDir);
		file.append(this.lang+'.user.txt');

		this.fileUtils.writeTo(file, (this.list['user'] || ''), 'UTF-8');
	},
  
	addTerm : function(aInput, aTerm) 
	{
		return this.modifyDic(
			{
				input : String(arguments[0]),
				term  : String(arguments[1])
			},
			'add'
		);
	},
 
	removeTerm : function(aInput, aTerm) 
	{
		return this.modifyDic(
			{
				input : String(arguments[0]),
				term  : (arguments[1] ? String(arguments[1]) : null )
			},
			'remove'
		);
	},
 
	getDic : function() 
	{
		return this.list['system'];
	},
 
	getUserDic : function() 
	{
		return this.list['user'];
	},
  
	// internal 
	
	list : [], 
 
	modifyDic : function(aTermSet, aOperation) 
	{
		if (
			!aOperation ||
			(aOperation != 'add' && aOperation != 'remove')
			)
			return this.RESULT_ERROR_INVALID_OPERATION;

		var input = aTermSet.input ? String(aTermSet.input) : '' ;
		var term  = aTermSet.term ? String(aTermSet.term) : '' ;
		if (!input || !this.textTransform.isValidInput(input))
			return this.RESULT_ERROR_INVALID_INPUT;

		input = this.textTransform.normalizeInput(input);
		if (aTermSet) aTermSet.input = input;

		if (aOperation == 'add' && !term) {
			return this.RESULT_ERROR_NO_TARGET;
		}

		var systemDic = this.list['system'];
		var userDic   = this.list['user'];

		var regexp = new RegExp();

		if (aOperation == 'add') {
			// デフォルトの辞書に入っている単語は追加しない
			regexp.compile('^'+input+'\t(.+)$', 'm');
			if (regexp.test(systemDic)) {
				var terms = RegExp.$1.split('\t').join('\n');
				regexp.compile('^'+this.textUtils.sanitize(term)+'$', 'm');
				if (regexp.test(terms))
					return this.RESULT_ERROR_ALREADY_EXIST;
			}
		}

		regexp.compile('^'+input+'\t(.+)$', 'm');
		if (regexp.test(userDic)) {
			var terms = RegExp.$1.split('\t').join('\n');
			regexp.compile('^'+this.textUtils.sanitize(term)+'$', 'm');
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
								regexp.compile('^('+input+'\t.+)$', 'm');
								regexp.test(userDic);
								entry = input + '\t' + terms.replace(/(^\t|\t$)/, '');
								this.list['user'] = userDic.replace(regexp, entry);
								break;
							}
						}

						regexp.compile('\n?^('+input+'\t.+)\n?', 'm');
						entry = input + '\t';
						this.list['user'] = userDic.replace(regexp, '');
						break;
				}
			}
			else {
				// ユーザ辞書にエントリはあるが、その語句は登録されていない場合
				switch (aOperation)
				{
					case 'add':
						regexp.compile('^('+input+'\t.+)$', 'm');
						regexp.test(userDic);
						entry = RegExp.$1 + '\t' + term;
						this.list['user'] = userDic.replace(regexp, entry);
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
					entry = input + '\t' + term;
					this.list['user'] = [userDic, entry, '\n'].join('');
					break;

				case 'remove':
					return this.RESULT_ERROR_NOT_EXIST;
			}
		}

		this.saveUserDic();

		mydump('XMigemo:dictionaryModified('+aOperation+') '+entry);
		ObserverService.notifyObservers(this, 'XMigemo:dictionaryModified',
			[
				'',
				aOperation + '\t' + input + '\t' + term,
				entry
			].join('\n'));

		return this.RESULT_OK;
	}
  
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([xmXMigemoDictionary]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([xmXMigemoDictionary]);
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 80 ? aString.substring(0, 80) : aString )+'\n');
}
 
