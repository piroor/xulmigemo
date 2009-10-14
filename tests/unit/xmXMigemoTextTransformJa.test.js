utils.include('xmXMigemoClasses.inc.js');

var transform;

function setUp()
{
	transform = new xmXMigemoTextTransformJa();
}

function tearDown()
{
	transform = null;
}


test_optimizeRegExp.parameters = {
	singleCharacters            : ['[abc]', '(a|b|c)'],
	singleCharactersWithBlank   : ['[abc]', '(a|||b|||c)'],
	multipleCharacters          : ['(a|b|cd)', '(a|b|cd)'],
	multipleCharactersWithBlank : ['(a|b|cd)', '(a|||b|||cd)'],
	includesOpenParen           : ['(\\()', '(\\()'],
	includesCloseParen          : ['(\\))', '(\\))'],
	includesParen               : ['(\\(\\))', '(\\(\\))'],
	includesFullWidthOpenParen  : ['(\\(|（)', '(\\(|（)'],
	includesFullWidthCloseParen : ['(\\)|）)', '(\\)|）)'],
	includesFullWidthParen      : ['((\\(|（)(\\)|）))', '((\\(|（)(\\)|）))'],
	includesOpenBracket         : ['(\\[)', '(\\[)'],
	includesCloseBracket        : ['(\\])', '(\\])'],
	includesBracket             : ['(\\[\\])', '(\\[\\])'],
	includesFullWidthOpenBracket : ['(\\[|［)', '(\\[|［)'],
	includesFullWidthCloseBracket : ['(\\]|］)', '(\\]|］)'],
	includesFullWidthBracketAndParen : ['((\\[|［)(\\]|］))', '((\\[|［)(\\]|］))']
};
function test_optimizeRegExp(aParameter)
{
	assert.equals(aParameter[0], transform.optimizeRegExp(aParameter[1]));
}


test_normalizeInput.parameters = {
	alphabets          : ['aiueo', 'aiueo'],
	fullWidthAlphabets : ['aiueo', 'ａｉｕｅｏ'],
	hiragana           : ['あいうえお', 'あいうえお'],
	katakana           : ['あいうえお', 'アイウエオ'],
	halfWidthKatakana  : ['あいうえお', 'ｱｲｳｴｵ'],
	'濁音付き半角カナ' : ['がぎぐげご', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ'],
	includesHyphen     : ['po-to', 'po-to'],
	kanji              : ['日本語', '日本語'],
	specialCharacters  : ['()[]|', '()[]|'],
	openParen          : ['([', '(['],
	closeParen         : [')]', ')]'],
	pipe               : ['|', '|'],
	JSCode             : ['window.open();', 'window.open();'],
	JSCodeWithParams   : ['window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");']
};
function test_normalizeInput(aParameter)
{
	assert.equals(aParameter[0], transform.normalizeInput(aParameter[1]));
}

test_normalizeKeyInput.parameters = {
	alphabets          : ['aiueo', 'aiueo'],
	fullWidthAlphabets : ['aiueo', 'ａｉｕｅｏ'],
	hiragana           : ['aiueo', 'あいうえお'],
	katakana           : ['aiueo', 'アイウエオ'],
	halfWidthKatakana  : ['aiueo', 'ｱｲｳｴｵ'],
	'濁音付き半角カナ' : ['gagigugego', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ'],
	includesHyphen     : ['po-to', 'po-to'],
	kanji              : ['日本語', '日本語'],
	specialCharacters  : ['()[]|', '()[]|'],
	openParen          : ['([', '(['],
	closeParen         : [')]', ')]'],
	pipe               : ['|', '|'],
	JSCode             : ['window.open();', 'window.open();'],
	JSCodeWithParams   : ['window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");']
};
function test_normalizeKeyInput(aParameter)
{
	assert.equals(aParameter[0], transform.normalizeKeyInput(aParameter[1]));
}


var roman2kanaRawPatterns = {
	// [input, hiragana, katakana, mixed]
	'濁点無し'         : ['aiueo',
	                      'あいうえお',
	                      '[アｱ][イｲ][ウｳ][エｴ][オｵ]',
	                      '[あアｱ][いイｲ][うウｳ][えエｴ][おオｵ]'],
	'濁点有り'         : ['gagigugego',
	                      'がぎぐげご',
	                      '(ガ|ｶﾞ)(ギ|ｷﾞ)(グ|ｸﾞ)(ゲ|ｹﾞ)(ゴ|ｺﾞ)',
	                      '(が|ガ|ｶﾞ)(ぎ|ギ|ｷﾞ)(ぐ|グ|ｸﾞ)(げ|ゲ|ｹﾞ)(ご|ゴ|ｺﾞ)'],
	'濁点混じり'       : ['nihongo',
	                      'にほんご',
	                      '[ニﾆ][ホﾎ][ンﾝ](ゴ|ｺﾞ)',
	                      '[にニﾆ][ほホﾎ][んンﾝ](ご|ゴ|ｺﾞ)'],
	includesHyphen     : ['po-to',
	                      'ぽーと',
	                      '(ポ|ﾎﾟ)[ーｰ-][トﾄ]',
	                      '(ぽ|ポ|ﾎﾟ)[ーｰ-][とトﾄ]'],
	'拗音・撥音'       : ['kyakkya',
	                      'きゃっきゃ',
	                      '[キｷ][ャｬ][ッｯ][キｷ][ャｬ]',
	                      '[きキｷ][ゃャｬ][っッｯ][きキｷ][ゃャｬ]'],
	yayoi              : ['uwwu-',
	                      'うっうー',
	                      '[ウｳ][ッｯ][ウｳ][ーｰ-]',
	                      '[うウｳ][っッｯ][うウｳ][ーｰ-]'],
	fullWidthAlphabets : ['ａｉｕｅｏ',
	                      'ａｉｕｅｏ',
	                      'ａｉｕｅｏ',
	                      'ａｉｕｅｏ'],
	paren              : ['\\(\\)\\[\\]\\|',
	                      '\\(\\)\\[\\]\\|',
	                      '\\(\\)\\[\\]\\|',
	                      '\\(\\)\\[\\]\\|'],
	openParen          : ['\\(\\[',
	                      '\\(\\[',
	                      '\\(\\[',
	                      '\\(\\['],
	closeParen         : ['\\)\\]',
	                      '\\)\\]',
	                      '\\)\\]',
	                      '\\)\\]'],
	pipe               : ['\\|',
	                      '\\|',
	                      '\\|',
	                      '\\|'],
};

var roman2kanaMatchingPatterns = {
	// [roman-input,
	//  expected-hiragana(s), unexpected-hiragana(s),
	//  expected-katakana(s), unexpected-katakana(s),
	//  expected-mixed(s), unexpected-mixed(s)]
	'N1個で「ん」'           : ['kantoku',
	                            ['かんとく'], ['カントク'],
	                            ['カントク', 'ｶﾝﾄｸ'], ['かんとく'],
	                            ['かンとく'], []],
	'N2個で「ん」'           : ['kanntoku',
	                            ['かんとく'], ['カントク'],
	                            ['カントク', 'ｶﾝﾄｸ'], ['かんとく'],
	                            ['かンとく'], []],
//	'な行の後にN1個で「ん」' : ['nannin',
//	                            ['なんにん'], ['ナンニン'],
//	                            ['ナンニン', 'ﾅﾝﾆﾝ'], ['なんにん'],
//	                            ['なんニン', 'ナンニん'], []],
	'な行の後にN2個で「ん」' : ['nannnin',
	                            ['なんにん'], ['ナンニン'],
	                            ['ナンニン', 'ﾅﾝﾆﾝ'], ['なんにん'],
	                            ['なんニン', 'ナンニん'], []],
	WE                       : ['werukamu',
	                            ['うぇるかむ'], ['ウェルカム'],
	                            ['ウェルカム', 'ｳｪﾙｶﾑ'], ['うぇるかむ'],
	                            ['ウぇるカむ', 'ゑるカム'], []],
	VE                       : ['vekuta-',
	                            ['う゛ぇくたー'], ['ヴェクター'],
	                            ['ヴェクター', 'ｳﾞｪｸﾀｰ'], ['う゛ぇくたー'],
	                            [], []],
	VEandDHI                 : ['verudhi',
	                            ['う゛ぇるでぃ'], ['ヴェルディ'],
	                            ['ヴェルディ', 'ｳﾞｪﾙﾃﾞｨ'], ['う゛ぇるでぃ'],
	                            [], []]
};

test_roman2kana.parameters = roman2kanaRawPatterns;
function test_roman2kana(aParameter)
{
	assert.equals(aParameter[1], transform.roman2kana(aParameter[0]));
}

test_roman2kana_patterns.parameters = roman2kanaMatchingPatterns;
function test_roman2kana_patterns(aParameter)
{
	var regexp = transform.roman2kana(aParameter[0]);
	regexp = new RegExp(regexp, 'i');
	aParameter[1].forEach(function(aExpected) {
		assert.pattern(aExpected, regexp);
	});
}

test_roman2kana2.parameters = roman2kanaRawPatterns;
function test_roman2kana2(aParameter)
{
	assert.equals(aParameter[1], transform.roman2kana2(aParameter[0], transform.KANA_HIRA));
	assert.equals(aParameter[2], transform.roman2kana2(aParameter[0], transform.KANA_KATA));
	assert.equals(aParameter[3], transform.roman2kana2(aParameter[0], transform.KANA_ALL));
}

test_roman2kana2_patterns.parameters = roman2kanaMatchingPatterns;
function test_roman2kana2_patterns(aParameter)
{
	var regexp = transform.roman2kana2(aParameter[0], transform.KANA_HIRA);
	regexp = new RegExp(regexp, 'i');
	aParameter[1].forEach(function(aExpected) {
		assert.pattern(aExpected, regexp);
	});
	aParameter[2].forEach(function(aUnexpected) {
		assert.notPattern(aUnexpected, regexp);
	});

	regexp = transform.roman2kana2(aParameter[0], transform.KANA_KATA);
	regexp = new RegExp(regexp, 'i');
	aParameter[3].forEach(function(aExpected) {
		assert.pattern(aExpected, regexp);
	});
	aParameter[4].forEach(function(aUnexpected) {
		assert.notPattern(aUnexpected, regexp);
	});

	regexp = transform.roman2kana2(aParameter[0], transform.KANA_ALL);
	regexp = new RegExp(regexp, 'i');
	[].concat(aParameter[1], aParameter[3], aParameter[5]).forEach(function(aExpected) {
		assert.pattern(aExpected, regexp);
	});
	aParameter[6].forEach(function(aUnexpected) {
		assert.notPattern(aUnexpected, regexp);
	});
}


var convertFromHiraganaRawPatterns = {
	// [input-hiragana, output-roman, output-katakana, output-katakana-pattern]
	alphabets          : ['aiueo',
	                      'aiueo',
	                      'aiueo',
	                      'aiueo'],
	fullWidthAlphabets : ['ａｉｕｅｏ',
	                      'ａｉｕｅｏ',
	                      'ａｉｕｅｏ',
	                      'ａｉｕｅｏ'],
	hriagana           : ['あいうえお',
	                      'aiueo',
	                      'アイウエオ',
	                      '(ア|ｱ)(イ|ｲ)(ウ|ｳ)(エ|ｴ)(オ|ｵ)'],
	katakana           : ['アイウエオ',
	                      'アイウエオ',
	                      'アイウエオ',
	                      'アイウエオ'],
	halfWidthKatakana  : ['ｱｲｳｴｵ',
	                      'ｱｲｳｴｵ',
	                      'ｱｲｳｴｵ',
	                      'ｱｲｳｴｵ'],
	'濁点付き半角カナ' : ['ｶﾞｷﾞｸﾞｹﾞｺﾞ',
	                      'ｶﾞｷﾞｸﾞｹﾞｺﾞ',
	                      'ガギグゲゴ',
	                      'ガギグゲゴ'],
	VU                 : ['う゛',
	                      'vu',
	                      'ヴ',
	                      '(ヴ|ｳﾞ)'],
	includesHyphen     : ['po-to',
	                      'po-to',
	                      'po-to',
	                      'po-to'],
	'音引き'           : ['ぽーと',
	                      'po-to',
	                      'ポート',
	                      '(ポ|ﾎﾟ)(ー|ｰ|-)(ト|ﾄ)'],
	kanji              : ['日本語',
	                      '日本語',
	                      '日本語',
	                      '日本語'],
	paren              : ['()[]|',
	                      '()[]|',
	                      '()[]|',
	                      '()[]|'],
	openParen          : ['([',
	                      '([',
	                      '([',
	                      '(['],
	closeParen         : [')]',
	                      ')]',
	                      ')]',
	                      ')]'],
	pipe               : ['|',
	                      '|',
	                      '|',
	                      '|'],
	JSCode             : ['window.open();',
	                      'window.open();',
	                      'window.open();',
	                      'window.open();'],
	JSCodeWithParams   : ['window.open("about:blank", "_blank", "all");',
	                      'window.open("about:blank", "_blank", "all");',
	                      'window.open("about:blank", "_blank", "all");',
	                      'window.open("about:blank", "_blank", "all");']
};

test_hira2roman.parameters = convertFromHiraganaRawPatterns;
function test_hira2roman(aParameter)
{
	assert.equals(aParameter[1], transform.hira2roman(aParameter[0]));
}

test_hira2kata.parameters = convertFromHiraganaRawPatterns;
function test_hira2kata(aParameter)
{
	assert.equals(aParameter[2], transform.hira2kata(aParameter[0]));
}

test_hira2kataPattern.parameters = convertFromHiraganaRawPatterns;
function test_hira2kataPattern(aParameter)
{
	assert.equals(aParameter[3], transform.hira2kataPattern(aParameter[0]));
}


test_kata2hira.parameters = {
	alphabets          : ['aiueo', 'aiueo'],
	fullWidthAlphabets : ['ａｉｕｅｏ', 'ａｉｕｅｏ'],
	hiragana           : ['あいうえお', 'あいうえお'],
	katakana           : ['アイウエオ', 'あいうえお'],
	halfWidthKatakana  : ['ｱｲｳｴｵ', 'あいうえお'],
	'濁点付き半角カナ' : ['ｶﾞｷﾞｸﾞｹﾞｺﾞ', 'がぎぐげご'],
	includesHyphen     : ['po-to', 'po-to'],
	kanji              : ['日本語', '日本語'],
	paren              : ['()[]|', '()[]|'],
	openParen          : ['([', '(['],
	closeParen         : [')]', ')]'],
	pipe               : ['|', '|'],
	JSCode             : ['window.open();', 'window.open();'],
	JSCodeWithParams   : ['window.open("about:blank", "_blank", "all");',
	                      'window.open("about:blank", "_blank", "all");']
};
function test_kata2hira(aParameter)
{
	assert.equals(aParameter[1], transform.kata2hira(aParameter[0]));
}

function test_zenkaku2hankaku()
{
	function assertZenkaku2Hankaku(aExpected, aInput) {
		assert.equals(aExpected, transform.zenkaku2hankaku(aInput));
	}
	assertZenkaku2Hankaku('aiueo', 'aiueo');
	assertZenkaku2Hankaku('aiueo', 'ａｉｕｅｏ');
	assertZenkaku2Hankaku('あいうえお', 'あいうえお');
	assertZenkaku2Hankaku('アイウエオ', 'アイウエオ');
	assertZenkaku2Hankaku('ｱｲｳｴｵ', 'ｱｲｳｴｵ');
	assertZenkaku2Hankaku('ｶﾞｷﾞｸﾞｹﾞｺﾞ', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertZenkaku2Hankaku('po-to', 'po-to');
	assertZenkaku2Hankaku('日本語', '日本語');
	assertZenkaku2Hankaku('()[]|', '()[]|');
	assertZenkaku2Hankaku('([', '([');
	assertZenkaku2Hankaku(')]', ')]');
	assertZenkaku2Hankaku('|', '|');
	assertZenkaku2Hankaku('window.open();', 'window.open();');
	assertZenkaku2Hankaku('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');
}

function test_roman2zen()
{
	function assertRoman2Zen(aExpected, aInput) {
		assert.equals(aExpected, transform.roman2zen(aInput));
	}
	assertRoman2Zen('ａｉｕｅｏ', 'aiueo');
	assertRoman2Zen('ａｉｕｅｏ', 'ａｉｕｅｏ');
	assertRoman2Zen('あいうえお', 'あいうえお');
	assertRoman2Zen('アイウエオ', 'アイウエオ');
	assertRoman2Zen('ｱｲｳｴｵ', 'ｱｲｳｴｵ');
	assertRoman2Zen('ｶﾞｷﾞｸﾞｹﾞｺﾞ', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertRoman2Zen('ｐｏ－ｔｏ', 'po-to');
	assertRoman2Zen('日本語', '日本語');
	assertRoman2Zen('（）［］｜', '()[]|');
	assertRoman2Zen('（［', '([');
	assertRoman2Zen('）］', ')]');
	assertRoman2Zen('｜', '|');
}

function test_normalizeForYomi()
{
	function assertNormalizeForYomi(aExpected, aInput) {
		assert.equals(aExpected, transform.normalizeForYomi(aInput));
	}
	assertNormalizeForYomi('aiueo', 'aiueo');
	assertNormalizeForYomi('あいうえお', 'あいうえお');
	assertNormalizeForYomi('あいうえお', 'アイウエオ');
	assertNormalizeForYomi('あいうえお', 'ｱｲｳｴｵ');
	assertNormalizeForYomi('がぎぐげご', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertNormalizeForYomi('po-to', 'po-to');
	assertNormalizeForYomi('日本語', '日本語');
	assertNormalizeForYomi('()[]|', '()[]|');
	assertNormalizeForYomi('([', '([');
	assertNormalizeForYomi(')]', ')]');
	assertNormalizeForYomi('|', '|');
}

function test_isYomi()
{
	function assertIsYomi(aExpected, aInput) {
		if (aExpected)
			assert.isTrue(transform.isYomi(aInput));
		else
			assert.isFalse(transform.isYomi(aInput));
	}
	assertIsYomi(true, 'aiueo');
	assertIsYomi(true, 'alphabet');
	assertIsYomi(true, 'happy99');
	assertIsYomi(true, 'アイウエオ');
	assertIsYomi(true, 'ｱｲｳｴｵ');
	assertIsYomi(true, 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertIsYomi(true, 'po-to');
	assertIsYomi(false, '日本語');
	assertIsYomi(false, '()[]|');
	assertIsYomi(false, '([');
	assertIsYomi(false, ')]');
	assertIsYomi(false, '|');
	assertIsYomi(false, 'window.open();');
	assertIsYomi(false, 'window.open("about:blank", "_blank", "all");');
}

function test_joinVoiceMarks()
{
	function assertJoinVoiceMarks(aExpected, aInput) {
		assert.equals(aExpected, transform.joinVoiceMarks(aInput));
	}
	assertJoinVoiceMarks('aiueo', 'aiueo');
	assertJoinVoiceMarks('ａｉｕｅｏ', 'ａｉｕｅｏ');
	assertJoinVoiceMarks('あいうえお', 'あいうえお');
	assertJoinVoiceMarks('アイウエオ', 'アイウエオ');
	assertJoinVoiceMarks('がぎぐげご', 'がぎぐげご');
	assertJoinVoiceMarks('がぎぐげご', 'か゛き゛く゛け゛こ゛');
	assertJoinVoiceMarks('ぱぴぷぺぽ', 'は゜ひ゜ふ゜へ゜ほ゜');
	assertJoinVoiceMarks('あ゛い゛う゛え゛お゛', 'あ゛い゛う゛え゛お゛');
	assertJoinVoiceMarks('ｱｲｳｴｵ', 'ｱｲｳｴｵ');
	assertJoinVoiceMarks('ガギグゲゴ', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertJoinVoiceMarks('ガギグゲゴ', 'カ゛キ゛ク゛ケ゛コ゛');
	assertJoinVoiceMarks('パピプペポ', 'ハ゜ヒ゜フ゜ヘ゜ホ゜');
	assertJoinVoiceMarks('ア゛イ゛ヴエ゛オ゛', 'ア゛イ゛ウ゛エ゛オ゛');
	assertJoinVoiceMarks('po-to', 'po-to');
	assertJoinVoiceMarks('日本語', '日本語');
	assertJoinVoiceMarks('()[]|', '()[]|');
	assertJoinVoiceMarks('([', '([');
	assertJoinVoiceMarks(')]', ')]');
	assertJoinVoiceMarks('|', '|');
	assertJoinVoiceMarks('window.open();', 'window.open();');
	assertJoinVoiceMarks('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');
}


function test_expand()
{
	function assertExpand(aExpected, aInput) {
		var regexp = transform.expand(aInput);
		regexp = new RegExp(regexp, 'i');
		assert.pattern(aExpected, regexp);
	}
	assertExpand('け', 'k');
	assertExpand('かかあ', 'かk');
	assertExpand('かこ', 'かk');
	assertExpand('かっか', 'かk');
	assertExpand('ー', '-');
	assertExpand('おー', 'お-');

	function assertExpand2(aExpected, aInput, aType) {
		var regexp = transform.expand2(aInput, aType);
		regexp = new RegExp(regexp, 'i');
		assert.pattern(aExpected, regexp);
	}
	assertExpand2('ー', '-', transform.KANA_HIRA);
	assertExpand2('ー', '-', transform.KANA_KATA);
	assertExpand2('ｰ', '-', transform.KANA_KATA);
	assertExpand2('-', '-', transform.KANA_KATA);
	assertExpand2('ー', '-', transform.KANA_ALL);
	assertExpand2('ｰ', '-', transform.KANA_ALL);
	assertExpand2('-', '-', transform.KANA_ALL);

	assertExpand2('おー', 'お-', transform.KANA_HIRA);
	assertExpand2('おー', 'お-', transform.KANA_KATA);
	assertExpand2('おｰ', 'お-', transform.KANA_KATA);
	assertExpand2('お-', 'お-', transform.KANA_KATA);
	assertExpand2('おー', 'お-', transform.KANA_ALL);
	assertExpand2('おｰ', 'お-', transform.KANA_ALL);
	assertExpand2('お-', 'お-', transform.KANA_ALL);
}

