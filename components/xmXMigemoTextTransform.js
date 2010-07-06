// for ASCII 
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
 
function xmXMigemoTextTransform() { 
	this.init();
}

xmXMigemoTextTransform.prototype = {
	classDescription : 'xmXMigemoTextTransform',
	contractID : '@piro.sakura.ne.jp/xmigemo/text-transform;1?lang=*',
	classID : Components.ID('{323b8fbe-1deb-11dc-8314-0800200c9a66}'),

	QueryInterface : XPCOMUtils.generateQI([
		Ci.xmIXMigemoTextTransform,
		Ci.pIXMigemoTextTransform
	]),

	get wrappedJSObject() {
		return this;
	},
	
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
 
	nonAsciiRegExp : /[^a-zA-Z0-9\!\_\-\?\/\\\~\|\{\}\(\)\'\"\&\%\$\<\>\[\]\@\`\+\*\;\:]/gi, 
 
	LATIN_LETTES_WITH_MODIFIERS : [ 
'a	[a\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5\u0101\u0103\u0105\u01ce\u01fb\u01df\u01e1\u00c0\u00c1\u00c2\u00c3\u00c4\u00c5\u0100\u0102\u0104\u01cd\u01fa\u01de\u01e0]|a([\u02cb`\u02ca\u00b4\u02c6\^\u02dc~\u00a8\u02da\u00b0\u02c9\u00af\u02d8\u02db\u02c7]|\u02da\u02ca|\u02ca\u02da|\u00a8[\u02c9\u00af]|[\u02c9\u00af]\u00a8|\u02d9[\u02c9\u00af]|[\u02c9\u00af]\u02d9)',
'ae	ae|[\u00e6\u01fd\u01e3\u00c6\u01fc\u01e2]|(ae|[\u00e6\u00c6])[\u02ca\u00b4\u02c9\u00af]',
'c	[c\u00e7\u0107\u0109\u010b\u010d\u00c7\u0106\u0108\u010a\u010c]|c[\u00b8\u02ca\u00b4\u02c6\^\u02d9\u02c7]',
'd	[d\u010f\u0111\u010e\u0110\u00d0]|d[\u02c7]',
'dz	dz|[\u01c4\u01c5\u01c6\u01f1\u01f2\u01f3]|(dz|\u01c5\u01c6)\u02c7',
'e	[e\u00e8\u00e9\u00ea\u00eb\u00c8\u00c9\u00ca\u00cb]|e[\u02cb`\u02ca\u00b4\u02c6\^\u00a8]',
'g	[g\u011d\u011f\u0121\u0123\u01f5\u01e5\u01e7\u011c\u011e\u0120\u0122\u01f4\u01e4\u01e6]|g[\u02c6\^\u02d8\u02d9\u00b8\u02ca\u00b4\-]',
'h	[h\u0127\u0125\u0124\u0126]|h[\-\u02c6\^]',
'i	[i\u00ec\u00ed\u00ee\u00ef\u0129\u012b\u012d\u012f\u0131\u01d0\u00cc\u00cd\u00ce\u00cf\u0128\u012a\u012c\u012e\u0130\u01cf]|i[\u02cb`\u02ca\u00b4\u02c6\^\u02dc~\u00a8\u02c9\u00af\u02d8\u02db\u02c7]',
'ij	ij|[\u0133\u0132]',
'j	[j\u0135\u01f0\u0134]|j[\u02c6\^\u02c7]',
'k	[k\u0137\u0138\u01e9\u0136\u01e8]|k[\u00b8\u02c7]',
'l	[l\u013a\u013c\u013e\u0140\u0142\u0139\u013b\u013d\u013f\u0141]|l[\u02ca\u00b4\u00b8\u02c7\u02d9\-]',
'lj	lj|[\u01c7\u01c8\u01c9]',
'n	[n\u0144\u0146\u0148\u0149\u00f1\u0143\u0145\u0147\u00d1]|n[\u02ca\u00b4\u00b8\u02d8\u02dc~\']',
'ng	ng|[\u014b\u014a]',
'nj	nj|[\u01cc\u01cb\u01ca]',
'o	[o\u00f2\u00f3\u00f4\u00f5\u00f6\u00f8\u01ff\u014d\u014f\u0151\u01d2\u01eb\u01ed\u00d2\u00d3\u00d4\u00d5\u00d6\u00d8\u01fe\u014c\u014e\u0150\u01d1\u01ea\u01ec]|o([\u02cb`\u02ca\u00b4\u02c6\^\u02dc~\u00a8/\u02c9\u00af\u02d8\u02dd\u02c7\u02db]|/[\u02ca\u00b4]|[\u02ca\u00b4]/|\u02db[\u02c9\u00af]|[\u02c9\u00af]\u02db)',
'oe	oe|[\u0153\u0152]',
'r	[r\u0155\u0157\u0159\u0154\u0156\u0158]|r[\u02ca\u00b4\u00b8\u02c7]',
's	[s\u015b\u015d\u015f\u0161\u015a\u015c\u015e\u0160]|s[\u02ca\u00b4\u02c6\^\u00b8\u02c7]',
'sz	sz|\u00df',
't	[t\u0163\u0165\u0167\u0162\u0164\u0166]|t[\u00b8\u02c7\-]',
'u	[u\u00f9\u00fa\u00fb\u00fc\u0169\u016b\u016d\u016f\u0171\u0173\u01d4\u01d6\u01d8\u01da\u01dc\u00d9\u00da\u00db\u00dc\u0168\u016a\u016c\u016e\u0170\u0172\u01d3\u01d5\u01d7\u01d9\u01db]|u([\u02cb`\u02ca\u00b4\u02c6\^\u02dc~\u00a8\u02da\u00b0\u02c9\u00af\u02d8\u02db\u02c7]|\u00a8[\u02c9\u00af]|[\u02c9\u00af]\u00a8|\u00a8[\u02ca\u00b4]|[\u02ca\u00b4]\u00a8|\u00a8\u02c7|\u02c7\u00a8|\u00a8[\u02cb`]|[\u02cb`]\u00a8)',
'w	[w\u1e81\u1e83\u1e85\u0175\u1e80\u1e82\u1e84\u0174]|w[\u02cb`\u02ca\u00b4\u00a8\u02c6\^]',
'y	[y\u1ef3\u00fd\u00ff\u0177\u1ef2\u00dd\u0178\u0176]|y[\u02cb`\u02ca\u00b4\u00a8\u02c6\^]',
'z	[z\u017a\u017c\u017e\u0179\u017b\u017d]|z[\u02ca\u00b4\u02d9\u02c7]'
	].join('\n'),
 
	init : function() 
	{
		var self = this;

		this.LATMOD      = [];
		this.LATMOD_Hash = {};
		this.LATPAT      = [];
		this.MODPAT      = [];

		var pairs = this.textUtils.trim(this.LATIN_LETTES_WITH_MODIFIERS).split(/\s+/);
		for (var i = 0, maxi = pairs.length; i < maxi; i += 2)
		{
			this.LATMOD.push({ key : pairs[i], char : pairs[i+1] });
			this.LATMOD_Hash[pairs[i]] = pairs[i+1];
			this.LATPAT.push({ key : pairs[i], char : pairs[i+1] });
			this.MODPAT.push(pairs[i+1]);
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
		var regexp = new RegExp();
		return String(aInput).replace(this.MODPAT, function(aChar) {
				for (var i in table)
				{
					regexp.compile('^('+table[i].char+')$', 'i')
					if (!regexp.test(aChar)) continue;
					aChar = table[i].key;
					break;
				}
				return aChar;
			});
	}
 
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([xmXMigemoTextTransform]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([xmXMigemoTextTransform]);
 
