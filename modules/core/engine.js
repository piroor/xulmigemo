var EXPORTED_SYMBOLS = ['MigemoEngine'];

/* This depends on: 
	MigemoDictionary
	MigemoTextTransform
*/
var DEBUG = false;
function log(...aArgs) 
{
	if (DEBUG ||
		Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.engine')) {
		Services.console.logStringMessage('engine: '+aArgs.join(', '));
		if (Services.prefs.getBoolPref('xulmigemo.debug.dump'))
			dump('engine: '+aArgs.join(', ')+'\n');
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
Cu.import('resource://xulmigemo-modules/core/dictionary.js');

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

		log('noCache');
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
			log('pattern:'+pattern);
		}
		else { // 辞書に引っかからなかった模様なので自前の文字列だけ
			pattern = str;
			log('pattern:'+pattern);
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
				log(' found '+lineU.length+' terms');
			}
		}
		if (mydic) {
			var line = mydic.match(exp);//アルファベットの辞書を検索
			if (line) {
				lines = lines.concat(line);
				log(' found '+line.length+' terms');
			}
		}

		return lines;
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
	}
 
}); 
