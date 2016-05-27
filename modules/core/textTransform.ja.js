var EXPORTED_SYMBOLS = ['MigemoTextTransformJa'];

var DEBUG = false;
function log(...aArgs) 
{
	if (DEBUG ||
		Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.textTransform.ja')) {
		Services.console.logStringMessage('textTransform.ja: '+aArgs.join(', '));
		if (Services.prefs.getBoolPref('xulmigemo.debug.dump'))
			dump('textTransform.ja: '+aArgs.join(', ')+'\n');
	}
}

var TEST = false; 
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

Cu.import('resource://xulmigemo-modules/core/textUtils.js');
Cu.import('resource://xulmigemo-modules/core/textTransform.js');

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);

var MigemoTextTransformJa = {
	KATA_HIRA : 1 << 0,
	KANA_KATA : 1 << 1,
	KANA_ALL  : 1 << 2,

	lang : 'ja',
 
	// compatibility for MigemoTextTransform 
	isValidInput : function(aInput)
	{
		return this.isYomi(aInput);
	},

	normalizeInput : function(aInput)
	{
		return this.normalizeForYomi(aInput);
	},

	normalizeKeyInput : function(aInput)
	{
		return this.hira2roman(
				this.normalizeForYomi(
					this.kata2hira(aInput)
				)
			);
	},

	addLatinModifiers : function(aInput)
	{
		return MigemoTextTransform.addLatinModifiers(aInput);
	},

	removeLatinModifiers : function(aInput)
	{
		return MigemoTextTransform.removeLatinModifiers(aInput);
	},
 
	normalizeForYomi : function(aStr) 
	{
		return this.kata2hira(
				this.zenkaku2hankaku((aStr || '').toLowerCase())
			);
	},
 
	isYomi : function(aStr) 
	{
		aStr = aStr || '' ;
		var alph = this.zenkaku2hankaku(aStr.toLowerCase());
		if (/^[-a-z0-9]+$/i.test(alph))
			return true;

		return this.kata2hira(aStr).replace(/[\u3041-\u3093\u309b\u309c\u30fc]/g, '') ? false : true ;
	},
 
	init : function() 
	{
		var self = this;

		this.ROMKAN     = [];
		this.ROMKAN_Hash = {};
		this.ROMPAT     = [];

		this.KANROM     = [];
		this.KANROM_Hash = {};
		this.KANPAT     = [];

		var pairs = MigemoTextUtils.trim(this.CUSTOMTAB +'\t'+ this.KUNREITAB +'\t'+ this.HEPBURNTAB).split(/\s+/);
		var ROMKAN_Hash_multiple = {};
		for (var i = 0, maxi = pairs.length; i < maxi; i += 2)
		{
			this.ROMKAN.push({ key : pairs[i+1], char : pairs[i] });
			if (pairs[i+1] in this.ROMKAN_Hash) {
				if (this.ROMKAN_Hash[pairs[i+1]].indexOf(pairs[i]) < 0) {
					this.ROMKAN_Hash[pairs[i+1]] = this.ROMKAN_Hash[pairs[i+1]]+'|'+pairs[i];
					ROMKAN_Hash_multiple[pairs[i+1]] = true;
				}
			}
			else {
				this.ROMKAN_Hash[pairs[i+1]] = pairs[i];
			}
			this.ROMPAT.push({ key : pairs[i+1], char : pairs[i] });

			this.KANROM.push({ key : pairs[i], char : pairs[i+1] });
			this.KANROM_Hash[pairs[i]] = pairs[i+1];
			this.KANPAT.push({ key : pairs[i], char : pairs[i+1] });
		}
		for (var i in ROMKAN_Hash_multiple)
		{
			this.ROMKAN_Hash[i] = this.optimizeRegExp('('+this.ROMKAN_Hash[i]+')');
		}


		// Sort in long order so that a longer Romaji sequence precedes.
		this.ROMPAT = this.ROMPAT.sort(function(aA, aB) {
			return aB.key.length - aA.key.length;
		}).map(function(aItem) {
			return aItem.key;
		}).join('|');
		this.ROMINITIALPAT = this.ROMPAT.replace(
				/([^\|])[^\|]+(\||$)/g, '$1$2'
			).split('|');
		this.ROMINITIALPAT.sort();;
		this.ROMINITIALPAT = new RegExp(
			'['+
			this.ROMINITIALPAT.join('|').replace(
				/([^\|])(\|\1)+/g, '$1'
			).replace(/\|/g, '')+
			']',
			'i'
		);
		this.ROMPAT = new RegExp('('+this.ROMPAT+')', 'ig');

		this.KANPAT = this.KANPAT.sort(function(aA, aB) {
			return (aB.key.length - aA.key.length) ||
				(self.KANROM_Hash[aA.key].length - self.KANROM_Hash[aB.key].length);
		}).map(function(aItem) {
			return aItem.key;
		}).join('|');
		this.KANPAT = new RegExp('('+this.KANPAT+')', 'ig');

		this.KUNREI = this.KUNREITAB.split(/\s+/).filter(function(aItem, aIndex) {
			return (aIndex % 2 == 0);
		});
		this.HEPBURN = this.HEPBURNTAB.split(/\s+/).filter(function(aItem, aIndex) {
			return (aIndex % 2 == 0);
		});

//		this.KUNPAT; KUNREI.sort  {|a, b| b.length <=> a.length }.join "|"
//		this.HEPPAT; HEPBURN.sort {|a, b| b.length <=> a.length }.join "|"

		this.TO_HEPBURN_Hash = {};
		this.TO_HEPBURN = this.KUNREI.map(function(aItem, aIndex) {
			self.TO_HEPBURN_Hash[aItem] = self.HEPBURN[aIndex];
			return { key : aItem, char : self.HEPBURN[aIndex] };
		});
		this.TO_KUNREI_Hash = {};
		this.TO_KUNREI = this.HEPBURN.map(function(aItem, aIndex) {
			self.TO_KUNREI_Hash[aItem] = self.KUNREI[aIndex];
			return { key : aItem, char : self.KUNREI[aIndex] };
		});


		this.KATAHIRA_Hash = {};
		this.KATAPAT       = [];

		this.HIRAKATA_Hash     = {};
		this.HIRAKATA_ZEN_Hash = {};
		this.HIRAPAT           = [];

		pairs = this.KANATAB.replace(/^\s+|\s+$/g, '').split(/\s+/);
		var kata;
		for (i = 0, maxi = pairs.length; i < maxi; i += 2)
		{
			kata = pairs[i+1]
			kata.split('|').forEach(function(aKata, aIndex) {
				if (aKata == '-') return; // 例外
				self.KATAHIRA_Hash[aKata] = pairs[i];
				self.KATAPAT.push(aKata);
				if (aIndex == 0) {
					self.HIRAKATA_ZEN_Hash[pairs[i]] = aKata;
				}
			});
			this.HIRAKATA_Hash[pairs[i]] = '('+kata+')'
				.replace(/\((.)\|(.)\)/, '[$1$2]')
				.replace(/\((.)\|(.)\|(.)\)/, '[$1$2$3]');
			this.HIRAPAT.push(pairs[i]);
		}

		this.KATAPAT = new RegExp('('+this.KATAPAT.join('|')+')', 'ig');
		this.HIRAPAT = new RegExp('('+this.HIRAPAT.join('|')+')', 'ig');
	},
 
/* based on Ruby/Romkan ( http://0xcc.net/ruby-romkan/ ) */ 
	
	KUNREITAB : [ 
'\u3041	xa	\u3042	a	\u3043	xi	\u3044	i	\u3045	xu',
'\u3046	u	\u3046\u309b	vu	\u3046\u309b\u3041	va	\u3046\u309b\u3043	vi 	\u3046\u309b\u3047	ve',
'\u3046\u309b\u3049	vo	\u3047	xe	\u3048	e	\u3049	xo	\u304a	o ',

'\u304b	ka	\u304c	ga	\u304d	ki	\u304d\u3083	kya	\u304d\u3085	kyu ',
'\u304d\u3087	kyo	\u304e	gi	\u304e\u3083	gya	\u304e\u3085	gyu	\u304e\u3087	gyo ',
'\u304f	ku	\u3050	gu	\u3051	ke	\u3052	ge	\u3053	ko',
'\u3054	go ',

'\u3055	sa	\u3056	za	\u3057	si	\u3057\u3083	sya	\u3057\u3085	syu ',
'\u3057\u3087	syo	\u3058	zi	\u3058\u3083	zya	\u3058\u3085	zyu	\u3058\u3087	zyo ',
'\u3059	su	\u305a	zu	\u305b	se	\u305c	ze	\u305d	so',
'\u305e	zo ',

'\u305f	ta	\u3060	da	\u3061	ti	\u3061\u3083	tya	\u3061\u3085	tyu ',
'\u3061\u3087	tyo	\u3062	di	\u3062\u3083	dya	\u3062\u3085	dyu	\u3062\u3087	dyo ',

'\u3063	xtu ',
'\u3063\u3046\u309b	vvu	\u3063\u3046\u309b\u3041	vva	\u3063\u3046\u309b\u3043	vvi ',
'\u3063\u3046\u309b\u3047	vve	\u3063\u3046\u309b\u3049	vvo ',
'\u3063\u304b	kka	\u3063\u304c	gga	\u3063\u304d	kki	\u3063\u304d\u3083	kkya ',
'\u3063\u304d\u3085	kkyu	\u3063\u304d\u3087	kkyo	\u3063\u304e	ggi	\u3063\u304e\u3083	ggya ',
'\u3063\u304e\u3085	ggyu	\u3063\u304e\u3087	ggyo	\u3063\u304f	kku	\u3063\u3050	ggu ',
'\u3063\u3051	kke	\u3063\u3052	gge	\u3063\u3053	kko	\u3063\u3054	ggo	\u3063\u3055	ssa ',
'\u3063\u3056	zza	\u3063\u3057	ssi	\u3063\u3057\u3083	ssya ',
'\u3063\u3057\u3085	ssyu	\u3063\u3057\u3087	ssyo	\u3063\u3057\u3087	ssho ',
'\u3063\u3058	zzi	\u3063\u3058\u3083	zzya	\u3063\u3058\u3085	zzyu	\u3063\u3058\u3087	zzyo ',
'\u3063\u3059	ssu	\u3063\u305a	zzu	\u3063\u305b	sse	\u3063\u305c	zze	\u3063\u305d	sso ',
'\u3063\u305e	zzo	\u3063\u305f	tta	\u3063\u3060	dda	\u3063\u3061	tti ',
'\u3063\u3061\u3083	ttya	\u3063\u3061\u3085	ttyu	\u3063\u3061\u3087	ttyo	\u3063\u3062	ddi ',
'\u3063\u3062\u3083	ddya	\u3063\u3062\u3085	ddyu	\u3063\u3062\u3087	ddyo	\u3063\u3064	ttu ',
'\u3063\u3065	ddu	\u3063\u3066	tte	\u3063\u3067	dde	\u3063\u3068	tto	\u3063\u3069	ddo ',
'\u3063\u306f	hha	\u3063\u3070	bba	\u3063\u3071	ppa	\u3063\u3072	hhi ',
'\u3063\u3072\u3083	hhya	\u3063\u3072\u3085	hhyu	\u3063\u3072\u3087	hhyo	\u3063\u3073	bbi ',
'\u3063\u3073\u3083	bbya	\u3063\u3073\u3085	bbyu	\u3063\u3073\u3087	bbyo	\u3063\u3074	ppi ',
'\u3063\u3074\u3083	ppya	\u3063\u3074\u3085	ppyu	\u3063\u3074\u3087	ppyo	\u3063\u3075	hhu ',
'\u3063\u3075\u3041	ffa	\u3063\u3075\u3043	ffi	\u3063\u3075\u3047	ffe	\u3063\u3075\u3049	ffo ',
'\u3063\u3076	bbu	\u3063\u3077	ppu	\u3063\u3078	hhe	\u3063\u3079	bbe	\u3063\u307a    ppe',
'\u3063\u307b	hho	\u3063\u307c	bbo	\u3063\u307d	ppo	\u3063\u3084	yya	\u3063\u3086	yyu ',
'\u3063\u3088	yyo	\u3063\u3089	rra	\u3063\u308a	rri	\u3063\u308a\u3083	rrya ',
'\u3063\u308a\u3085	rryu	\u3063\u308a\u3087	rryo	\u3063\u308b	rru	\u3063\u308c	rre ',
'\u3063\u308d	rro ',

'\u3064	tu	\u3065	du	\u3066	te	\u3067	de	\u3068	to',
'\u3069	do ',

'\u306a	na	\u306b	ni	\u306b\u3083	nya	\u306b\u3085	nyu	\u306b\u3087	nyo ',
'\u306c	nu	\u306d	ne	\u306e	no ',

'\u306f	ha	\u3070	ba	\u3071	pa	\u3072	hi	\u3072\u3083	hya ',
'\u3072\u3085	hyu	\u3072\u3087	hyo	\u3073	bi	\u3073\u3083	bya	\u3073\u3085	byu ',
'\u3073\u3087	byo	\u3074	pi	\u3074\u3083	pya	\u3074\u3085	pyu	\u3074\u3087	pyo ',
'\u3075	hu	\u3075\u3041	fa	\u3075\u3043	fi	\u3075\u3047	fe	\u3075\u3049	fo ',
'\u3076	bu	\u3077	pu	\u3078	he	\u3079	be	\u307a	pe',
'\u307b	ho	\u307c	bo	\u307d	po ',

'\u307e	ma	\u307f	mi	\u307f\u3083	mya	\u307f\u3085	myu	\u307f\u3087	myo ',
'\u3080	mu	\u3081	me	\u3082	mo ',

'\u3083	xya	\u3084	ya	\u3085	xyu	\u3086	yu	\u3087	xyo',
'\u3088	yo',

'\u3089	ra	\u308a	ri	\u308a\u3083	rya	\u308a\u3085	ryu	\u308a\u3087	ryo ',
'\u308b	ru	\u308c	re	\u308d	ro ',

'\u308e	xwa	\u308f	wa	\u3090	wi	\u3091	we',
'\u3092	wo	\u3093	n ',

'\u3093     n\'',
'\u3067\u3043   dyi',
'\u30fc     -',
'\u3061\u3047    tye',
'\u3063\u3061\u3047	ttye',
'\u3058\u3047	zye'
	].join('\n'),
 
	HEPBURNTAB : [ 
'\u3041	xa	\u3042	a	\u3043	xi	\u3044	i	\u3045	xu',
'\u3046	u	\u3046\u309b	vu	\u3046\u309b\u3041	va	\u3046\u309b\u3043	vi	\u3046\u309b\u3047	ve',
'\u3046\u309b\u3049	vo	\u3047	xe	\u3048	e	\u3049	xo	\u304a	o',

'\u304b	ka	\u304c	ga	\u304d	ki	\u304d\u3083	kya	\u304d\u3085	kyu',
'\u304d\u3087	kyo	\u304e	gi	\u304e\u3083	gya	\u304e\u3085	gyu	\u304e\u3087	gyo',
'\u304f	ku	\u3050	gu	\u3051	ke	\u3052	ge	\u3053	ko',
'\u3054	go	',

'\u3055	sa	\u3056	za	\u3057	shi	\u3057\u3083	sha	\u3057\u3085	shu',
'\u3057\u3087	sho	\u3058	ji	\u3058\u3083	ja	\u3058\u3085	ju	\u3058\u3087	jo',
'\u3059	su	\u305a	zu	\u305b	se	\u305c	ze	\u305d	so',
'\u305e	zo',

'\u305f	ta	\u3060	da	\u3061	chi	\u3061\u3083	cha	\u3061\u3085	chu',
'\u3061\u3087	cho	\u3062	di	\u3062\u3083	dya	\u3062\u3085	dyu	\u3062\u3087	dyo',

'\u3063	xtsu	',
'\u3063\u3046\u309b	vvu	\u3063\u3046\u309b\u3041	vva	\u3063\u3046\u309b\u3043	vvi	',
'\u3063\u3046\u309b\u3047	vve	\u3063\u3046\u309b\u3049	vvo	',
'\u3063\u304b	kka	\u3063\u304c	gga	\u3063\u304d	kki	\u3063\u304d\u3083	kkya	',
'\u3063\u304d\u3085	kkyu	\u3063\u304d\u3087	kkyo	\u3063\u304e	ggi	\u3063\u304e\u3083	ggya	',
'\u3063\u304e\u3085	ggyu	\u3063\u304e\u3087	ggyo	\u3063\u304f	kku	\u3063\u3050	ggu	',
'\u3063\u3051	kke	\u3063\u3052	gge	\u3063\u3053	kko	\u3063\u3054	ggo	\u3063\u3055	ssa',
'\u3063\u3056	zza	\u3063\u3057	sshi	\u3063\u3057\u3083	ssha	',
'\u3063\u3057\u3085	sshu	\u3063\u3057\u3087	ssho	',
'\u3063\u3058	jji	\u3063\u3058\u3083	jja	\u3063\u3058\u3085	jju	\u3063\u3058\u3087	jjo	',
'\u3063\u3059	ssu	\u3063\u305a	zzu	\u3063\u305b	sse	\u3063\u305c	zze	\u3063\u305d	sso',
'\u3063\u305e	zzo	\u3063\u305f	tta	\u3063\u3060	dda	\u3063\u3061	cchi	',
'\u3063\u3061\u3083	ccha	\u3063\u3061\u3085	cchu	\u3063\u3061\u3087	ccho	\u3063\u3062	ddi	',
'\u3063\u3062\u3083	ddya	\u3063\u3062\u3085	ddyu	\u3063\u3062\u3087	ddyo	\u3063\u3064	ttsu	',
'\u3063\u3065	ddu	\u3063\u3066	tte	\u3063\u3067	dde	\u3063\u3068	tto	\u3063\u3069	ddo',
'\u3063\u306f	hha	\u3063\u3070	bba	\u3063\u3071	ppa	\u3063\u3072	hhi	',
'\u3063\u3072\u3083	hhya	\u3063\u3072\u3085	hhyu	\u3063\u3072\u3087	hhyo	\u3063\u3073	bbi	',
'\u3063\u3073\u3083	bbya	\u3063\u3073\u3085	bbyu	\u3063\u3073\u3087	bbyo	\u3063\u3074	ppi	',
'\u3063\u3074\u3083	ppya	\u3063\u3074\u3085	ppyu	\u3063\u3074\u3087	ppyo	\u3063\u3075	ffu	',
'\u3063\u3075\u3041	ffa	\u3063\u3075\u3043	ffi	\u3063\u3075\u3047	ffe	\u3063\u3075\u3049	ffo	',
'\u3063\u3076	bbu	\u3063\u3077	ppu	\u3063\u3078	hhe	\u3063\u3079	bbe	\u3063\u307a	ppe',
'\u3063\u307b	hho	\u3063\u307c	bbo	\u3063\u307d	ppo	\u3063\u3084	yya	\u3063\u3086	yyu',
'\u3063\u3088	yyo	\u3063\u3089	rra	\u3063\u308a	rri	\u3063\u308a\u3083	rrya	',
'\u3063\u308a\u3085	rryu	\u3063\u308a\u3087	rryo	\u3063\u308b	rru	\u3063\u308c	rre	',
'\u3063\u308d	rro	',

'\u3064	tsu	\u3065	du	\u3066	te	\u3067	de	\u3068	to',
'\u3069	do	',

'\u306a	na	\u306b	ni	\u306b\u3083	nya	\u306b\u3085	nyu	\u306b\u3087	nyo',
'\u306c	nu	\u306d	ne	\u306e	no	',

'\u306f	ha	\u3070	ba	\u3071	pa	\u3072	hi	\u3072\u3083	hya',
'\u3072\u3085	hyu	\u3072\u3087	hyo	\u3073	bi	\u3073\u3083	bya	\u3073\u3085	byu',
'\u3073\u3087	byo	\u3074	pi	\u3074\u3083	pya	\u3074\u3085	pyu	\u3074\u3087	pyo',
'\u3075	fu	\u3075\u3041	fa	\u3075\u3043	fi	\u3075\u3047	fe	\u3075\u3049	fo',
'\u3076	bu	\u3077	pu	\u3078	he	\u3079	be	\u307a	pe',
'\u307b	ho	\u307c	bo	\u307d	po	',

'\u307e	ma	\u307f	mi	\u307f\u3083	mya	\u307f\u3085	myu	\u307f\u3087	myo',
'\u3080	mu	\u3081	me	\u3082	mo',

'\u3083	xya	\u3084	ya	\u3085	xyu	\u3086	yu	\u3087	xyo',
'\u3088	yo	',

'\u3089	ra	\u308a	ri	\u308a\u3083	rya	\u308a\u3085	ryu	\u308a\u3087	ryo',
'\u308b	ru	\u308c	re	\u308d	ro	',

'\u308e	xwa	\u308f	wa	\u3090	wi	\u3091	we',
'\u3092	wo	\u3093	n	',

'\u3093     n\'',
'\u3067\u3043   dyi',
'\u30fc     -',
'\u3061\u3047    che',
'\u3063\u3061\u3047	cche',
'\u3058\u3047	je'
	].join('\n'),
 
	CUSTOMTAB : [ 
'\u3046\u3043	wi',
'\u3046\u3047	we',
'\u3060	dha	\u3063\u3067\u3083	ddha',
'\u3066\u3083	tha	\u3063\u3066\u3083	ttha',
'\u3066\u3043	thi	\u3063\u3066\u3043	tthi',
'\u3066\u3085	thu	\u3063\u3066\u3085	tthu',
'\u3066\u3047	the	\u3063\u3066\u3047	tthe',
'\u3066\u3087	tho	\u3063\u3066\u3087	ttho',
'\u3067\u3043	dhi	\u3063\u3067\u3043	ddhi',
'\u3067\u3085	dhu	\u3063\u3067\u3085	ddhu',
'\u3067\u3047	dhe	\u3063\u3067\u3047	ddhe',
'\u3067\u3087	dho	\u3063\u3067\u3087	ddho',
'\u3069\u3045	dwu	\u3063\u3069\u3045	ddwu',
'\u3061\u3083	cya	\u3063\u3061\u3083	ccya',
'\u3061\u3043	cyi	\u3063\u3061\u3043	ccyi',
'\u3061\u3085	cyu	\u3063\u3061\u3085	ccyu',
'\u3061\u3047	cye	\u3063\u3061\u3047	ccye',
'\u3061\u3087	cyo	\u3063\u3061\u3087	ccyo',
'\u3075\u3083	fya	\u3063\u3075\u3083	ffya',
'\u3075\u3043	fyi	\u3063\u3075\u3043	ffyi',
'\u3075\u3085	fyu	\u3063\u3075\u3085	ffyu',
'\u3075\u3047	fye	\u3063\u3075\u3047	ffye',
'\u3075\u3087	fyo	\u3063\u3075\u3087	ffyo',
'\u3050\u3041	gwa	\u3063\u3050\u3041	ggwa',
'\u3058\u3083	jya	\u3063\u3058\u3083	jjya',
'\u3058\u3043	jyi	\u3063\u3058\u3043	jjyi',
'\u3058\u3085	jyu	\u3063\u3058\u3085	jjyu',
'\u3058\u3047	jye	\u3063\u3058\u3047	jjye',
'\u3058\u3087	jyo	\u3063\u3058\u3087	jjyo',
'\u3041	la	\u3063\u3041	lla',
'\u3043	li	\u3063\u3043	lli',
'\u3045	lu	\u3063\u3045	llu',
'\u3047	le	\u3063\u3047	lle',
'\u3049	lo	\u3063\u3049	llo',
'\u3083	lya	\u3063\u3083	llya',
'\u3043	lyi	\u3063\u3043	llyi',
'\u3085	lyu	\u3063\u3085	llyu',
'\u3047	lye	\u3063\u3047	llye',
'\u3087	lyo	\u3063\u3087	llyo',
'\u308e	lwa	\u3063\u308e	llwa',
'\u30f5	lka	\u3063\u30f5	llka',
'\u30f6	lke	\u3063\u30f6	llke',
'\u3063	ltu	\u3063\u3063	lltu',
'\u3063	ltsu	\u3063\u3063	lltsu',
'\u3064\u3041	tsa	\u3063\u3064\u3041	ttsa',
'\u3064\u3043	tsi	\u3063\u3064\u3043	ttsi',
'\u3064\u3047	tse	\u3063\u3064\u3047	ttse',
'\u3064\u3049	tso	\u3063\u3064\u3049	ttso',
'\u3068\u3045	twu	\u3063\u3068\u3045	ttwu',
'\u3090	wyi	\u3063\u3090	wwyi',
'\u3091	wye	\u3063\u3091	wwye',
'\u30f5	xka	\u3063\u30f5	xxka',
'\u30f6	xke	\u3063\u30f6	xxke',
'\u3043	xyi	\u3063\u3043	xxyi',
'\u3047	xye	\u3063\u3047	xxye',
'\u3063\u308f	wwa',
'\u3063\u3046\u3043	wwi',
'\u3063\u3046	wwu',
'\u3063\u3046\u3047	wwe',
'\u3063\u3092	wwo'
	].join('\n'),
 
	/*
		FIXME: ad hod solution
		tanni   => tan'i
		kannji  => kanji
		hannnou => han'nou
		hannnya => han'nya
	*/
	normalize_double_n : function(aString) 
	{
		return String(aString)
			.toLowerCase()
			.replace(/nn/i, 'n\'')
			.replace(/n\'(?=[^aiueoyn]|$)/, 'n');
	},
 
	/*
		Romaji -> Kana
		It can handle both Hepburn and Kunrei sequences.
	*/
	roman2kana : function(aString) 
	{
		return this.roman2kana2(aString, this.KANA_HIRA);
	},
	
	roman2kana2 : function(aString, aKana) 
	{
		var self = this;
		var hash = this.ROMKAN_Hash;
		var func = (aKana == this.KANA_ALL) ?
					function(aChar) {
						var str = hash[aChar];
						if (str.charAt(0) == '[')
							str = '('+(str.substring(1, str.length-1).split('').join('|'))+')';
						var result = '';
						var char;
						while (str.length > 0)
						{
							if (str.indexOf('\u3046\u309b') == 0) { // 「う゛」だけは特例で一文字扱い
								char = str.substring(0, 2);
								str  = str.substring(1);
							}
							else {
								char = str.charAt(0);
							}
							if (/[\(\)\|]/.test(char)) {
								result += char;
							}
							else {
								result += (
										'('+
										char+'|'+
										self.hira2kataPattern(char).replace(/^\(|\)$/g, '')+
										')'
									).replace(/(.)\|\1/g, '$1');
							}
							str = str.substring(1);
						}
						return self.optimizeRegExp(result);
					} :
					(aKana == this.KANA_KATA) ?
					function(aChar) {
						return self.hira2kataPattern(hash[aChar]);
					} :
					function(aChar) {
						return hash[aChar];
					};
		var ret = this.optimizeRegExp(
				this.normalize_double_n(
						String(aString).toLowerCase()
					)
					.replace(this.ROMPAT, func)
			);
//dump(aString+' -> '+encodeURIComponent(ret)+'\n');
		return ret;
	},
  
	/*
		Kana -> Romaji.
		Return Hepburn sequences.
	*/
	hira2roman : function(aString) 
	{
		var self = this;
		return String(aString).toLowerCase()
			.replace(this.KANPAT, function(aChar) {
				return self.KANROM_Hash[aChar];
			})
			.replace(/n\'(?=[^aeiuoyn]|$)/, 'n');
	},
 
	/*
		Romaji -> Romaji
		Normalize into Hepburn sequences.
		e.g. kannzi -> kanji, tiezo -> chiezo
	*/
	to_hepburn : function(aString) 
	{
/*
		return this.normalize_double_n(String(aString).toLowerCase())
			.replace(/\G((?:#{HEPPAT})*?)(#{KUNPAT})/, function(aChar) {
				return $1 + TO_HEPBURN[$2];
			});
*/
	},
 
	/*
		Romaji -> Romaji
		Normalize into Kunrei sequences.
		e.g. kanji -> kanzi, chiezo -> tiezo
	*/
	to_kunrei : function(aString) 
	{
/*
		return this.normalize_double_n(String(aString).toLowerCase())
			.replace(/\G((?:#{KUNPAT})*?)(#{HEPPAT})/, function(aChar) {
				return $1 + TO_KUNREI[$2];
			});
*/
	},
 
	expand : function(aString) 
	{
		return this.expand2(aString, this.KANA_HIRA);
	},
	
	expand2 : function(aString, aKana) 
	{
		var target = aString.match(/[-a-z]+$/i);
		if (!target) return aString;

		if (!((this.ROMINITIALPAT).test(target))) {
			return aString;
		}

		var base   = aString.replace(/[-a-z]+$/i, '');

		var regexp = new RegExp('^'+target+'.*$', 'i');
		var checked = {};
		var entries = this.ROMKAN.filter(function(aItem) {
				var ret = regexp.test(aItem.key) && !(aItem.key in checked);
				checked[aItem.key] = true;
				return ret;
			});

		if (!entries.length) return aString;

		var last = entries.map(function(aItem) {
				return this.roman2kana2(aItem.key, aKana);
			}, this);
		last = (last.length > 1) ? '('+last.join('|')+')' : last[0] ;

		return base + this.optimizeRegExp(last);
	},
  
	optimizeRegExp : function(aString) 
	{
		var ret = aString
			.replace(/([^\\]|^)\|\|+/g, '$1|')
			.replace(/([^\\]|^)\(\|/g, '$1\(').replace(/([^\\]|^)\|\)/g, '$1\)')
			.replace(/([^\\]|^)\(\)/g, '$1\)')
			.replace(/([^\\]|^)\(([^()\[\]|]*[^()\[\]|\\])\)/g, '$1$2')
			.replace(/([^\\]|^)\[([^()\[\]|\\])\]/g, '$1$2')
			.replace(/\([^()\[\]|](\|[^()\[\]|])+\)/g, function(aString) {
				return '['+(aString.substring(1, aString.length-1).split('|').join(''))+']';
			});
		return ret;
	},
  
/* hiragana, katakana */ 
	
	KANATAB : [ 
'\u3046\u309b	\u30f4|\uff73\uff9e',

'\u3042	\u30a2|\uff71',
'\u3044	\u30a4|\uff72',
'\u3046	\u30a6|\uff73',
'\u3048	\u30a8|\uff74',
'\u304a	\u30aa|\uff75',

'\u3041	\u30a1|\uff67',
'\u3043	\u30a3|\uff68',
'\u3045	\u30a5|\uff69',
'\u3047	\u30a7|\uff6a',
'\u3049	\u30a9|\uff6b',

'\u3083	\u30e3|\uff6c',
'\u3085	\u30e5|\uff6d',
'\u3087	\u30e7|\uff6e',

'\u304b	\u30ab|\uff76',
'\u304d	\u30ad|\uff77',
'\u304f	\u30af|\uff78',
'\u3051	\u30b1|\uff79',
'\u3053	\u30b3|\uff7a',

'\u3055	\u30b5|\uff7b',
'\u3057	\u30b7|\uff7c',
'\u3059	\u30b9|\uff7d',
'\u305b	\u30bb|\uff7e',
'\u305d	\u30bd|\uff7f',

'\u305f	\u30bf|\uff80',
'\u3061	\u30c1|\uff81',
'\u3064	\u30c4|\uff82',
'\u3066	\u30c6|\uff83',
'\u3068	\u30c8|\uff84',

'\u306a	\u30ca|\uff85',
'\u306b	\u30cb|\uff86',
'\u306c	\u30cc|\uff87',
'\u306d	\u30cd|\uff88',
'\u306e	\u30ce|\uff89',

'\u306f	\u30cf|\uff8a',
'\u3072	\u30d2|\uff8b',
'\u3075	\u30d5|\uff8c',
'\u3078	\u30d8|\uff8d',
'\u307b	\u30db|\uff8e',

'\u307e	\u30de|\uff8f',
'\u307f	\u30df|\uff90',
'\u3080	\u30e0|\uff91',
'\u3081	\u30e1|\uff92',
'\u3082	\u30e2|\uff93',

'\u3084	\u30e4|\uff94',
'\u3086	\u30e6|\uff95',
'\u3088	\u30e8|\uff96',

'\u3089	\u30e9|\uff97',
'\u308a	\u30ea|\uff98',
'\u308b	\u30eb|\uff99',
'\u308c	\u30ec|\uff9a',
'\u308d	\u30ed|\uff9b',

'\u308f	\u30ef|\uff9c',
'\u3090	\u30f0|\u30f0',
'\u3091	\u30f1|\u30f1',
'\u3092	\u30f2|\uff66',
'\u3093	\u30f3|\uff9d',

'\u304c	\u30ac|\uff76\uff9e',
'\u304e	\u30ae|\uff77\uff9e',
'\u3050	\u30b0|\uff78\uff9e',
'\u3052	\u30b2|\uff79\uff9e',
'\u3054	\u30b4|\uff7a\uff9e',

'\u3056	\u30b6|\uff7b\uff9e',
'\u3058	\u30b8|\uff7c\uff9e',
'\u305a	\u30ba|\uff7d\uff9e',
'\u305c	\u30bc|\uff7e\uff9e',
'\u305e	\u30be|\uff7f\uff9e',


'\u3060	\u30c0|\uff80\uff9e',
'\u3062	\u30c2|\uff81\uff9e',
'\u3065	\u30c5|\uff82\uff9e',
'\u3067	\u30c7|\uff83\uff9e',
'\u3069	\u30c9|\uff84\uff9e',

'\u3070	\u30d0|\uff8a\uff9e',
'\u3073	\u30d3|\uff8b\uff9e',
'\u3076	\u30d6|\uff8c\uff9e',
'\u3079	\u30d9|\uff8d\uff9e',
'\u307c	\u30dc|\uff8e\uff9e',


'\u3071	\u30d1|\uff8a\uff9f',
'\u3074	\u30d4|\uff8b\uff9f',
'\u3077	\u30d7|\uff8c\uff9f',
'\u307a	\u30da|\uff8d\uff9f',
'\u307d	\u30dd|\uff8e\uff9f',

'\u30fc	\u30fc|\uff70|-',
'\u3002	\u3002|\uff61',
'\u3001	\u3001|\uff64',

'\u3063	\u30c3|\uff6f'
	].join('\n'),
 
	hira2kata : function(aString) 
	{
		var hash = this.HIRAKATA_ZEN_Hash;
		return this.joinVoiceMarks(String(aString))
			.replace(this.HIRAPAT, function(aChar) {
				return hash[aChar];
			});
	},
 
	hira2kataPattern : function(aString) 
	{
		var hash = this.HIRAKATA_Hash;
		return this.joinVoiceMarks(String(aString))
			.replace(this.HIRAPAT, function(aChar) {
				return hash[aChar];
			});
	},
 
	kata2hira : function(aString) 
	{
		var hash = this.KATAHIRA_Hash;
		return this.joinVoiceMarks(String(aString))
			.replace(this.KATAPAT, function(aChar) {
				return hash[aChar];
			});
	},
 
	roman2zen : function(aStr) 
	{
		var output='';	//the result string
		var c;	//iterates for each of characters in the input
		var n;	//character code (unicode)
		for(var i=0; i<aStr.length;i++)
		{
			c = aStr.charAt(i);
			n = c.charCodeAt(0);  //      0xff01-0xff5e
			if((n>=0x21) && (n<=0x7e))
			{
				c = String.fromCharCode(n+0xfee0);
			}
			output += c;
		}
		return output;
	},
 
	zenkaku2hankaku : function(aStr) 
	{
		return aStr.replace(/[\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]/g, this.zenkaku2hankakuSub);
	},
	
	zenkaku2hankakuSub : function(aStr) 
	{
		var code = aStr.charCodeAt(0);
		return String.fromCharCode(code - 0xfee0)
	},
  
	joinVoiceMarks : function(aStr) 
	{
		return (aStr || '').replace(/[\u304b\u304d\u304f\u3051\u3053\u3055\u3057\u3059\u305b\u305d\u305f\u3061\u3064\u3066\u3068\u306f\u3072\u3075\u3078\u307b\u30a6\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30cf\u30d2\u30d5\u30d8\u30db\uff73\uff76-\uff84\uff8a-\uff8e][\uff9e\u309b]|[\u306f\u3072\u3075\u3078\u307b\u30cf\u30d2\u30d5\u30d8\u30db\uff8a-\uff8e][\uff9f\u309c]/g, this.joinVoiceMarksSub);
	},
	
	joinVoiceMarksSub : function(aStr) 
	{
		var code = aStr.charCodeAt(0);

		// 全角かな
		if (/^[\u304b\u304d\u304f\u3051\u3053\u3055\u3057\u3059\u305b\u305d\u305f\u3061\u3064\u3066\u3068\u306f\u3072\u3075\u3078\u307b\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30cf\u30d2\u30d5\u30d8\u30db][\uff9e\u309b]/.test(aStr)) {
			return String.fromCharCode(code+1);
		}
		else if (/^[\u306f\u3072\u3075\u3078\u307b\u30cf\u30d2\u30d5\u30d8\u30db][\uff9f\u309c]/.test(aStr)) {
			return String.fromCharCode(code+2);
		}
		else if (/^[\u30a6\uff73]/.test(aStr)) { // 全角・半角のヴ
			return '\u30f4';
		}
		else { // 半角カナ
			switch (aStr)
			{
				case '\uff76\uff9e': return '\u30ac';
				case '\uff77\uff9e': return '\u30ae';
				case '\uff78\uff9e': return '\u30b0';
				case '\uff79\uff9e': return '\u30b2';
				case '\uff7a\uff9e': return '\u30b4';

				case '\uff7b\uff9e': return '\u30b6';
				case '\uff7c\uff9e': return '\u30b8';
				case '\uff7d\uff9e': return '\u30ba';
				case '\uff7e\uff9e': return '\u30bc';
				case '\uff7f\uff9e': return '\u30be';

				case '\uff80\uff9e': return '\u30c0';
				case '\uff81\uff9e': return '\u30c2';
				case '\uff82\uff9e': return '\u30c5';
				case '\uff83\uff9e': return '\u30c7';
				case '\uff84\uff9e': return '\u30c9';

				case '\uff8a\uff9e': return '\u30d0';
				case '\uff8b\uff9e': return '\u30d3';
				case '\uff8c\uff9e': return '\u30d6';
				case '\uff8d\uff9e': return '\u30d9';
				case '\uff8e\uff9e': return '\u30dc';

				case '\uff8a\uff9f': return '\u30d1';
				case '\uff8b\uff9f': return '\u30d4';
				case '\uff8c\uff9f': return '\u30d7';
				case '\uff8d\uff9f': return '\u30da';
				case '\uff8e\uff9f': return '\u30dd';
			}
		}
	}
   
}; 

MigemoTextTransformJa.init();
