var EXPORTED_SYMBOLS = ['MigemoDictionaryJa'];

/* This depends on: 
	MigemoFileAccess
	MigemoTextUtils
	MigemoTextTransformJa
*/
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
 
Cu.import('resource://xulmigemo-modules/lib/inherit.jsm');

Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');
Cu.import('resource://xulmigemo-modules/core/textTransform.ja.js');
Cu.import('resource://xulmigemo-modules/core/fileAccess.js');
Cu.import('resource://xulmigemo-modules/core/dictionary.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('dictionary.ja', ...aArgs); }

 
var MigemoDictionaryJa = inherit(MigemoConstants, {
	lang : 'ja',

	// MigemoDictionary 
	
	initialized : false, 
 
/* File I/O */ 
	
	get dicpath() 
	{
		var fullPath = MigemoFileAccess.getExistingPath(
				decodeURIComponent(escape(Services.prefs.getCharPref(this.BASE+'dicpath')))
			);
		var relPath = MigemoFileAccess.getExistingPath(
				decodeURIComponent(escape(Services.prefs.getCharPref(this.BASE+'dicpath-relative')))
			);
		if (relPath && (!fullPath || fullPath != relPath))
			Services.prefs.setCharPref(this.BASE+'dicpath', unescape(encodeURIComponent(relPath)));

		return fullPath || relPath;
	},
 
	load : function() 
	{
		// dicPath
		//cはconsonant(英語:"子音")
		var failed = new Array();
		var file;
		var dicDir = this.dicpath;

		var error = false;

		for (var i = 0, maxi = this.cList.length; i < maxi; i++)
		{
			file = null;

			if (dicDir) {
				file = Cc['@mozilla.org/file/local;1']
					.createInstance(Ci.nsIFile);
				file.initWithPath(dicDir);
				file.append(this.cList[i] + 'a2.txt');
			}
			if (file && file.exists()) {
				log(this.cList[i]);
				this.list[this.cList[i]] = MigemoFileAccess.readFrom(file, 'Shift_JIS');
			}
			else {
				this.list[this.cList[i]] = '';
				error = true;
			}

			// ユーザー辞書
			if (dicDir) {
				file = Cc["@mozilla.org/file/local;1"]
					.createInstance(Ci.nsIFile);
				file.initWithPath(dicDir);
				file.append(this.cList[i] + 'a2.user.txt');
			}
			if (file && file.exists()) {
				log(this.cList[i] + '-user');
				this.list[this.cList[i] + '-user'] = MigemoFileAccess.readFrom(file, 'Shift_JIS');
			}
			else {
				this.list[this.cList[i] + '-user'] = '';
			}
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
		for (var i = 0, maxi = this.cList.length; i < maxi; i++)
			saveUserDicFor(this.cList[i]);
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
 
	getDic : function() 
	{
		var dics = [];
		for (var i = 0, maxi = this.cList.length; i < maxi; i++)
			dics.push(this.getDicFor(this.cList[i], false));
		return dics.join('\n');
	},
 
	getUserDic : function() 
	{
		var dics = [];
		for (var i = 0, maxi = this.cList.length; i < maxi; i++)
			dics.push(this.getDicFor(this.cList[i], true));
		return dics.join('\n');
	},
  
	// MigemoDictionaryJa 
	
	saveUserDicFor : function(aKey) 
	{
		if (!(aKey+'-user' in this.list)) return;

		var file;
		var dicDir = this.dicpath;
		if (!dicDir) return;

		file = Cc["@mozilla.org/file/local;1"]
				.createInstance(Ci.nsIFile);
		file.initWithPath(dicDir);
		file.append(aKey + 'a2.user.txt');

		MigemoFileAccess.writeTo(file, (this.list[aKey+'-user'] || ''), 'Shift_JIS');
	},
 
	getDicFor : function(aLetter) 
	{
		return this.getDicInternal(aLetter, false);
	},
 
	getUserDicFor : function(aLetter) 
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

		var firstLetter = MigemoTextTransformJa.hira2roman(aYomi.charAt(0)).charAt(0);
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
  
	// internal 
	
	list : [], 
 
	cList : ['', 'k', 's', 't', 'h', 'm', 'n', 'y', 'r', 'w', 'd', 'z', 'g', 'p', 'b', 'alph'], 
 
	modifyDic : function(aTermSet, aOperation) 
	{
		if (
			!aOperation ||
			(aOperation != 'add' && aOperation != 'remove')
			)
			return this.RESULT_ERROR_INVALID_OPERATION;

		var yomi = aTermSet.yomi ? String(aTermSet.yomi) : '' ;
		var term = aTermSet.term ? String(aTermSet.term) : '' ;
		if (!yomi || !MigemoTextTransformJa.isYomi(yomi))
			return this.RESULT_ERROR_INVALID_INPUT;

		yomi = MigemoTextTransformJa.normalizeForYomi(yomi);
		if (aTermSet) aTermSet.yomi = yomi;

		var key = this.getDicForTerm(yomi);
		if (key === null) {
			return this.RESULT_ERROR_INVALID_INPUT;
		}

		if (aOperation == 'add' && !term) {
			return this.RESULT_ERROR_NO_TARGET;
		}

		var systemDic = this.list[key];
		var userDic   = this.list[key+'-user'];

		var regexp;

		if (aOperation == 'add') {
			// デフォルトの辞書に入っている単語は追加しない
			regexp = new RegExp('^'+yomi+'\t(.+)$', 'm');
			if (regexp.test(systemDic)) {
				var terms = RegExp.$1.split('\t').join('\n');
				regexp = new RegExp('^'+MigemoTextUtils.sanitize(term)+'$', 'm');
				if (regexp.test(terms))
					return this.RESULT_ERROR_ALREADY_EXIST;
			}
		}

		regexp = new RegExp('^'+yomi+'\t(.+)$', 'm');
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
								regexp = new RegExp('^('+yomi+'\t.+)$', 'm');
								regexp.test(userDic);
								entry = yomi + '\t' + terms.replace(/(^\t|\t$)/, '');
								this.list[key+'-user'] = userDic.replace(regexp, entry);
								break;
							}
						}

						regexp = new RegExp('\n?^('+yomi+'\t.+)\n?', 'm');
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
						regexp = new RegExp('^('+yomi+'\t.+)$', 'm');
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

		this.saveUserDicFor(key);

		log('XMigemo:dictionaryModified('+aOperation+') '+entry);
		Services.obs.notifyObservers(this, 'XMigemo:dictionaryModified',
			[
				key,
				aOperation + '\t' + yomi + '\t' + term,
				entry
			].join('\n'));

		return this.RESULT_OK;
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
	}
  
}); 
