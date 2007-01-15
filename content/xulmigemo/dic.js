/* 
	This depends on:
		service.js
*/
 
var XMigemoCache = { 
	initialized : false,
	
	memCache       : '', 
	diskCacheClone : '',
 
	getCacheFor : function (aRoman) 
	{
		var miexp = new RegExp('(^'+XMigemoTextService.sanitize(aRoman)+'\t.+\n)', 'im');
		if (this.memCache.match(miexp)) {
			mydump('use memCache');
			return RegExp.$1.split('\t')[1];
		}
		else if (this.diskCacheClone.match(miexp)) {
			mydump('use diskCacheClone');
			return RegExp.$1.split('\t')[1];
		}
		return false;
	},
 
	clearCacheForAllPatterns : function (aRoman) 
	{
		var patterns = [];
		for (var i = aRoman.length-1; i > 0; i--)
		{
			var key = aRoman.substring(0, i);
			patterns.push(key);
			this.clearCacheFor(key, true);
		}
		this.save();
		XMigemoService.ObserverService.notifyObservers(window, 'XMigemo:cacheCleared', patterns.join('\n'));
	},
 
	clearCacheFor : function (aRoman, aPreventSaveAndNotify) 
	{
		var miexp = new RegExp('(^'+aRoman+'\t.+\n)', 'im');
		this.memCache = this.memCache.replace(miexp, '');
		if (RegExp.$1) mydump('update memCache for "'+aRoman+'"');
		this.diskCacheClone = this.diskCacheClone.replace(miexp, '');
		if (RegExp.$1) mydump('update diskCache for "'+aRoman+'"');

		if (!aPreventSaveAndNotify) {
			this.save();
			XMigemoService.ObserverService.notifyObservers(window, 'XMigemo:cacheCleared', aRoman);
		}
	},
 
	clearAll : function(aDisk) 
	{
		this.memCache = '';
		if (aDisk)
			this.diskCacheClone = '';
	},
 
	setMemCache : function(aRoman, aRegExp) 
	{
		var tmpexp = new RegExp('(^'+XMigemoTextService.sanitize(aRoman)+'\t.+\n)', 'im');
		if (this.memCache.match(tmpexp)) {
			return;
		}
		else {
			this.memCache += aRoman + '\t' + aRegExp + '\n';
			//mydump(this.memCache);

			XMigemoService.ObserverService.notifyObservers(window, 'XMigemo:memCacheAdded', aRoman+'\n'+aRegExp);

			return;
		}
	},
 
/* File I/O */ 
	
	get cacheFile() 
	{
		if (!this.cacheFileHolder) {
			try {
				this.cacheFileHolder = Components.classes['@mozilla.org/file/local;1'].createInstance();
				if (this.cacheFileHolder instanceof Components.interfaces.nsILocalFile) {
					this.cacheFileHolder.initWithPath(XMigemoService.getPref('xulmigemo.dicpath'));
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

		var cache = XMigemoService.readFrom(file);
		const UConvID = '@mozilla.org/intl/scriptableunicodeconverter';
		const UConvIF = Components.interfaces.nsIScriptableUnicodeConverter;
		const UConv = Components.classes[UConvID].getService(UConvIF);
		UConv.charset = 'Shift_JIS';
		var mygcutf8_str = UConv.ConvertToUnicode(cache);
		this.diskCacheClone = mygcutf8_str;

		this.initialized = true;
		return true;
	},
 
	save : function (aRoman, aMyRegExp) { 
		var file = this.cacheFile;
		if (!file) return false;

		var oldCache = this.diskCacheClone;
		var newCache = this.diskCacheClone;

		if (aRoman && aMyRegExp) {
			var tmpexp = new RegExp('(^' + XMigemoTextService.sanitize(aRoman) + '\t.+\n)', 'im');
			newCache = [newCache.replace(tmpexp, ''), aRoman, '\t', aMyRegExp, '\n'].join('');
		}

		if (newCache != oldCache) {
			const UConvID = '@mozilla.org/intl/scriptableunicodeconverter';
			const UConvIF = Components.interfaces.nsIScriptableUnicodeConverter;
			const UConv = Components.classes[UConvID].getService(UConvIF);
			UConv.charset = 'Shift_JIS';
			var sjis_str = UConv.ConvertFromUnicode(newCache);
			XMigemoService.writeTo(file, sjis_str);
			this.diskCacheClone = newCache;
			return true;
		}
		else {
			return false;
		}
	},
 
	dump : function() 
	{
		if (!XMigemoService.DEBUG) return;

		var file = this.cacheFile;
		if (file && file.exists()) {
			var cache = readFrom(file);
			const UConvID = '@mozilla.org/intl/scriptableunicodeconverter';
			const UConvIF  = Components.interfaces.nsIScriptableUnicodeConverter;
			const UConv = Components.classes[UConvID].getService(UConvIF);
			UConv.charset = 'Shift_JIS';
			var sjis_str = UConv.ConvertFromUnicode(this.memCache);
			XMigemoService.writeTo(file, sjis_str);
			return true;
		}
		else {
			return false;
		}
	},
  
	dummy : null 
};
  
var XMigemoDic = { 
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
		var dicDir = XMigemoService.getPref('xulmigemo.dicpath');

		const UConvID = '@mozilla.org/intl/scriptableunicodeconverter';
		const UConvIF = Components.interfaces.nsIScriptableUnicodeConverter;
		const UConv   = Components.classes[UConvID].getService(UConvIF);
		UConv.charset = 'Shift_JIS';


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
				var cache = XMigemoService.readFrom(file);
				var dicstr = UConv.ConvertToUnicode(cache);
				this.list[cList[i]] = dicstr;
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
				var cache = XMigemoService.readFrom(file);
				var dicstr = UConv.ConvertToUnicode(cache);
				this.list[cList[i] + '-user'] = dicstr;
			}
			else {
				this.list[cList[i] + '-user'] = '';
			}
		}

		this.initialized = true;

		return !error;
	},
 
	saveUserDic : function(aKey) 
	{
		if (!(aKey+'-user' in this.list)) return;

		var file;
		var dicDir = XMigemoService.getPref('xulmigemo.dicpath');
		if (!dicDir) return;

		const UConvID = '@mozilla.org/intl/scriptableunicodeconverter';
		const UConvIF = Components.interfaces.nsIScriptableUnicodeConverter;
		const UConv   = Components.classes[UConvID].getService(UConvIF);
		UConv.charset = 'Shift_JIS';

		file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		file.initWithPath(dicDir);
		file.append(aKey + 'a2.user.txt');
		var dicstr = UConv.ConvertFromUnicode(this.list[aKey+'-user'] || '');
		XMigemoService.writeTo(file, dicstr);
	},
  
	getDic : function(aLetter, aUser) 
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
 
	getUserDic : function(aLetter) 
	{
		return this.getDic(aLetter, true);
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

		var yomi = String(aTermSet.yomi);
		var term = String(aTermSet.term);
		if (!yomi || !XMigemoTextService.isYomi(yomi)) {
			return this.RESULT_ERROR_INVALID_YOMI;
		}

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
		XMigemoService.ObserverService.notifyObservers(window, 'XMigemo:dictionaryModified',
			[
				key,
				aOperation + '\t' + yomi + '\t' + term,
				entry
			].join('\n'));

		return this.RESULT_OK;
	},
	
	addTerm : function() 
	{
		if (arguments.length == 1 &&
			typeof arguments[0] == 'object') {
			return this.modifyDic(arguments[0], 'add');
		}
		else {
			return this.modifyDic(
				{
					yomi : String(arguments[0]),
					term : String(arguments[1])
				},
				'add'
			);
		}
	},
 
	removeTerm : function() 
	{
		if (arguments.length == 1 &&
			typeof arguments[0] == 'object') {
			return this.modifyDic(arguments[0], 'remove');
		}
		else {
			return this.modifyDic(
				{
					yomi : String(arguments[0]),
					term : String(arguments[1])
				},
				'remove'
			);
		}
	},
  
	sync : function(aWindow, aKey) 
	{
		this.list[aKey + '-user'] = aWindow.XMigemoDic.list[aKey + '-user'];
	},
 
	dummy : null 
};
  
var XMigemoDicManager = { 
	
	domain  : 'xulmigemo', // nsIPrefListener(?) 

 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'nsPref:changed':
				// nsIPrefListener(?)
				switch (aData)
				{
					case 'xulmigemo.dicpath':
						this.reload();
						break;

					case 'xulmigemo.ignoreHiraKata':
					case 'xulmigemo.splitTermsAutomatically':
						XMigemoCache.clearAll();
						break;
				}
				return;

			case 'XMigemo:dictionaryModified':
				if (aSubject != window) return;

				var test = aData.split('\n')[1].match(/(.+)\t(.+)\t(.*)/);
				var operation = RegExp.$1;
				var yomi = RegExp.$2;
				var term = RegExp.$3;

/*
				// 読みがアルファベットでない普通の辞書で、カナ文字のみの項目は、
				// そもそもキャッシュされないので、変更されてもキャッシュを再作成する必要がない？
				if (!/^[a-z0-9]+$/i.test(yomi) &&
					/^[\u3041-\u3093\u309b\u309c\u30fc]+$/.test(XMigemoTextService.kana2hira(term)))
					return;
*/

				XMigemoCache.clearCacheForAllPatterns(XMigemoTextService.hira2roman(yomi));
				return;

				return;

			case 'XMigemo:dictionaryReadyToLoad':
				if (aSubject != window) { // share dictionary and cache
					if (
						!aSubject.XMigemoDic.initialized &&
						window.XMigemoDic &&
						window.XMigemoDic.initialized
						) {
						aSubject.XMigemoDic   = window.XMigemoDic;
						aSubject.XMigemoCache = window.XMigemoCache;
					}
				}
				else { // initialize only for the first loading
					window.setTimeout('XMigemoDicManager.delayedInit();', 1);
				}
				return;
		}
	},
 
	reload : function() 
	{
		XMigemoDic.load();
		XMigemoCache.cacheFileHolder = null;
		XMigemoCache.load();
	},
 
	showDirectoryPicker : function(aDefault) 
	{
		var filePicker = Components.classes['@mozilla.org/filepicker;1'].createInstance(Components.interfaces.nsIFilePicker);

		var current = aDefault || XMigemoService.getPref('xulmigemo.dicpath');
		var displayDirectory = Components.classes['@mozilla.org/file/local;1'].createInstance();
		if (displayDirectory  instanceof Components.interfaces.nsILocalFile) {
			try {
				displayDirectory .initWithPath(current);
				filePicker.displayDirectory = displayDirectory;
			}
			catch(e) {
			}
		}

		filePicker.init(window, XMigemoService.strbundle.getString('dic.picker.title'), filePicker.modeGetFolder);

		if (filePicker.show() != filePicker.returnCancel) {
			return filePicker.file.path;
		}
		return null;
	},
 
	init : function() 
	{
		XMigemoService.addPrefListener(this);

		XMigemoService.ObserverService.addObserver(this, 'XMigemo:dictionaryModified', false);
		XMigemoService.ObserverService.addObserver(this, 'XMigemo:dictionaryReadyToLoad', false);

		XMigemoService.ObserverService.notifyObservers(window, 'XMigemo:dictionaryReadyToLoad', null);
	},
	
	delayedInit : function() 
	{
		if (XMigemoDic.initialized) return;

		if (
			(
				!XMigemoService.getPref('xulmigemo.dicpath') ||
				!XMigemoDic.load() ||
				!XMigemoCache.load()
			) &&
			XMigemoService.getPref('xulmigemo.dictionary.useInitializeWizard') &&
			!XMigemoService.WindowManager.getMostRecentWindow('xulmigemo:initializer')
			) {
			window.openDialog('chrome://xulmigemo/content/initializer/initializer.xul', 'xulmigemo:initializer', 'chrome,dialog,modal,centerscreen,dependent');
		}
	},
  
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

		XMigemoService.ObserverService.removeObserver(this, 'XMigemo:dictionaryModified');
		XMigemoService.ObserverService.removeObserver(this, 'XMigemo:dictionaryReadyToLoad');
	},
 
	dummy : null 
};
  
window.addEventListener('load', function() { 
	XMigemoDicManager.init();
}, false);
window.addEventListener('unload', function() {
	XMigemoDicManager.destroy();
}, false);
 
