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
					this.kana2hira(aInput)
				)
			);
	},
 
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
 
/* roman to hiragana */ 
	
	hira2kana : function(aStr) 
	{
		var output='';	//the result string
		var c;	//iterates for each of characters in the input
		var n;	//character code (unicode)
		for(var i=0; i<aStr.length;i++)
		{
			c = aStr.charAt(i);
			n = c.charCodeAt(0);
			if((n>=0x3041) && (n<=0x3096))
			{
				c = String.fromCharCode(n+0x60);
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
 
	katakanav : function(str) 
	{
		var r2h = this.r2h;
		return str.replace(new RegExp(r2h.getString("vu"),"g"),"("+r2h.getString("vu")+"|"+r2h.getString("vuk")+")");
	},
  
/* hiragana, katakana to roman */ 
	
	normalizeForYomi : function(aStr) 
	{
		return this.kana2hira(
				this.zenkaku2hankaku((aStr || '').toLowerCase())
			);
	},
 
	isYomi : function(aStr) 
	{
		aStr = aStr || '' ;
		var alph = this.zenkaku2hankaku(aStr.toLowerCase());
		if (/^[a-z0-9]+$/i.test(alph))
			return true;

		return this.kana2hira(aStr).replace(/[\u3041-\u3093\u309b\u309c\u30fc]/g, '') ? false : true ;
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
  
	kana2hira : function(aStr) 
	{
		return this.joinVoiceMarks(aStr || '').replace(/[\u30a1-\u30f6\uff60-\uff9f]/g, this.kana2hiraSub);
	},
	 
	kana2hiraSub : function(aStr) 
	{
		switch (aStr)
		{
			default: return aStr;

			case '\u30f2':
			case '\uff66':
				return '\u3092';
			case '\u30a1':
			case '\uff67':
				return '\u3041';
			case '\u30a3':
			case '\uff68':
				return '\u3043';
			case '\u30a5':
			case '\uff69':
				return '\u3045';
			case '\u30a7':
			case '\uff6a':
				return '\u3047';
			case '\u30a9':
			case '\uff6b':
				return '\u3049';
			case '\u30e3':
			case '\uff6c':
				return '\u3083';
			case '\u30e5':
			case '\uff6d':
				return '\u3085';
			case '\u30e7':
			case '\uff6e':
				return '\u3087';
			case '\u30c3':
			case '\uff6f':
				return '\u3063';

			case '\uff70': return '\u30fc';
			case '\uff9e': return '\u309b';
			case '\uff9f': return '\u309c';

			case '\u30a2':
			case '\uff71':
				return '\u3042';
			case '\u30a4':
			case '\uff72':
				return '\u3044';
			case '\u30a6':
			case '\uff73':
				return '\u3046';
			case '\u30a8':
			case '\uff74':
				return '\u3048';
			case '\u30aa':
			case '\uff75':
				return '\u304a';

			case '\u30ab':
			case '\uff76':
				return '\u304b';
			case '\u30ad':
			case '\uff77':
				return '\u304d';
			case '\u30af':
			case '\uff78':
				return '\u304f';
			case '\u30b1':
			case '\uff79':
				return '\u3051';
			case '\u30b3':
			case '\uff7a':
				return '\u3053';

			case '\u30b5':
			case '\uff7b':
				return '\u3055';
			case '\u30b7':
			case '\uff7c':
				return '\u3057';
			case '\u30b9':
			case '\uff7d':
				return '\u3059';
			case '\u30bb':
			case '\uff7e':
				return '\u305b';
			case '\u30bd':
			case '\uff7f':
				return '\u305d';

			case '\u30bf':
			case '\uff80':
				return '\u305f';
			case '\u30c1':
			case '\uff81':
				return '\u3061';
			case '\u30c4':
			case '\uff82':
				return '\u3064';
			case '\u30c6':
			case '\uff83':
				return '\u3066';
			case '\u30c8':
			case '\uff84':
				return '\u3068';

			case '\u30ca':
			case '\uff85':
				return '\u306a';
			case '\u30cb':
			case '\uff86':
				return '\u306b';
			case '\u30cc':
			case '\uff87':
				return '\u306c';
			case '\u30cd':
			case '\uff88':
				return '\u306d';
			case '\u30ce':
			case '\uff89':
				return '\u306e';

			case '\u30cf':
			case '\uff8a':
				return '\u306f';
			case '\u30d2':
			case '\uff8b':
				return '\u3072';
			case '\u30d5':
			case '\uff8c':
				return '\u3075';
			case '\u30d8':
			case '\uff8d':
				return '\u3078';
			case '\u30db':
			case '\uff8e':
				return '\u307b';

			case '\u30de':
			case '\uff8f':
				return '\u307e';
			case '\u30df':
			case '\uff90':
				return '\u307f';
			case '\u30e0':
			case '\uff91':
				return '\u3080';
			case '\u30e1':
			case '\uff92':
				return '\u3081';
			case '\u30e2':
			case '\uff93':
				return '\u3082';

			case '\u30e4':
			case '\uff94':
				return '\u3084';
			case '\u30e6':
			case '\uff95':
				return '\u3086';
			case '\u30e8':
			case '\uff96':
				return '\u3088';

			case '\u30e9':
			case '\uff97':
				return '\u3089';
			case '\u30ea':
			case '\uff98':
				return '\u308a';
			case '\u30eb':
			case '\uff99':
				return '\u308b';
			case '\u30ec':
			case '\uff9a':
				return '\u308c';
			case '\u30ed':
			case '\uff9b':
				return '\u308d';

			case '\u30ef':
			case '\uff9c':
				return '\u308f';
			case '\u30f3':
			case '\uff9d':
				return '\u3093';

			case '\u30f6': return '\u3051';
			case '\u30f5': return '\u304b';
			case '\u30f4': return '\u3046\u309b';

			case '\u30ac': return '\u304c';
			case '\u30ae': return '\u304e';
			case '\u30b0': return '\u3050';
			case '\u30b2': return '\u3052';
			case '\u30b4': return '\u3054';

			case '\u30b6': return '\u3056';
			case '\u30b8': return '\u3058';
			case '\u30ba': return '\u305a';
			case '\u30bc': return '\u305c';
			case '\u30be': return '\u305e';

			case '\u30c0': return '\u3060';
			case '\u30c2': return '\u3062';
			case '\u30c5': return '\u3065';
			case '\u30c7': return '\u3067';
			case '\u30c9': return '\u3069';

			case '\u30d0': return '\u3070';
			case '\u30d3': return '\u3073';
			case '\u30d6': return '\u3076';
			case '\u30d9': return '\u3079';
			case '\u30dc': return '\u307c';

			case '\u30d1': return '\u3071';
			case '\u30d4': return '\u3074';
			case '\u30d7': return '\u3077';
			case '\u30da': return '\u307a';
			case '\u30dd': return '\u307d';
		}
	},
  
	hira2roman : function(aStr) 
	{
		return this.joinVoiceMarks(aStr || '').replace(/[\u3041-\u3093]/g, this.hira2romanSub);
	},
	 
	hira2romanSub : function(aStr) 
	{
		switch (aStr)
		{
			default: return aStr;

			case '\u3042': return 'a';
			case '\u3044': return 'i';
			case '\u3046': return 'u';
			case '\u3048': return 'e';
			case '\u304a': return 'o';

			case '\u3041': return 'la';
			case '\u3043': return 'li';
			case '\u3045': return 'lu';
			case '\u3047': return 'le';
			case '\u3049': return 'lo';

			case '\u3083': return 'lya';
			case '\u3043': return 'lyi';
			case '\u3085': return 'lyu';
			case '\u3047': return 'lye';
			case '\u3087': return 'lyo';

			case '\u304b': return 'ka';
			case '\u304d': return 'ki';
			case '\u304f': return 'ku';
			case '\u3051': return 'ke';
			case '\u3053': return 'ko';

			case '\u3055': return 'sa';
			case '\u3057': return 'si';
			case '\u3059': return 'su';
			case '\u305b': return 'se';
			case '\u305d': return 'so';

			case '\u305f': return 'ta';
			case '\u3061': return 'ti';
			case '\u3064': return 'tu';
			case '\u3066': return 'te';
			case '\u3068': return 'to';

			case '\u306a': return 'na';
			case '\u306b': return 'ni';
			case '\u306c': return 'nu';
			case '\u306d': return 'ne';
			case '\u306e': return 'no';

			case '\u306f': return 'ha';
			case '\u3072': return 'hi';
			case '\u3075': return 'hu';
			case '\u3078': return 'he';
			case '\u307b': return 'ho';

			case '\u307e': return 'ma';
			case '\u307f': return 'mi';
			case '\u3080': return 'mu';
			case '\u3081': return 'me';
			case '\u3082': return 'mo';

			case '\u3084': return 'ya';
			case '\u3086': return 'yu';
			case '\u3088': return 'yo';

			case '\u3089': return 'ra';
			case '\u308a': return 'ri';
			case '\u308b': return 'ru';
			case '\u308c': return 're';
			case '\u308d': return 'ro';

			case '\u308f': return 'wa';
			case '\u3092': return 'wo';

			case '\u3093': return 'n';

			case '\u304c': return 'ga';
			case '\u304e': return 'gi';
			case '\u3050': return 'gu';
			case '\u3052': return 'ge';
			case '\u3054': return 'go';

			case '\u3056': return 'za';
			case '\u3058': return 'zi';
			case '\u305a': return 'zu';
			case '\u305c': return 'ze';
			case '\u305e': return 'zo';

			case '\u3060': return 'da';
			case '\u3062': return 'di';
			case '\u3065': return 'du';
			case '\u3067': return 'de';
			case '\u3069': return 'do';

			case '\u3070': return 'ba';
			case '\u3073': return 'bi';
			case '\u3076': return 'bu';
			case '\u3079': return 'be';
			case '\u307c': return 'bo';

			case '\u3071': return 'pa';
			case '\u3074': return 'pi';
			case '\u3077': return 'pu';
			case '\u307a': return 'pe';
			case '\u307d': return 'po';

			case '\u3090': return 'wyi';
			case '\u3091': return 'wye';
		}
	},
   
/* roman -> hiragana; OLD */ 
	
	convertStr : function(str) 
	{ // should be replaced
		var r2h  = this.r2h;
		var ichi = this.ichi;
		//var str;
		var cchar, lastchar, last2char;
		var converted;
		var i;
		converted = lastchar = last2char = '';
		i = 0;
		while (i < str.length)
		{
			lastchar = last2char = '';
			loopcheck:
			while (i < str.length)
			{
				cchar = str.charAt(i++);
				if (this.isalpha(cchar) && cchar.toUpperCase() == lastchar.toUpperCase()) {
					if (cchar.toUpperCase() == 'N') {
						converted += last2char + ichi.getString('n');
						lastchar = cchar = '';
					}
					else {
						converted += last2char + ichi.getString('ltu');
					}
					last2char = '';
					continue;
				}
				switch (cchar.toUpperCase())
				{
					case 'A':
					case 'I':
					case 'U':
					case 'E':
					case 'O':
						converted += this.toZen(cchar, lastchar, last2char);
						lastchar = last2char = '';
						break loopcheck;

					case ',':
						if (lastchar.toUpperCase() == 'N') lastchar = ichi.getString('n');
						converted += last2char + lastchar + r2h.getString('ten');
						lastchar = last2char = '';
						break loopcheck;

					case '.':
						if (lastchar.toUpperCase() == 'N') lastchar = ichi.getString('n');
						converted += last2char + lastchar + r2h.getString('maru');
						lastchar = last2char = '';
						break loopcheck;

					case '-':
						if (lastchar.toUpperCase() == 'N') lastchar = ichi.getString('n');
						converted += last2char + lastchar + r2h.getString('border');
						lastchar = last2char = '';
						break loopcheck;

					default:
						if (last2char != '') converted += last2char;
						if (lastchar.toUpperCase() == 'N' && cchar.toUpperCase() != 'Y') {
							converted += ichi.getString('n');
							lastchar = '';
						}
						break;
				}
				last2char = lastchar;
				lastchar = cchar;
			}
		}
		return converted + last2char + lastchar;
	},
 
	convertStr2 : function(str, aKana) 
	{ // should be replaced
		//var str;
		var cchar, lastchar, last2char;
		var converted;
		var i;
		converted = lastchar = last2char = '';
		i = 0;
		while (i < str.length)
		{
			lastchar = last2char = '';
			loopcheck:
			while (i < str.length)
			{
				cchar = str.charAt(i++);
				if (this.isalpha(cchar) && cchar.toUpperCase() == lastchar.toUpperCase()) {
					if (cchar.toUpperCase() == 'N') {
						converted += last2char + this.getKana('n', aKana);
						lastchar = cchar = '';
					}
					else {
						converted += last2char + this.getKana('ltu', aKana)
					}
					last2char = '';
					continue;
				}
				switch (cchar.toUpperCase())
				{
					case '[':
					case ']':
					case '(':
					case ')':
					case '|':
						converted += '\\'+cchar;
						lastchar = last2char = '';
						break loopcheck;

					case 'A':
					case 'I':
					case 'U':
					case 'E':
					case 'O':
						converted += this.toZen(cchar, lastchar, last2char, aKana);
						lastchar = last2char = '';
						break loopcheck;

					case ',':
						if (lastchar.toUpperCase() == 'N') lastchar = this.getKana('n', aKana)
						converted += last2char + lastchar + this.getKana('ten', aKana)
						lastchar = last2char = '';
						break loopcheck;

					case '.':
						if (lastchar.toUpperCase() == 'N') lastchar = this.getKana('n', aKana)
						converted += last2char + lastchar + this.getKana('maru', aKana)
						lastchar = last2char = '';
						break loopcheck;

					case '-':
						if (lastchar.toUpperCase() == 'N') lastchar = this.getKana('n', aKana)
						converted += last2char + lastchar + this.getKana('border', aKana)
						lastchar = last2char = '';
						break loopcheck;

					default:
						if (last2char != '') converted += last2char;
						if (lastchar.toUpperCase() == 'N' && cchar.toUpperCase() != 'Y') {
							converted += this.getKana('n', aKana)
							lastchar = '';
						}
						break;
				}
				last2char = lastchar;
				lastchar = cchar;
			}
		}
		return converted + last2char + lastchar;
	},
 
	toZen : function(cchar, lastchar, last2char, aKana) 
	{ // should be replaced
		var ulastchar = lastchar.toUpperCase();
		var ulast2char = last2char.toUpperCase();
		switch (cchar.toUpperCase()) {
			case 'A':
				if (ulast2char == 'B' && ulastchar == 'Y') return this.getKana('bya', aKana);
				if (ulast2char == 'C' && (ulastchar == 'H' || ulastchar == 'Y')) return this.getKana('cha', aKana);
				if (ulast2char == 'D' && ulastchar == 'H') return this.getKana('dha', aKana);
				if (ulast2char == 'D' && ulastchar == 'Y') return this.getKana('dya', aKana);
				if (ulast2char == 'F' && ulastchar == 'Y') return this.getKana('fya', aKana);
				if (ulast2char == 'G' && ulastchar == 'Y') return this.getKana('gya', aKana);
				if (ulast2char == 'H' && ulastchar == 'Y') return this.getKana('gya', aKana);
				if (ulast2char == 'J' && ulastchar == 'Y') return this.getKana('jya', aKana);
				if (ulast2char == 'K' && ulastchar == 'W') return this.getKana('kwa', aKana);
				if (ulast2char == 'K' && ulastchar == 'Y') return this.getKana('kya', aKana);
				if ((ulast2char == 'L' || ulast2char == 'X') && ulastchar == 'Y') return this.getKana('lya', aKana);
				if (ulast2char == 'M' && ulastchar == 'Y') return this.getKana('mya', aKana);
				if (ulast2char == 'N' && ulastchar == 'Y') return this.getKana('nya', aKana);
				if (ulast2char == 'P' && ulastchar == 'Y') return this.getKana('pya', aKana);
				if (ulast2char == 'R' && ulastchar == 'Y') return this.getKana('rya', aKana);
				if (ulast2char == 'S' && (ulastchar == 'H' || ulastchar == 'Y')) return this.getKana('sha', aKana);
				if (ulast2char == 'T' && ulastchar == 'H') return this.getKana('tha', aKana);
				if (ulast2char == 'T' && ulastchar == 'Y') return this.getKana('cha', aKana);
				if (ulast2char == 'Z' && ulastchar == 'Y') return this.getKana('ja', aKana);
				if (ulastchar == 'B') return last2char + this.getKana('ba', aKana);
				if (ulastchar == 'D') return last2char + this.getKana('da', aKana);
				if (ulastchar == 'F') return last2char + this.getKana('fa', aKana);
				if (ulastchar == 'G') return last2char + this.getKana('ga', aKana);
				if (ulastchar == 'H') return last2char + this.getKana('ha', aKana);
				if (ulastchar == 'J') return last2char + this.getKana('ja', aKana);
				if (ulastchar == 'K') return last2char + this.getKana('ka', aKana);
				if (ulastchar == 'L' || ulastchar == 'X') return last2char + this.getKana('la', aKana);
				if (ulastchar == 'M') return last2char + this.getKana('ma', aKana);
				if (ulastchar == 'N') return last2char + this.getKana('na', aKana);
				if (ulastchar == 'P') return last2char + this.getKana('pa', aKana);
				if (ulastchar == 'R') return last2char + this.getKana('ra', aKana);
				if (ulastchar == 'S') return last2char + this.getKana('sa', aKana);
				if (ulastchar == 'T') return last2char + this.getKana('ta', aKana);
				if (ulastchar == 'V') return last2char + this.getKana('va', aKana);
				if (ulastchar == 'W') return last2char + this.getKana('wa', aKana);
				if (ulastchar == 'Y') return last2char + this.getKana('ya', aKana);
				if (ulastchar == 'Z') return last2char + this.getKana('za', aKana);
				return last2char + lastchar + this.getKana('a', aKana);

			case 'I':
				if (ulast2char == 'B' && ulastchar == 'Y') return this.getKana('byi', aKana);
				if (ulast2char == 'C' && ulastchar == 'H') return this.getKana('chi', aKana);
				if (ulast2char == 'C' && ulastchar == 'Y') return this.getKana('cyi', aKana);
				if (ulast2char == 'D' && ulastchar == 'H') return this.getKana('dhi', aKana);
				if (ulast2char == 'D' && ulastchar == 'Y') return this.getKana('dyi', aKana);
				if (ulast2char == 'F' && ulastchar == 'Y') return this.getKana('fi', aKana);
				if (ulast2char == 'G' && ulastchar == 'Y') return this.getKana('gyi', aKana);
				if (ulast2char == 'H' && ulastchar == 'Y') return this.getKana('hyi', aKana);
				if (ulast2char == 'J' && ulastchar == 'Y') return this.getKana('jyi', aKana);
				if (ulast2char == 'K' && ulastchar == 'Y') return this.getKana('kyi', aKana);
				if ((ulast2char == 'L' || ulast2char == 'X') && ulastchar == 'Y') return this.getKana('li', aKana);;
				if (ulast2char == 'M' && ulastchar == 'Y') return this.getKana('myi', aKana);
				if (ulast2char == 'N' && ulastchar == 'Y') return this.getKana('nyi', aKana);
				if (ulast2char == 'P' && ulastchar == 'Y') return this.getKana('pyi', aKana);
				if (ulast2char == 'R' && ulastchar == 'Y') return this.getKana('ryi', aKana);
				if (ulast2char == 'S' && ulastchar == 'H') return this.getKana('si', aKana);
				if (ulast2char == 'S' && ulastchar == 'Y') return this.getKana('syi', aKana);
				if (ulast2char == 'T' && ulastchar == 'H') return this.getKana('thi', aKana);
				if (ulast2char == 'T' && ulastchar == 'Y') return this.getKana('tyi', aKana);
				if (ulast2char == 'W' && ulastchar == 'Y') return this.getKana('wyi', aKana);
				if (ulast2char == 'Z' && ulastchar == 'Y') return this.getKana('jyi', aKana);
				if (ulastchar == 'B') return last2char + this.getKana('bi', aKana);
				if (ulastchar == 'D') return last2char + this.getKana('di', aKana);
				if (ulastchar == 'F') return last2char + this.getKana('fi', aKana);
				if (ulastchar == 'G') return last2char + this.getKana('gi', aKana);
				if (ulastchar == 'H') return last2char + this.getKana('hi', aKana);
				if (ulastchar == 'J') return last2char + this.getKana('ji', aKana);
				if (ulastchar == 'K') return last2char + this.getKana('ki', aKana);
				if (ulastchar == 'L' || ulastchar == 'X') return last2char + this.getKana('li', aKana);
				if (ulastchar == 'M') return last2char + this.getKana('mi', aKana);
				if (ulastchar == 'N') return last2char + this.getKana('ni', aKana);
				if (ulastchar == 'P') return last2char + this.getKana('pi', aKana);
				if (ulastchar == 'R') return last2char + this.getKana('ri', aKana);
				if (ulastchar == 'S') return last2char + this.getKana('si', aKana);
				if (ulastchar == 'T') return last2char + this.getKana('ti', aKana);
				if (ulastchar == 'V') return last2char + this.getKana('vi', aKana);
				if (ulastchar == 'W') return last2char + this.getKana('wi', aKana);
				if (ulastchar == 'Y') return last2char + this.getKana('i', aKana);
				if (ulastchar == 'Z') return last2char + this.getKana('ji', aKana);
				return last2char + lastchar + this.getKana('i', aKana);

			case 'U':
				if (ulast2char == 'B' && ulastchar == 'Y') return this.getKana('byu', aKana);
				if (ulast2char == 'C' && (ulastchar == 'H' || ulastchar == 'Y')) return this.getKana('chu', aKana);
				if (ulast2char == 'D' && ulastchar == 'H') return this.getKana('dhu', aKana);
				if (ulast2char == 'D' && ulastchar == 'Y') return this.getKana('dyu', aKana);
				if (ulast2char == 'F' && ulastchar == 'Y') return this.getKana('fyu', aKana);
				if (ulast2char == 'G' && ulastchar == 'Y') return this.getKana('gyu', aKana);
				if (ulast2char == 'H' && ulastchar == 'Y') return this.getKana('hyu', aKana);
				if (ulast2char == 'J' && ulastchar == 'Y') return this.getKana('ju', aKana);
				if (ulast2char == 'K' && ulastchar == 'Y') return this.getKana('kyu', aKana);
				if ((ulast2char == 'L' || ulast2char == 'X') && ulastchar == 'Y') return this.getKana('lyu', aKana);
				if ((ulast2char == 'L' || ulast2char == 'X') && ulastchar == 'T') return this.getKana('ltu', aKana);
				if (ulast2char == 'M' && ulastchar == 'Y') return this.getKana('myu', aKana);
				if (ulast2char == 'N' && ulastchar == 'Y') return this.getKana('nyu', aKana);
				if (ulast2char == 'P' && ulastchar == 'Y') return this.getKana('pyu', aKana);
				if (ulast2char == 'R' && ulastchar == 'Y') return this.getKana('ryu', aKana);
				if (ulast2char == 'S' && (ulastchar == 'H' || ulastchar == 'Y')) return this.getKana('shu', aKana);
				if (ulast2char == 'T' && ulastchar == 'H') return this.getKana('thu', aKana);
				if (ulast2char == 'T' && ulastchar == 'S') return this.getKana('tu', aKana);
				if (ulast2char == 'T' && ulastchar == 'Y') return this.getKana('chu', aKana);
				if (ulast2char == 'Z' && ulastchar == 'Y') return this.getKana('ju', aKana);
				if (ulastchar == 'B') return last2char + this.getKana('bu', aKana);
				if (ulastchar == 'D') return last2char + this.getKana('du', aKana);
				if (ulastchar == 'F') return last2char + this.getKana('fu', aKana);
				if (ulastchar == 'G') return last2char + this.getKana('gu', aKana);
				if (ulastchar == 'H') return last2char + this.getKana('fu', aKana);
				if (ulastchar == 'J') return last2char + this.getKana('ju', aKana);
				if (ulastchar == 'K') return last2char + this.getKana('ku', aKana);
				if (ulastchar == 'L' || ulastchar == 'X') return last2char + this.getKana('lu', aKana);
				if (ulastchar == 'M') return last2char + this.getKana('mu', aKana);
				if (ulastchar == 'N') return last2char + this.getKana('nu', aKana);
				if (ulastchar == 'P') return last2char + this.getKana('pu', aKana);
				if (ulastchar == 'R') return last2char + this.getKana('ru', aKana);
				if (ulastchar == 'S') return last2char + this.getKana('su', aKana);
				if (ulastchar == 'T') return last2char + this.getKana('tu', aKana);
				if (ulastchar == 'V') return last2char + this.getKana('vu', aKana);
				if (ulastchar == 'W') return last2char + this.getKana('u', aKana);
				if (ulastchar == 'Y') return last2char + this.getKana('yu', aKana);
				if (ulastchar == 'Z') return last2char + this.getKana('zu', aKana);
				return last2char + lastchar + this.getKana('u', aKana);

			case 'E':
				if (ulast2char == 'B' && ulastchar == 'Y') return this.getKana('bye', aKana);
				if (ulast2char == 'C' && (ulastchar == 'H' || ulastchar == 'Y')) return this.getKana('che', aKana);
				if (ulast2char == 'D' && ulastchar == 'H') return this.getKana('dhe', aKana);
				if (ulast2char == 'D' && ulastchar == 'Y') return this.getKana('dye', aKana);
				if (ulast2char == 'F' && ulastchar == 'Y') return this.getKana('fe', aKana);
				if (ulast2char == 'G' && ulastchar == 'Y') return this.getKana('gye', aKana);
				if (ulast2char == 'H' && ulastchar == 'Y') return this.getKana('hye', aKana);
				if (ulast2char == 'J' && ulastchar == 'Y') return this.getKana('je', aKana);
				if (ulast2char == 'K' && ulastchar == 'Y') return this.getKana('kye', aKana);
				if ((ulast2char == 'L' || ulast2char == 'X') && ulastchar == 'Y') return this.getKana('lye', aKana);
				if (ulast2char == 'M' && ulastchar == 'Y') return this.getKana('mye', aKana);
				if (ulast2char == 'N' && ulastchar == 'Y') return this.getKana('nye', aKana);
				if (ulast2char == 'P' && ulastchar == 'Y') return this.getKana('pye', aKana);
				if (ulast2char == 'R' && ulastchar == 'Y') return this.getKana('lye', aKana);
				if (ulast2char == 'S' && (ulastchar == 'H' || ulastchar == 'Y')) return this.getKana('she', aKana);
				if (ulast2char == 'T' && ulastchar == 'H') return this.getKana('the', aKana);
				if (ulast2char == 'T' && ulastchar == 'Y') return this.getKana('tye', aKana);
				if (ulast2char == 'W' && ulastchar == 'Y') return this.getKana('wye', aKana);
				if (ulast2char == 'Z' && ulastchar == 'Y') return this.getKana('je', aKana);
				if (ulastchar == 'B') return last2char + this.getKana('be', aKana);
				if (ulastchar == 'D') return last2char + this.getKana('de', aKana);
				if (ulastchar == 'F') return last2char + this.getKana('fe', aKana);
				if (ulastchar == 'G') return last2char + this.getKana('ge', aKana);
				if (ulastchar == 'H') return last2char + this.getKana('he', aKana);
				if (ulastchar == 'J') return last2char + this.getKana('je', aKana);
				if (ulastchar == 'K') return last2char + this.getKana('ke', aKana);
				if (ulastchar == 'L' || ulastchar == 'X') return last2char + this.getKana('lye', aKana);
				if (ulastchar == 'M') return last2char + this.getKana('me', aKana);
				if (ulastchar == 'N') return last2char + this.getKana('ne', aKana);
				if (ulastchar == 'P') return last2char + this.getKana('pe', aKana);
				if (ulastchar == 'R') return last2char + this.getKana('re', aKana);
				if (ulastchar == 'S') return last2char + this.getKana('se', aKana);
				if (ulastchar == 'T') return last2char + this.getKana('te', aKana);
				if (ulastchar == 'V') return last2char + this.getKana('ve', aKana);
				if (ulastchar == 'W') return last2char + this.getKana('we', aKana);
				if (ulastchar == 'Y') return last2char + this.getKana('ye', aKana);
				if (ulastchar == 'Z') return last2char + this.getKana('ze', aKana);
				return last2char + lastchar + this.getKana('e', aKana);

			case 'O':
				if (ulast2char == 'B' && ulastchar == 'Y') return this.getKana('byo', aKana);
				if (ulast2char == 'C' && (ulastchar == 'H' || ulastchar == 'Y')) return this.getKana('cho', aKana);
				if (ulast2char == 'D' && ulastchar == 'H') return this.getKana('dho', aKana);
				if (ulast2char == 'D' && ulastchar == 'Y') return this.getKana('dyo', aKana);
				if (ulast2char == 'F' && ulastchar == 'Y') return this.getKana('fyo', aKana);
				if (ulast2char == 'G' && ulastchar == 'Y') return this.getKana('gyo', aKana);
				if (ulast2char == 'H' && ulastchar == 'Y') return this.getKana('hyo', aKana);
				if (ulast2char == 'J' && ulastchar == 'Y') return this.getKana('jyo', aKana);
				if (ulast2char == 'K' && ulastchar == 'Y') return this.getKana('kyo', aKana);
				if ((ulast2char == 'L' || ulast2char == 'X') && ulastchar == 'Y') return this.getKana('lyo', aKana);
				if (ulast2char == 'M' && ulastchar == 'Y') return this.getKana('myo', aKana);
				if (ulast2char == 'N' && ulastchar == 'Y') return this.getKana('nyo', aKana);
				if (ulast2char == 'P' && ulastchar == 'Y') return this.getKana('pyo', aKana);
				if (ulast2char == 'R' && ulastchar == 'Y') return this.getKana('ryo', aKana);
				if (ulast2char == 'S' && (ulastchar == 'H' || ulastchar == 'Y')) return this.getKana('sho', aKana);
				if (ulast2char == 'T' && ulastchar == 'H') return this.getKana('tho', aKana);
				if (ulast2char == 'T' && ulastchar == 'Y') return this.getKana('tyo', aKana);
				if (ulast2char == 'Z' && ulastchar == 'Y') return this.getKana('jo', aKana);
				if (ulastchar == 'B') return last2char + this.getKana('bo', aKana);
				if (ulastchar == 'D') return last2char + this.getKana('do', aKana);
				if (ulastchar == 'F') return last2char + this.getKana('fo', aKana);
				if (ulastchar == 'G') return last2char + this.getKana('go', aKana);
				if (ulastchar == 'H') return last2char + this.getKana('ho', aKana);
				if (ulastchar == 'J') return last2char + this.getKana('jo', aKana);
				if (ulastchar == 'K') return last2char + this.getKana('ko', aKana);
				if (ulastchar == 'L' || ulastchar == 'X') return last2char + this.getKana('lo', aKana);
				if (ulastchar == 'M') return last2char + this.getKana('mo', aKana);
				if (ulastchar == 'N') return last2char + this.getKana('no', aKana);
				if (ulastchar == 'P') return last2char + this.getKana('po', aKana);
				if (ulastchar == 'R') return last2char + this.getKana('ro', aKana);
				if (ulastchar == 'S') return last2char + this.getKana('so', aKana);
				if (ulastchar == 'T') return last2char + this.getKana('to', aKana);
				if (ulastchar == 'V') return last2char + this.getKana('vo', aKana);
				if (ulastchar == 'W') return last2char + this.getKana('wo', aKana);
				if (ulastchar == 'Y') return last2char + this.getKana('yo', aKana);
				if (ulastchar == 'Z') return last2char + this.getKana('zo', aKana);
				return last2char + lastchar + this.getKana('o', aKana);
		}
	},
 
	isalpha : function(c) 
	{ // should be replaced
		return ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')) ? true : false ;
	},
  
/* roman -> hiragana; NEW 
	based on Ruby/Romkan http://0xcc.net/ruby-romkan/
*/
	 
	init : function() 
	{
		var self = this;

		this._ROMKAN     = [];
		this._ROMKANHash = {};
		this._ROMPAT     = [];

		this._KANROM     = [];
		this._KANROMHash = {};
		this._KANPAT     = [];

		var pairs = (this.KUNREITAB + this.HEPBURNTAB).split(/\s+/);
		for (var i = 0, maxi = pairs.length; i < max; i += 2)
		{
			this._ROMKAN.push({ key : pairs[i+1], char : pairs[i] });
			this._ROMKANHash[pairs[i+1]] = pairs[i]];
			this._ROMPAT.push({ key : pairs[i+1], char : pairs[i] });

			this._KANROM.push({ key : pairs[i], char : pairs[i+1] });
			this._KANROMHash[pairs[i]] = pairs[i+1];
			this._KANPAT.push({ key : pairs[i], char : pairs[i+1] });
		}


		// Sort in long order so that a longer Romaji sequence precedes.
		this._ROMPAT.sort(function(aA, aB) {
			return aB.key.length - aA.key.length;
		}).map(function(aItem) {
			return aItem.char;
		}).join('|');

		this._KANPAT.sort(function(aA, aB) {
			return (aB.key.length - aA.key.length) ||
				(self.KANROMHash[aA].length - self.KANROMHash[aB].length);
		}).map(function(aItem) {
			return aItem.char;
		}).join('|');

		this._KUNREI = this.KUNREITAB.split(/\s+/).filter(function(aItem, aIndex) {
			return (aIndex % 2 == 0);
		});
		this._HEPBURN = this.HEPBURNTAB.split(/\s+/).filter(function(aItem, aIndex) {
			return (aIndex % 2 == 0);
		});

//		this._KUNPAT;
//		this._HEPPAT;

		this._TO_HEPBURNHash = {};
		this._TO_HEPBURN = this._KUNREI.map(function(aItem, aIndex) {
			self._TO_HEPBURNHash[aItem] = self._HEPBURN[aIndex];
			return { key : aItem, char : self._HEPBURN[aIndex] };
		});
		this._TO_KUNREIHash = {};
		this._TO_KUNREI = this._HEPBURN.map(function(aItem, aIndex) {
			self._TO_KUNREIHash[aItem] = self._KUNREI[aIndex];
			return { key : aItem, char : self._KUNREI[aIndex] };
		});
	},
 
	KUNREITAB : String(<![CDATA[ 
\u3041	xa	\u3042	a	\u3043	xi	\u3044	i	\u3045	xu
\u3046	u	\u3046\u309b	vu	\u3046\u309b\u3041	va	\u3046\u309b\u3043	vi 	\u3046\u309b\u3047	ve
\u3046\u309b\u3049	vo	\u3047	xe	\u3048	e	\u3049	xo	\u304a	o

\u304b	ka	\u304c	ga	\u304d	ki	\u304d\u3083	kya	\u304d\u3085	kyu
\u304d\u3087	kyo	\u304e	gi	\u304e\u3083	gya	\u304e\u3085	gyu	\u304e\u3087	gyo
\u304f	ku	\u3050	gu	\u3051	ke	\u3052	ge	\u3053	ko
\u3054	go

\u3055	sa	\u3056	za	\u3057	si	\u3057\u3083	sya	\u3057\u3085	syu
\u3057\u3087	syo	\u3058	zi	\u3058\u3083	zya	\u3058\u3085	zyu	\u3058\u3087	zyo
\u3059	su	\u305a	zu	\u305b	se	\u305c	ze	\u305d	so
\u305e	zo

\u305f	ta	\u3060	da	\u3061	ti	\u3061\u3083	tya	\u3061\u3085	tyu
\u3061\u3087	tyo	\u3062	di	\u3062\u3083	dya	\u3062\u3085	dyu	\u3062\u3087	dyo

\u3063	xtu
\u3063\u3046\u309b	vvu	\u3063\u3046\u309b\u3041	vva	\u3063\u3046\u309b\u3043	vvi
\u3063\u3046\u309b\u3047	vve	\u3063\u3046\u309b\u3049	vvo
\u3063\u304b	kka	\u3063\u304c	gga	\u3063\u304d	kki	\u3063\u304d\u3083	kkya
\u3063\u304d\u3085	kkyu	\u3063\u304d\u3087	kkyo	\u3063\u304e	ggi	\u3063\u304e\u3083	ggya
\u3063\u304e\u3085	ggyu	\u3063\u304e\u3087	ggyo	\u3063\u304f	kku	\u3063\u3050	ggu
\u3063\u3051	kke	\u3063\u3052	gge	\u3063\u3053	kko	\u3063\u3054	ggo	\u3063\u3055	ssa
\u3063\u3056	zza	\u3063\u3057	ssi	\u3063\u3057\u3083	ssya
\u3063\u3057\u3085	ssyu	\u3063\u3057\u3087	ssho
\u3063\u3058	zzi	\u3063\u3058\u3083	zzya	\u3063\u3058\u3085	zzyu	\u3063\u3058\u3087	zzyo
\u3063\u3059	ssu	\u3063\u305a	zzu	\u3063\u305b	sse	\u3063\u305c	zze	\u3063\u305d	sso
\u3063\u305e	zzo	\u3063\u305f	tta	\u3063\u3060	dda	\u3063\u3061	tti
\u3063\u3061\u3083	ttya	\u3063\u3061\u3085	ttyu	\u3063\u3061\u3087	ttyo	\u3063\u3062	ddi
\u3063\u3062\u3083	ddya	\u3063\u3062\u3085	ddyu	\u3063\u3062\u3087	ddyo	\u3063\u3064	ttu
\u3063\u3065	ddu	\u3063\u3066	tte	\u3063\u3067	dde	\u3063\u3068	tto	\u3063\u3069	ddo
\u3063\u306f	hha	\u3063\u3070	bba	\u3063\u3071	ppa	\u3063\u3072	hhi
\u3063\u3072\u3083	hhya	\u3063\u3072\u3085	hhyu	\u3063\u3072\u3087	hhyo	\u3063\u3073	bbi
\u3063\u3073\u3083	bbya	\u3063\u3073\u3085	bbyu	\u3063\u3073\u3087	bbyo	\u3063\u3074	ppi
\u3063\u3074\u3083	ppya	\u3063\u3074\u3085	ppyu	\u3063\u3074\u3087	ppyo	\u3063\u3075	hhu
\u3063\u3075\u3041	ffa	\u3063\u3075\u3043	ffi	\u3063\u3075\u3047	ffe	\u3063\u3075\u3049	ffo
\u3063\u3076	bbu	\u3063\u3077	ppu	\u3063\u3078	hhe	\u3063\u3079	bbe	\u3063\u307a    ppe
\u3063\u307b	hho	\u3063\u307c	bbo	\u3063\u307d	ppo	\u3063\u3084	yya	\u3063\u3086	yyu
\u3063\u3088	yyo	\u3063\u3089	rra	\u3063\u308a	rri	\u3063\u308a\u3083	rrya
\u3063\u308a\u3085	rryu	\u3063\u308a\u3087	rryo	\u3063\u308b	rru	\u3063\u308c	rre
\u3063\u308d	rro

\u3064	tu	\u3065	du	\u3066	te	\u3067	de	\u3068	to
\u3069	do

\u306a	na	\u306b	ni	\u306b\u3083	nya	\u306b\u3085	nyu	\u306b\u3087	nyo
\u306c	nu	\u306d	ne	\u306e	no

\u306f	ha	\u3070	ba	\u3071	pa	\u3072	hi	\u3072\u3083	hya
\u3072\u3085	hyu	\u3072\u3087	hyo	\u3073	bi	\u3073\u3083	bya	\u3073\u3085	byu
\u3073\u3087	byo	\u3074	pi	\u3074\u3083	pya	\u3074\u3085	pyu	\u3074\u3087	pyo
\u3075	hu	\u3075\u3041	fa	\u3075\u3043	fi	\u3075\u3047	fe	\u3075\u3049	fo
\u3076	bu	\u3077	pu	\u3078	he	\u3079	be	\u307a	pe
\u307b	ho	\u307c	bo	\u307d	po

\u307e	ma	\u307f	mi	\u307f\u3083	mya	\u307f\u3085	myu	\u307f\u3087	myo
\u3080	mu	\u3081	me	\u3082	mo

\u3083	xya	\u3084	ya	\u3085	xyu	\u3086	yu	\u3087	xyo
\u3088	yo

\u3089	ra	\u308a	ri	\u308a\u3083	rya	\u308a\u3085	ryu	\u308a\u3087	ryo
\u308b	ru	\u308c	re	\u308d	ro

\u308e	xwa	\u308f	wa	\u3090	wi	\u3091	we
\u3092	wo	\u3093	n

\u3093     n'
\u3067\u3043   dyi
\u30fc     -
\u3061\u3047    tye
\u3063\u3061\u3047	ttye
\u3058\u3047	zye
	]]>),
 
	HEPBURNTAB : String(<![CDATA[ 
\u3041	xa	\u3042	a	\u3043	xi	\u3044	i	\u3045	xu
\u3046	u	\u3046\u309b	vu	\u3046\u309b\u3041	va	\u3046\u309b\u3043	vi	\u3046\u309b\u3047	ve
\u3046\u309b\u3049	vo	\u3047	xe	\u3048	e	\u3049	xo	\u304a	o


\u304b	ka	\u304c	ga	\u304d	ki	\u304d\u3083	kya	\u304d\u3085	kyu
\u304d\u3087	kyo	\u304e	gi	\u304e\u3083	gya	\u304e\u3085	gyu	\u304e\u3087	gyo
\u304f	ku	\u3050	gu	\u3051	ke	\u3052	ge	\u3053	ko
\u3054	go

\u3055	sa	\u3056	za	\u3057	shi	\u3057\u3083	sha	\u3057\u3085	shu
\u3057\u3087	sho	\u3058	ji	\u3058\u3083	ja	\u3058\u3085	ju	\u3058\u3087	jo
\u3059	su	\u305a	zu	\u305b	se	\u305c	ze	\u305d	so
\u305e	zo

\u305f	ta	\u3060	da	\u3061	chi	\u3061\u3083	cha	\u3061\u3085	chu
\u3061\u3087	cho	\u3062	di	\u3062\u3083	dya	\u3062\u3085	dyu	\u3062\u3087	dyo

\u3063	xtsu
\u3063\u3046\u309b	vvu	\u3063\u3046\u309b\u3041	vva	\u3063\u3046\u309b\u3043	vvi
\u3063\u3046\u309b\u3047	vve	\u3063\u3046\u309b\u3049	vvo
\u3063\u304b	kka	\u3063\u304c	gga	\u3063\u304d	kki	\u3063\u304d\u3083	kkya
\u3063\u304d\u3085	kkyu	\u3063\u304d\u3087	kkyo	\u3063\u304e	ggi	\u3063\u304e\u3083	ggya
\u3063\u304e\u3085	ggyu	\u3063\u304e\u3087	ggyo	\u3063\u304f	kku	\u3063\u3050	ggu
\u3063\u3051	kke	\u3063\u3052	gge	\u3063\u3053	kko	\u3063\u3054	ggo	\u3063\u3055	ssa
\u3063\u3056	zza	\u3063\u3057	sshi	\u3063\u3057\u3083	ssha
\u3063\u3057\u3085	sshu	\u3063\u3057\u3087	ssho
\u3063\u3058	jji	\u3063\u3058\u3083	jja	\u3063\u3058\u3085	jju	\u3063\u3058\u3087	jjo
\u3063\u3059	ssu	\u3063\u305a	zzu	\u3063\u305b	sse	\u3063\u305c	zze	\u3063\u305d	sso
\u3063\u305e	zzo	\u3063\u305f	tta	\u3063\u3060	dda	\u3063\u3061	cchi
\u3063\u3061\u3083	ccha	\u3063\u3061\u3085	cchu	\u3063\u3061\u3087	ccho	\u3063\u3062	ddi
\u3063\u3062\u3083	ddya	\u3063\u3062\u3085	ddyu	\u3063\u3062\u3087	ddyo	\u3063\u3064	ttsu
\u3063\u3065	ddu	\u3063\u3066	tte	\u3063\u3067	dde	\u3063\u3068	tto	\u3063\u3069	ddo
\u3063\u306f	hha	\u3063\u3070	bba	\u3063\u3071	ppa	\u3063\u3072	hhi
\u3063\u3072\u3083	hhya	\u3063\u3072\u3085	hhyu	\u3063\u3072\u3087	hhyo	\u3063\u3073	bbi
\u3063\u3073\u3083	bbya	\u3063\u3073\u3085	bbyu	\u3063\u3073\u3087	bbyo	\u3063\u3074	ppi
\u3063\u3074\u3083	ppya	\u3063\u3074\u3085	ppyu	\u3063\u3074\u3087	ppyo	\u3063\u3075	ffu
\u3063\u3075\u3041	ffa	\u3063\u3075\u3043	ffi	\u3063\u3075\u3047	ffe	\u3063\u3075\u3049	ffo
\u3063\u3076	bbu	\u3063\u3077	ppu	\u3063\u3078	hhe	\u3063\u3079	bbe	\u3063\u307a	ppe
\u3063\u307b	hho	\u3063\u307c	bbo	\u3063\u307d	ppo	\u3063\u3084	yya	\u3063\u3086	yyu
\u3063\u3088	yyo	\u3063\u3089	rra	\u3063\u308a	rri	\u3063\u308a\u3083	rrya
\u3063\u308a\u3085	rryu	\u3063\u308a\u3087	rryo	\u3063\u308b	rru	\u3063\u308c	rre
\u3063\u308d	rro

\u3064	tsu	\u3065	du	\u3066	te	\u3067	de	\u3068	to
\u3069	do

\u306a	na	\u306b	ni	\u306b\u3083	nya	\u306b\u3085	nyu	\u306b\u3087	nyo
\u306c	nu	\u306d	ne	\u306e	no

\u306f	ha	\u3070	ba	\u3071	pa	\u3072	hi	\u3072\u3083	hya
\u3072\u3085	hyu	\u3072\u3087	hyo	\u3073	bi	\u3073\u3083	bya	\u3073\u3085	byu
\u3073\u3087	byo	\u3074	pi	\u3074\u3083	pya	\u3074\u3085	pyu	\u3074\u3087	pyo
\u3075	fu	\u3075\u3041	fa	\u3075\u3043	fi	\u3075\u3047	fe	\u3075\u3049	fo
\u3076	bu	\u3077	pu	\u3078	he	\u3079	be	\u307a	pe
\u307b	ho	\u307c	bo	\u307d	po

\u307e	ma	\u307f	mi	\u307f\u3083	mya	\u307f\u3085	myu	\u307f\u3087	myo
\u3080	mu	\u3081	me	\u3082	mo

\u3083	xya	\u3084	ya	\u3085	xyu	\u3086	yu	\u3087	xyo
\u3088	yo

\u3089	ra	\u308a	ri	\u308a\u3083	rya	\u308a\u3085	ryu	\u308a\u3087	ryo
\u308b	ru	\u308c	re	\u308d	ro

\u308e	xwa	\u308f	wa	\u3090	wi	\u3091	we
\u3092	wo	\u3093	n

\u3093     n'
\u3067\u3043   dyi
\u30fc     -
\u3061\u3047    che
\u3063\u3061\u3047	cche
\u3058\u3047	je
	]]>),
 
	get ROMKAN() 
	{
		if (!this._ROMKAN) {
			this.init();
		}
		return this._ROMKAN;
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
	
	get KANPAT() 
	{
		if (!this._KANPAT) {
			this.init();
		}
		return this._KANPAT;
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
 
