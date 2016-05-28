var EXPORTED_SYMBOLS = ['MigemoTextTransform'];

// for ASCII 
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

Cu.import('resource://xulmigemo-modules/core/textUtils.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('textTransform', ...aArgs); }
 
var MigemoTextTransform = {
	nonAsciiRegExp : /[^a-zA-Z0-9\!\_\-\?\/\\\~\|\{\}\(\)\'\"\&\%\$\<\>\[\]\@\`\+\*\;\:]/gi, 
 
	LATIN_LETTES_WITH_MODIFIERS : decodeURIComponent(escape(`
a	[aàáâãäåāăąǎǻǟǡÀÁÂÃÄÅĀĂĄǍǺǞǠ]
ae	ae|[æǽǣÆǼǢ]
c	[cçćĉċčÇĆĈĊČ]
d	[dďđĎĐÐ]
dz	dz|[ǄǅǆǱǲǳ]
e	[eèéêëÈÉÊË]
g	[gĝğġģǵǥǧĜĞĠĢǴǤǦ]
h	[hħĥĤĦ]
i	[iìíîïĩīĭįıǐÌÍÎÏĨĪĬĮİǏ]
ij	ij|[ĳĲ]
j	[jĵǰĴ]
k	[kķĸǩĶǨ]
l	[lĺļľŀłĹĻĽĿŁ]
lj	lj|[Ǉǈǉ]
n	[nńņňŉñŃŅŇÑ]
ng	ng|[ŋŊ]
nj	nj|[ǌǋǊ]
o	[oòóôõöøǿōŏőǒǫǭÒÓÔÕÖØǾŌŎŐǑǪǬ]
oe	oe|[œŒ]
r	[rŕŗřŔŖŘ]
s	[sśŝşšŚŜŞŠ]
sz	sz|ß
t	[tţťŧŢŤŦ]
u	[uùúûüũūŭůűųǔǖǘǚǜÙÚÛÜŨŪŬŮŰŲǓǕǗǙǛ]
w	[wẁẃẅŵẀẂẄŴ]
y	[yỳýÿŷỲÝŸŶ]
z	[zźżžŹŻŽ]
`)),

	LATIN_LETTES_WITH_MODIFIERS_LAZY : decodeURIComponent(escape(`
a	[aàáâãäåāăąǎǻǟǡÀÁÂÃÄÅĀĂĄǍǺǞǠ]|a([ˋ\`ˊ´ˆ^˜~¨˚°ˉ¯˘˛ˇ]|˚ˊ|ˊ˚|¨[ˉ¯]|[ˉ¯]¨|˙[ˉ¯]|[ˉ¯]˙)
ae	ae|[æǽǣÆǼǢ]|(ae|[æÆ])[ˊ´ˉ¯]
c	[cçćĉċčÇĆĈĊČ]|c[¸ˊ´ˆ^˙ˇ]
d	[dďđĎĐÐ]|d[ˇ]
dz	dz|[ǄǅǆǱǲǳ]|(dz|ǅǆ)ˇ
e	[eèéêëÈÉÊË]|e[ˋ\`ˊ´ˆ^¨]
g	[gĝğġģǵǥǧĜĞĠĢǴǤǦ]|g[ˆ^˘˙¸ˊ´-]
h	[hħĥĤĦ]|h[-ˆ^]
i	[iìíîïĩīĭįıǐÌÍÎÏĨĪĬĮİǏ]|i[ˋ\`ˊ´ˆ^˜~¨ˉ¯˘˛ˇ]
ij	ij|[ĳĲ]
j	[jĵǰĴ]|j[ˆ^ˇ]
k	[kķĸǩĶǨ]|k[¸ˇ]
l	[lĺļľŀłĹĻĽĿŁ]|l[ˊ´¸ˇ˙-]
lj	lj|[Ǉǈǉ]
n	[nńņňŉñŃŅŇÑ]|n[ˊ´¸˘˜~']
ng	ng|[ŋŊ]
nj	nj|[ǌǋǊ]
o	[oòóôõöøǿōŏőǒǫǭÒÓÔÕÖØǾŌŎŐǑǪǬ]|o([ˋ\`ˊ´ˆ^˜~¨/ˉ¯˘˝ˇ˛]|/[ˊ´]|[ˊ´]/|˛[ˉ¯]|[ˉ¯]˛)
oe	oe|[œŒ]
r	[rŕŗřŔŖŘ]|r[ˊ´¸ˇ]
s	[sśŝşšŚŜŞŠ]|s[ˊ´ˆ^¸ˇ]
sz	sz|ß
t	[tţťŧŢŤŦ]|t[¸ˇ-]
u	[uùúûüũūŭůűųǔǖǘǚǜÙÚÛÜŨŪŬŮŰŲǓǕǗǙǛ]|u([ˋ\`ˊ´ˆ^˜~¨˚°ˉ¯˘˛ˇ]|¨[ˉ¯]|[ˉ¯]¨|¨[ˊ´]|[ˊ´]¨|¨ˇ|ˇ¨|¨[ˋ\`]|[ˋ\`]¨)
w	[wẁẃẅŵẀẂẄŴ]|w[ˋ\`ˊ´¨ˆ^]
y	[yỳýÿŷỲÝŸŶ]|y[ˋ\`ˊ´¨ˆ^]
z	[zźżžŹŻŽ]|z[ˊ´˙ˇ]
`)),
 
	init : function() 
	{
		var self = this;

		this.LATMOD_Hash = {};
		this.LATPAT      = [];
		var strictPairs = MigemoTextUtils.trim(this.LATIN_LETTES_WITH_MODIFIERS).split(/\s+/);
		for (let i = 0, maxi = strictPairs.length; i < maxi; i += 2)
		{
			this.LATMOD_Hash[strictPairs[i]] = strictPairs[i+1];
			this.LATPAT.push({ key : strictPairs[i], char : strictPairs[i+1] });
		}

		this.LATMOD      = [];
		this.MODPAT      = [];
		var lazyPairs = MigemoTextUtils.trim(this.LATIN_LETTES_WITH_MODIFIERS_LAZY).split(/\s+/);
		for (let i = 0, maxi = lazyPairs.length; i < maxi; i += 2)
		{
			this.LATMOD.push({ key : lazyPairs[i], char : lazyPairs[i+1] });
			this.MODPAT.push(lazyPairs[i+1]);
		}

		this.LATPAT = this.LATPAT.sort(function(aA, aB) {
			return aB.key.length - aA.key.length;
		}).map(function(aItem) {
			return aItem.key;
		}).join('|');
		this.LATPAT = new RegExp('('+this.LATPAT+')', 'ig');

		this.MODPAT = this.MODPAT.sort(function(aA, aB) {
			return (aB.length - aA.length);
		}).join('|');
		this.MODPAT = new RegExp('('+this.MODPAT+')', 'ig');
	},
 
	isValidInput : function(aInput) 
	{
		return this.normalizeInput(aInput) ? true : false ;
	},
 
	normalizeInput : function(aInput) 
	{
		return aInput.replace(this.nonAsciiRegExp, '');
	},
 
	normalizeKeyInput : function(aInput) 
	{
		return aInput.replace(this.nonAsciiRegExp, '');
	},
 
	addLatinModifiers : function(aInput) 
	{
		var hash = this.LATMOD_Hash;
		return this.removeLatinModifiers(aInput)
			.replace(this.LATPAT, function(aChar) {
				return '('+hash[aChar]+')';
			});
	},
 
	removeLatinModifiers : function(aInput) 
	{
		var table = this.LATMOD;
		return String(aInput).replace(this.MODPAT, function(aChar) {
				for (var i in table)
				{
					regexp = new RegExp('^('+table[i].char+')$', 'i')
					if (!regexp.test(aChar)) continue;
					aChar = table[i].key;
					break;
				}
				return aChar;
			});
	}
 
};

MigemoTextTransform.init();
