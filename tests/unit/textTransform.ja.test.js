utils.include('classes.inc.js');

var transform;

function setUp()
{
	transform = MigemoTextTransformJa;
}

function tearDown()
{
	transform = null;
}


var convertPatterns = utils.readParametersFromCSV("textTransformJa_convertPatterns.csv", "UTF-8");

test_optimizeRegExp.parameters = {
	singleCharacters                 : ['(a|b|c)', '[abc]'],
	singleCharactersWithBlank        : ['(a|||b|||c)', '[abc]'],
	multipleCharacters               : ['(a|b|cd)', '(a|b|cd)'],
	multipleCharactersWithBlank      : ['(a|||b|||cd)', '(a|b|cd)'],
	includesOpenParen                : ['(\\()', '(\\()'],
	includesCloseParen               : ['(\\))', '(\\))'],
	includesParen                    : ['(\\(\\))', '(\\(\\))'],
	includesFullWidthOpenParen       : ['(\\(|（)', '(\\(|（)'],
	includesFullWidthCloseParen      : ['(\\)|）)', '(\\)|）)'],
	includesFullWidthParen           : ['((\\(|（)(\\)|）))', '((\\(|（)(\\)|）))'],
	includesOpenBracket              : ['(\\[)', '(\\[)'],
	includesCloseBracket             : ['(\\])', '(\\])'],
	includesBracket                  : ['(\\[\\])', '(\\[\\])'],
	includesFullWidthOpenBracket     : ['(\\[|［)', '(\\[|［)'],
	includesFullWidthCloseBracket    : ['(\\]|］)', '(\\]|］)'],
	includesFullWidthBracketAndParen : ['((\\[|［)(\\]|］))', '((\\[|［)(\\]|］))']
};
function test_optimizeRegExp(aParameter)
{
	assert.equals(aParameter[1], transform.optimizeRegExp(aParameter[0]));
}


test_normalizeInput.parameters = convertPatterns;
function test_normalizeInput(aParameter)
{
	assert.equals(aParameter.toNormalizedInput, transform.normalizeInput(aParameter.input));
}

test_normalizeKeyInput.parameters = convertPatterns;
function test_normalizeKeyInput(aParameter)
{
	assert.equals(aParameter.toNormalizedKeyInput, transform.normalizeKeyInput(aParameter.input));
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


test_hira2roman.parameters = convertPatterns;
function test_hira2roman(aParameter)
{
	assert.equals(aParameter.toRoman, transform.hira2roman(aParameter.input));
}

test_hira2kata.parameters = convertPatterns;
function test_hira2kata(aParameter)
{
	assert.equals(aParameter.toKatakana, transform.hira2kata(aParameter.input));
}

test_hira2kataPattern.parameters = convertPatterns;
function test_hira2kataPattern(aParameter)
{
	assert.equals(aParameter.toKatakanaPattern, transform.hira2kataPattern(aParameter.input));
}

test_kata2hira.parameters = convertPatterns;
function test_kata2hira(aParameter)
{
	assert.equals(aParameter.toHiragana, transform.kata2hira(aParameter.input));
}

test_zenkaku2hankaku.parameters = convertPatterns;
function test_zenkaku2hankaku(aParameter)
{
	assert.equals(aParameter.toHankaku, transform.zenkaku2hankaku(aParameter.input));
}

test_roman2zen.parameters = convertPatterns;
function test_roman2zen(aParameter)
{
	assert.equals(aParameter.toRomanZenkaku, transform.roman2zen(aParameter.input));
}

test_normalizeForYomi.parameters = convertPatterns;
function test_normalizeForYomi(aParameter)
{
	assert.equals(aParameter.toYomi, transform.normalizeForYomi(aParameter.input));
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

