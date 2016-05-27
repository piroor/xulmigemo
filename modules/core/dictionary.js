var EXPORTED_SYMBOLS = ['MigemoDictionary'];

/* This depends on: 
	MigemoFileAccess
	MigemoTextUtils
	MigemoTextTransform
*/
var DEBUG = false;
function log(...aArgs) 
{
	if (DEBUG ||
		Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.dictionary')) {
		Services.console.logStringMessage('dictionary: '+aArgs.join(', '));
		dump('dictionary: '+aArgs.join(', ')+'\n');
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
Cu.import('resource://xulmigemo-modules/core/textTransform.js');
Cu.import('resource://xulmigemo-modules/core/fileAccess.js');


var MigemoDictionary = inherit(MigemoConstants, {
	lang : '',
	
	// MigemoDictionary 
	
	initialized : false, 
 
/* File I/O */ 
	
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
			this.list['system'] = MigemoFileAccess.readFrom(file, 'UTF-8');
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
			this.list['user'] = MigemoFileAccess.readFrom(file, 'UTF-8');
		}
		else {
//			dump('user dic not found at '+file.path+'\n');
			this.list['user'] = '';
		}


		this.initialized = true;
		log('MigemoDictionary: loaded');

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

		MigemoFileAccess.writeTo(file, (this.list['user'] || ''), 'UTF-8');
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
		if (!input || !MigemoTextTransform.isValidInput(input))
			return this.RESULT_ERROR_INVALID_INPUT;

		input = MigemoTextTransform.normalizeInput(input);
		if (aTermSet) aTermSet.input = input;

		if (aOperation == 'add' && !term) {
			return this.RESULT_ERROR_NO_TARGET;
		}

		var systemDic = this.list['system'];
		var userDic   = this.list['user'];

		var regexp;

		if (aOperation == 'add') {
			// デフォルトの辞書に入っている単語は追加しない
			regexp = new RegExp('^'+input+'\t(.+)$', 'm');
			if (regexp.test(systemDic)) {
				var terms = RegExp.$1.split('\t').join('\n');
				regexp = new RegExp('^'+MigemoTextUtils.sanitize(term)+'$', 'm');
				if (regexp.test(terms))
					return this.RESULT_ERROR_ALREADY_EXIST;
			}
		}

		regexp = new RegExp('^'+input+'\t(.+)$', 'm');
		if (regexp.test(userDic)) {
			var terms = RegExp.$1.split('\t').join('\n');
			regexp = new RegExp('^'+MigemoTextUtils.sanitize(term)+'$', 'm');
			if ((aOperation == 'remove' && !term) || regexp.test(terms)) {
				// ユーザ辞書にすでに登録済みである場合
				switch (aOperation)
				{
					case 'add':
						return this.RESULT_ERROR_ALREADY_EXIST;

					case 'remove':
						if (term) {
							terms = terms.replace(regexp, '').replace(/\n\n+/g, '\n').split('\n').join('\t');
							log('terms:'+terms.replace(/\t/g, ' / '));
							if (terms) {
								regexp = new RegExp('^('+input+'\t.+)$', 'm');
								regexp.test(userDic);
								entry = input + '\t' + terms.replace(/(^\t|\t$)/, '');
								this.list['user'] = userDic.replace(regexp, entry);
								break;
							}
						}

						regexp = new RegExp('\n?^('+input+'\t.+)\n?', 'm');
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
						regexp = new RegExp('^('+input+'\t.+)$', 'm');
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

		log('XMigemo:dictionaryModified('+aOperation+') '+entry);
		Services.obs.notifyObservers(this, 'XMigemo:dictionaryModified',
			[
				'',
				aOperation + '\t' + input + '\t' + term,
				entry
			].join('\n'));

		return this.RESULT_OK;
	}
  
}); 
