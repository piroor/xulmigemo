var Prefs = Components 
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
function pXMigemoTextTransformJa() {} 

pXMigemoTextTransformJa.prototype = {
	lang : 'ja',

	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/text-transform;1?lang='+this.lang;
	},
	get classDescription() {
		return 'This is a text transformation service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{2d370a3e-cef4-11db-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	// pIXMigemoTextTransform 
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
		if (/^[a-z0-9]+$/i.test(alph))
			return true;

		return this.kata2hira(aStr).replace(/[\u3041-\u3093\u309b\u309c\u30fc]/g, '') ? false : true ;
	},
 
	init : function() 
	{
		var self = this;

		this._ROMKAN     = [];
		this._ROMKAN_Hash = {};
		this._ROMPAT     = [];

		this._KANROM     = [];
		this._KANROM_Hash = {};
		this._KANPAT     = [];

		var pairs = (this.KUNREITAB +'\t'+ this.HEPBURNTAB).replace(/^\s+|\s+$/g, '').split(/\s+/);
		for (var i = 0, maxi = pairs.length; i < maxi; i += 2)
		{
			this._ROMKAN.push({ key : pairs[i+1], char : pairs[i] });
			this._ROMKAN_Hash[pairs[i+1]] = pairs[i];
			this._ROMPAT.push({ key : pairs[i+1], char : pairs[i] });

			this._KANROM.push({ key : pairs[i], char : pairs[i+1] });
			this._KANROM_Hash[pairs[i]] = pairs[i+1];
			this._KANPAT.push({ key : pairs[i], char : pairs[i+1] });
		}

		// Sort in long order so that a longer Romaji sequence precedes.
		this._ROMPAT = this._ROMPAT.sort(function(aA, aB) {
			return aB.key.length - aA.key.length;
		}).map(function(aItem) {
			return aItem.key;
		}).join('|');
		this._ROMPAT = new RegExp('('+this._ROMPAT+')', 'ig');

		this._KANPAT = this._KANPAT.sort(function(aA, aB) {
			return (aB.key.length - aA.key.length) ||
				(self.KANROM_Hash[aA.key].length - self.KANROM_Hash[aB.key].length);
		}).map(function(aItem) {
			return aItem.key;
		}).join('|');
		this._KANPAT = new RegExp('('+this._KANPAT+')', 'ig');

		this._KUNREI = this.KUNREITAB.split(/\s+/).filter(function(aItem, aIndex) {
			return (aIndex % 2 == 0);
		});
		this._HEPBURN = this.HEPBURNTAB.split(/\s+/).filter(function(aItem, aIndex) {
			return (aIndex % 2 == 0);
		});

//		this._KUNPAT; KUNREI.sort  {|a, b| b.length <=> a.length }.join "|"
//		this._HEPPAT; HEPBURN.sort {|a, b| b.length <=> a.length }.join "|"

		this._TO_HEPBURN_Hash = {};
		this._TO_HEPBURN = this._KUNREI.map(function(aItem, aIndex) {
			self._TO_HEPBURN_Hash[aItem] = self._HEPBURN[aIndex];
			return { key : aItem, char : self._HEPBURN[aIndex] };
		});
		this._TO_KUNREI_Hash = {};
		this._TO_KUNREI = this._HEPBURN.map(function(aItem, aIndex) {
			self._TO_KUNREI_Hash[aItem] = self._KUNREI[aIndex];
			return { key : aItem, char : self._KUNREI[aIndex] };
		});


		this._KATAHIRA_Hash = {};
		this._KATAPAT       = [];

		this._HIRAKATA_Hash     = {};
		this._HIRAKATA_ZEN_Hash = {};
		this._HIRAPAT           = [];

		pairs = this.KANATAB.replace(/^\s+|\s+$/g, '').split(/\s+/);
		var kata;
		for (i = 0, maxi = pairs.length; i < maxi; i += 2)
		{
			kata = pairs[i+1]
			kata.split('|').forEach(function(aKata, aIndex) {
				self._KATAHIRA_Hash[aKata] = pairs[i];
				self._KATAPAT.push(aKata);
				if (aIndex == 0) {
					self._HIRAKATA_ZEN_Hash[pairs[i]] = aKata;
				}
				else {
					kata = '('+kata+')'.replace(/\((\.)\|(\.)\)/, '[$1$2]');
				}
			});

			this._HIRAKATA_Hash[pairs[i]] = kata;
			this._HIRAPAT.push(pairs[i]);
		}

		this._KATAPAT = new RegExp('('+this._KATAPAT.join('|')+')', 'ig');
		this._HIRAPAT = new RegExp('('+this._HIRAPAT.join('|')+')', 'ig');
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
'\u3063\u3057\u3085	ssyu	\u3063\u3057\u3087	ssho ',
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
'\u30fc     \\-',
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
'\u30fc     \\-',
'\u3061\u3047    che',
'\u3063\u3061\u3047	cche',
'\u3058\u3047	je'
	].join('\n'),
 
	get ROMKAN() 
	{
		if (!this._ROMKAN) {
			this.init();
		}
		return this._ROMKAN;
	},
	
	get ROMKAN_Hash() 
	{
		if (!this._ROMKAN_Hash) {
			this.init();
		}
		return this._ROMKAN_Hash;
	},
 
	get ROMPAT() 
	{
		if (!this._ROMPAT) {
			this.init();
		}
		return this._ROMPAT;
	},
  
	get KANROM() 
	{
		if (!this._KANROM) {
			this.init();
		}
		return this._KANROM;
	},
	
	get KANROM_Hash() 
	{
		if (!this._KANROM_Hash) {
			this.init();
		}
		return this._KANROM_Hash;
	},
 
	get KANPAT() 
	{
		if (!this._KANPAT) {
			this.init();
		}
		return this._KANPAT;
	},
  
	get KUNREI() 
	{
		if (!this._KUNREI) {
			this.init();
		}
		return this._KUNREI;
	},
	
	get KUNPAT() 
	{
		if (!this._KUNPAT) {
			this.init();
		}
		return this._KUNPAT;
	},
 
	get TO_KUNREI() 
	{
		if (!this._TO_KUNREI) {
			this.init();
		}
		return this._TO_KUNREI;
	},
 
	get TO_KUNREI_Hash() 
	{
		if (!this._TO_KUNREI_Hash) {
			this.init();
		}
		return this._TO_KUNREI_Hash;
	},
  
	get HEPBURN() 
	{
		if (!this._HEPBURN) {
			this.init();
		}
		return this._HEPBURN;
	},
	
	get HEPPAT() 
	{
		if (!this._HEPPAT) {
			this.init();
		}
		return this._HEPPAT;
	},
 
	get TO_HEPBURN() 
	{
		if (!this._TO_HEPBURN) {
			this.init();
		}
		return this._TO_HEPBURN;
	},
 
	get TO_HEPBURN_Hash() 
	{
		if (!this._TO_HEPBURN_Hash) {
			this.init();
		}
		return this._TO_HEPBURN_Hash;
	},
  
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
		var hash = this.ROMKAN_Hash;
		return this.normalize_double_n(String(aString).toLowerCase())
			.replace(this.ROMPAT, function(aChar) {
				return hash[aChar];
			});
	},
	roman2kana2 : function(aString, aKana)
	{
		var self = this;
		var hash = this.ROMKAN_Hash;
		var func = (aKana == this.KANA_ALL) ?
					function(aChar) {
						var str = hash[aChar];
						var result = '';
						while (str.length > 0)
						{
							result += '('+
								str.charAt(0)+'|'+
								self.hira2kataPattern(str.charAt(0)).replace(/^\(|\)$/g, '')+
								')';
							str = str.substring(1);
						}
						result = result
								.replace(/\((.)\|(.)\|(.)\)/g, '[$1$2$3]')
								.replace(/\((.)\|(.)\)/g, '[$1$2]')
						return result;
					} :
					(aKana == this.KANA_KATA) ?
					function(aChar) {
						return self.hira2kataPattern(hash[aChar]);
					} :
					null;

		if (!func)
			return this.roman2kana(aString);

		return this.normalize_double_n(String(aString).toLowerCase())
			.replace(this.ROMPAT, func);
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
		var self = this;
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
		var self = this;
		return this.normalize_double_n(String(aString).toLowerCase())
			.replace(/\G((?:#{KUNPAT})*?)(#{HEPPAT})/, function(aChar) {
				return $1 + TO_KUNREI[$2];
			});
*/
	},
  
/* hiragana, katakana */ 
	 
	KANATAB : [ 
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

'\u3046\u309b	\u30f4|\uff73\uff9e',

'\u30fc	\uff70',
'\u3002	\uff61',
'\u3001	\uff64',

'\u3063	\u30c3|\uff6f'
	].join('\n'),
 
	get KATAPAT() 
	{
		if (!this._KATAPAT) {
			this.init();
		}
		return this._KATAPAT;
	},
 
	get HIRAPAT() 
	{
		if (!this._HIRAPAT) {
			this.init();
		}
		return this._HIRAPAT;
	},
 
	get HIRAKATA_Hash() 
	{
		if (!this._HIRAKATA_Hash) {
			this.init();
		}
		return this._HIRAKATA_Hash;
	},
 
	get HIRAKATA_ZEN_Hash() 
	{
		if (!this._HIRAKATA_ZEN_Hash) {
			this.init();
		}
		return this._HIRAKATA_ZEN_Hash;
	},
 
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
		return String.charCodeFrom(code - 0xfee0)
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
	},
   
	expand : function(str) 
	{
		//この関数は語尾処理をする。ブラッシュアップが必要。
		var r2h  = this.r2h;
		var ichi = this.ichi;
		var child = str.charAt(str.length-1);
		var ret;
		switch (child)
		{
			case 'k':
			case 's':
			case 't':
			case 'h':
			case 'm':
			case 'r':
			case 'g':
			case 'z':
			case 'd':
			case 'b':
			case 'p':
			case 'l':
			case 'x':
				ret = str.substring(0,str.length-1)+
					'['+r2h.getString(child+'a')+
					r2h.getString(child+'i')+
					r2h.getString(child+'u')+
					r2h.getString(child+'e')+
					r2h.getString(child+'o')+
					ichi.getString('ltu')+
					']';
				break;

			case 'n':
				ret = str.substring(0,str.length-1)+
					'['+r2h.getString('na')+
					r2h.getString('ni')+
					r2h.getString('nu')+
					r2h.getString('ne')+
					r2h.getString('no')+
					ichi.getString('n')+
					']';
				break;

			case 'y':
				ret = str.substring(0,str.length-1)+
					'['+r2h.getString('ya')+
					r2h.getString('yu')+
					r2h.getString('yo')+
					']';
				break;

			case 'w':
				ret = str.substring(0,str.length-1)+
					'['+r2h.getString('wa')+
					r2h.getString('wo')+
					']';
				break;

			case 'j':
				ret = str.substring(0,str.length-1)+r2h.getString('ji');
				break;

			case 'f':
				ret = str.substring(0,str.length-1)+r2h.getString('fu');
				break;

			case 'v':
				ret = str.substring(0,str.length-1)+r2h.getString('vu');
				break;

			default:
				ret = str;
				break;
		}
		//alert('expand:'+ret);
		return ret;
	},
	 
	expand2 : function(str, aKana) 
	{
		var r2h  = this.r2h;
		var ichi = this.ichi;
		var child = str.charAt(str.length-1);
		var ret;
		switch (child)
		{
			case 'k':
			case 's':
			case 't':
			case 'h':
			case 'm':
			case 'r':
			case 'g':
			case 'z':
			case 'd':
			case 'b':
			case 'p':
			case 'l':
			case 'x':
				ret = str.substring(0,str.length-1)+
					['(',
						this.getKana(child+'a', aKana),'|',
						this.getKana(child+'i', aKana),'|',
						this.getKana(child+'u', aKana),'|',
						this.getKana(child+'e', aKana),'|',
						this.getKana(child+'o', aKana),'|',
						this.getKana('ltu', aKana),
					')'].join('');
				break;

			case 'n':
				ret = str.substring(0,str.length-1)+
					['(',
						this.getKana('na', aKana),'|',
						this.getKana('ni', aKana),'|',
						this.getKana('nu', aKana),'|',
						this.getKana('ne', aKana),'|',
						this.getKana('no', aKana),'|',
						this.getKana('n', aKana),
						']',
					')'].join('');
				break;

			case 'y':
				ret = str.substring(0,str.length-1)+
					['(',
						this.getKana('ya', aKana),'|',
						this.getKana('yu', aKana),'|',
						this.getKana('yo', aKana),
					')'].join('');
				break;

			case 'w':
				ret = str.substring(0,str.length-1)+
					['(',
						this.getKana('wa', aKana),'|',
						this.getKana('wo', aKana),
					')'].join('');
				break;

			case 'j':
				ret = str.substring(0,str.length-1)+this.getKana('ji', aKana);
				break;

			case 'f':
				ret = str.substring(0,str.length-1)+this.getKana('fu', aKana);
				break;

			case 'v':
				ret = str.substring(0,str.length-1)+this.getKana('vu', aKana);
				break;

			default:
				ret = str;
				break;
		}
		ret = ret.replace(/\((.)\|(.)\)/g, '\[$1$2\]')
					.replace(/\((.)\|(.)\|(.)\)/g, '\[$1$2$3\]')
					.replace(/\((.)\|(.)\|(.)\|(.)\|(.)\|(.)\)/g, '\[$1$2$3$4$5$6\]')
					.replace(/\n/g, '');
		//alert('expand:'+ret);
		return ret;
	},
 
	getKana : function(aKey, aKanaFlag) 
	{
		var r2h  = this.r2h;
		var r2k  = this.r2k;
		var ichi = this.ichi;
		var ret;
		switch (aKanaFlag)
		{
			case this.KANA_ALL:
				ret = (aKey == 'n' || aKey == 'ltu') ?
					['[',
						ichi.getString(aKey),
						r2k.getString(aKey),
					']'].join('') :
					['(',
						r2h.getString(aKey),'|',
						r2k.getString(aKey),
					')'].join('');
				ret = ret.replace(/\((.)\|(.)\|(.)\)/g, '\[$1$2$3\]')
						.replace(/\n/g, '');
				break;

			case this.KANA_KATA:
				ret = ['(', r2k.getString(aKey), ')'].join('');
				ret = ret.replace(/\((.)\|(.)\)/g, '\[$1$2\]')
						.replace(/\[(.)\]/g, '$1')
						.replace(/\n/g, '');
				break;

			default:
				ret = (aKey == 'n' || aKey == 'ltu') ? ichi.getString(aKey) : r2h.getString(aKey) ;
				break;
		}
		return ret;
	},
	KANA_HIRA : 0,
	KANA_KATA : 1,
	KANA_ALL  : 2,
	 
	get r2h() 
	{
		if (!this._r2h)
			this._r2h = new XMigemoStringBundle('chrome://xulmigemo/content/res/ja/r2h.properties');
		return this._r2h;
	},
	_r2h : null,
	get r2k()
	{
		if (!this._r2k)
			this._r2k = new XMigemoStringBundle('chrome://xulmigemo/content/res/ja/r2k.properties');
		return this._r2k;
	},
	_r2k : null,
	get ichi()
	{
		if (!this._ichi)
			this._ichi = new XMigemoStringBundle('chrome://xulmigemo/content/res/ja/ichimoji.properties');
		return this._ichi;
	},
	_ichi : null,
   
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoTextTransform) &&
			!aIID.equals(Components.interfaces.pIXMigemoTextTransformJa) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
function XMigemoStringBundle(aStringBundle) 
{
	this.strbundle = this.stringBundleService.createBundle(aStringBundle);
}
XMigemoStringBundle.prototype = {
	get stringBundleService()
	{
		if (!this._stringBundleService) {
			this._stringBundleService = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
		}
		return this._stringBundleService;
	},
	_stringBundleService : null,
	strbundle : null,
	getString : function(aKey) {
		try {
			return this.strbundle.GetStringFromName(aKey);
		}
		catch(e) {
		}
		return '';
	}
};
 
var gModule = { 
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Components.interfaces.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		manager : {
			CID        : pXMigemoTextTransformJa.prototype.classID,
			contractID : pXMigemoTextTransformJa.prototype.contractID,
			className  : pXMigemoTextTransformJa.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoTextTransformJa()).QueryInterface(aIID);
				}
			}
		}
	},

	canUnload : function (aComponentManager)
	{
		return true;
	}
};

function NSGetModule(compMgr, fileSpec)
{
	return gModule;
}
 
