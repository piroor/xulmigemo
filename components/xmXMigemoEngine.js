/* This depends on: 
	xmIXMigemoDictionary
	xmIXMigemoTextTransform
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm'); 

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);

const xmIXMigemoEngine = Ci.xmIXMigemoEngine;
 
function xmXMigemoEngine() { 
	mydump('create instance xmIXMigemoEngine(lang=*)');
}

xmXMigemoEngine.prototype = {
	lang : '',

	classDescription : 'xmXMigemoEngine',
	contractID : '@piro.sakura.ne.jp/xmigemo/engine;1?lang=*',
	classID : Components.ID('{706170f0-36fb-11dc-8314-0800200c9a66}'),

	QueryInterface : XPCOMUtils.generateQI([
		xmIXMigemoEngine,
		Ci.xmIXMigemoEngineUniversal,
		Ci.pIXMigemoEngine,
		Ci.pIXMigemoEngineUniversal,
		Ci.nsIObserver
	]),

	get wrappedJSObject() {
		return this;
	},
	
	SYSTEM_DIC : xmIXMigemoEngine.SYSTEM_DIC, 
	USER_DIC   : xmIXMigemoEngine.USER_DIC,
	ALL_DIC    : xmIXMigemoEngine.ALL_DIC,
 
	get dictionary() 
	{
		if (!this._dictionary && this.lang) {
			var constructor;
			if (TEST) {
				eval('constructor = xmXMigemoDictionary'+
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
						.getService(Ci.xmIXMigemoDictionary);
				}
				else {
					this._dictionary = Cc['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang=*']
						.createInstance(Ci.xmIXMigemoDictionary)
						.QueryInterface(Ci.xmIXMigemoDictionaryUniversal);
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
 
	getRegExpFor : function(aInput, aTargetDic) 
	{
		if (!aInput || !this.lang) return null;

		aInput = aInput.toLowerCase();

		mydump('noCache');
		var str = this.textUtils.sanitize(aInput);

		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			str = this.textTransform.addLatinModifiers(str);

		var lines = this.gatherEntriesFor(aInput, this.ALL_DIC, aTargetDic);

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
		else { // 辞書に引っかからなかった模様なので自前の文字列だけ
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
		aTargetDic = aTargetDic || this.ALL_DIC;

		var str = this.textUtils.sanitize(aInput);
		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			str = this.textTransform.addLatinModifiers(str);

		var tmp = '^(' + str + ').+$';
		var exp = new RegExp(tmp, 'img');

		var lines = [];

		const XMigemoDic = this.dictionary;

		var mydicU = (aTargetDic & this.USER_DIC) ? XMigemoDic.getUserDic() : null ;
		var mydic  = (aTargetDic & this.SYSTEM_DIC) ? XMigemoDic.getDic() : null ;

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

		return lines;
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
	}
 
}; 
  
var NSGetFactory = XPCOMUtils.generateNSGetFactory([xmXMigemoEngine]); 
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 1024 ? aString.substring(0, 1024) : aString )+'\n');
}
 
