var EXPORTED_SYMBOLS = ['MigemoEngine'];

/* This depends on: 
	MigemoDictionary
	MigemoTextTransform
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm'); 
Components.utils.import('resource://xulmigemo-modules/lib/inherit.jsm');
Components.utils.import('resource://xulmigemo-modules/constants.jsm');

Components.utils.import('resource://xulmigemo-modules/core/textUtils.js');
Components.utils.import('resource://xulmigemo-modules/core/textTransform.js');
Components.utils.import('resource://xulmigemo-modules/core/dictionary.js');

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);

var MigemoEngine = inherit(MigemoConstants, {
	lang : '',

	textTransform : MigemoTextTransform,
	dictionary : MigemoDictionary,
 
	getRegExpFor : function(aInput, aTargetDic) 
	{
		if (!aInput || !this.lang) return null;

		aInput = aInput.toLowerCase();

		mydump('noCache');
		var str = MigemoTextUtils.sanitize(aInput);

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

			searchterm = MigemoTextUtils.sanitize(searchterm)
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
				.replace(new RegExp('([!"#\$%&\'\\(\\)=‾\\|\\`\\{\\+\\*\\}<>\\?_\\-\\^\\@\\[\\;\\:\\]\\/\\\\\\.,\uff61\uff64]+)', 'g'), '\t$1\t');

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

		var str = MigemoTextUtils.sanitize(aInput);
		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			str = this.textTransform.addLatinModifiers(str);

		var tmp = '^(' + str + ').+$';
		var exp = new RegExp(tmp, 'img');

		var lines = [];

		var mydicU = (aTargetDic & this.USER_DIC) ? this.dictionary.getUserDic() : null ;
		var mydic  = (aTargetDic & this.SYSTEM_DIC) ? this.dictionary.getDic() : null ;

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
 
}); 
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 1024 ? aString.substring(0, 1024) : aString )+'\n');
}
 
