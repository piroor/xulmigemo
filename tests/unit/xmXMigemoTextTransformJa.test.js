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


function test_optimizeRegExp()
{
	function assertOptimizeRegExp(aExpected, aInput) {
		assert.equals(aExpected, transform.optimizeRegExp(aInput));
	}
	assertOptimizeRegExp('[abc]', '(a|b|c)');
	assertOptimizeRegExp('[abc]', '(a|||b|||c)');
	assertOptimizeRegExp('(a|b|cd)', '(a|b|cd)');
	assertOptimizeRegExp('(a|b|cd)', '(a|||b|||cd)');
	assertOptimizeRegExp('(\\()', '(\\()');
	assertOptimizeRegExp('(\\))', '(\\))');
	assertOptimizeRegExp('(\\(\\))', '(\\(\\))');
	assertOptimizeRegExp('(\\(|（)', '(\\(|（)');
	assertOptimizeRegExp('(\\)|）)', '(\\)|）)');
	assertOptimizeRegExp('((\\(|（)(\\)|）))', '((\\(|（)(\\)|）))');
	assertOptimizeRegExp('(\\[)', '(\\[)');
	assertOptimizeRegExp('(\\])', '(\\])');
	assertOptimizeRegExp('(\\[\\])', '(\\[\\])');
	assertOptimizeRegExp('(\\[|［)', '(\\[|［)');
	assertOptimizeRegExp('(\\]|］)', '(\\]|］)');
	assertOptimizeRegExp('((\\[|［)(\\]|］))', '((\\[|［)(\\]|］))');
}


function test_normalizeInput()
{
	function assertNormalizeInput(aExpected, aInput) {
		assert.equals(aExpected, transform.normalizeInput(aInput));
	}
	assertNormalizeInput('aiueo', 'aiueo');
	assertNormalizeInput('aiueo', 'ａｉｕｅｏ');
	assertNormalizeInput('あいうえお', 'あいうえお');
	assertNormalizeInput('あいうえお', 'アイウエオ');
	assertNormalizeInput('あいうえお', 'ｱｲｳｴｵ');
	assertNormalizeInput('がぎぐげご', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertNormalizeInput('po-to', 'po-to');
	assertNormalizeInput('日本語', '日本語');
	assertNormalizeInput('()[]|', '()[]|');
	assertNormalizeInput('([', '([');
	assertNormalizeInput(')]', ')]');
	assertNormalizeInput('|', '|');
	assertNormalizeInput('window.open();', 'window.open();');
	assertNormalizeInput('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');
}

function test_normalizeKeyInput()
{
	function assertNormalizeKeyInput(aExpected, aInput) {
		assert.equals(aExpected, transform.normalizeKeyInput(aInput));
	}
	assertNormalizeKeyInput('aiueo', 'aiueo');
	assertNormalizeKeyInput('aiueo', 'ａｉｕｅｏ');
	assertNormalizeKeyInput('aiueo', 'あいうえお');
	assertNormalizeKeyInput('aiueo', 'アイウエオ');
	assertNormalizeKeyInput('aiueo', 'ｱｲｳｴｵ');
	assertNormalizeKeyInput('gagigugego', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertNormalizeKeyInput('po-to', 'po-to');
	assertNormalizeKeyInput('日本語', '日本語');
	assertNormalizeKeyInput('()[]|', '()[]|');
	assertNormalizeKeyInput('([', '([');
	assertNormalizeKeyInput(')]', ')]');
	assertNormalizeKeyInput('|', '|');
	assertNormalizeKeyInput('window.open();', 'window.open();');
	assertNormalizeKeyInput('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');
}



function test_roman2kana()
{
	function assertRoman2Kana(aExpected, aInput) {
		assert.equals(aExpected, transform.roman2kana(aInput));
	}
	assertRoman2Kana('あいうえお', 'aiueo');
	assertRoman2Kana('ａｉｕｅｏ', 'ａｉｕｅｏ');
	assertRoman2Kana('がぎぐげご', 'gagigugego');
	assertRoman2Kana('にほんご', 'nihongo');
	assertRoman2Kana('ぽーと', 'po-to');
	assertRoman2Kana('きゃっきゃ', 'kyakkya');
	assertRoman2Kana('うっうー', 'uwwu-');
	assertRoman2Kana('\\(\\)\\[\\]\\|', '\\(\\)\\[\\]\\|');
	assertRoman2Kana('\\(\\[', '\\(\\[');
	assertRoman2Kana('\\)\\]', '\\)\\]');
	assertRoman2Kana('\\|', '\\|');

	function assertRoman2KanaPattern(aExpected, aInput) {
		var regexp = transform.roman2kana(aInput);
		regexp = new RegExp(regexp, 'i');
		assert.pattern(aExpected, regexp);
	}
	assertRoman2KanaPattern('かんとく', 'kantoku');
	assertRoman2KanaPattern('かんとく', 'kanntoku');
//	assertRoman2KanaPattern('なんにん', 'nannin');
	assertRoman2KanaPattern('なんにん', 'nannnin');
	assertRoman2KanaPattern('うぇるかむ', 'werukamu');
}

function test_roman2kana2()
{
	function assertRoman2Kana2(aExpected, aInput, aType) {
		assert.equals(aExpected, transform.roman2kana2(aInput, aType));
	}
	function assertRoman2Kana2Pattern(aExpected, aUnexpected, aInput, aType) {
		var regexp = transform.roman2kana2(aInput, aType);
		regexp = new RegExp(regexp, 'i');
		assert.pattern(aExpected, regexp);
		if (aUnexpected)
			assert.notPattern(aUnexpected, regexp);
	}
	assertRoman2Kana2('あいうえお', 'aiueo', transform.KANA_HIRA);
	assertRoman2Kana2('がぎぐげご', 'gagigugego', transform.KANA_HIRA);
	assertRoman2Kana2('にほんご', 'nihongo', transform.KANA_HIRA);
	assertRoman2Kana2('ぽーと', 'po-to', transform.KANA_HIRA);
	assertRoman2Kana2('きゃっきゃ', 'kyakkya', transform.KANA_HIRA);
	assertRoman2Kana2('うっうー', 'uwwu-', transform.KANA_HIRA);
	assertRoman2Kana2('ａｉｕｅｏ', 'ａｉｕｅｏ', transform.KANA_HIRA);
	assertRoman2Kana2('\\(\\)\\[\\]\\|', '\\(\\)\\[\\]\\|', transform.KANA_HIRA);
	assertRoman2Kana2('\\(\\[', '\\(\\[', transform.KANA_HIRA);
	assertRoman2Kana2('\\)\\]', '\\)\\]', transform.KANA_HIRA);
	assertRoman2Kana2('\\|', '\\|', transform.KANA_HIRA);
	assertRoman2Kana2Pattern('かんとく', 'カントク', 'kantoku', transform.KANA_HIRA);
	assertRoman2Kana2Pattern('かんとく', 'カントク', 'kanntoku', transform.KANA_HIRA);
//	assertRoman2Kana2Pattern('なんにん', 'ナンニン', 'nannin', transform.KANA_HIRA);
	assertRoman2Kana2Pattern('なんにん', 'ナンニン', 'nannnin', transform.KANA_HIRA);
	assertRoman2Kana2Pattern('うぇるかむ', 'ウェルカム', 'werukamu', transform.KANA_HIRA);

	assertRoman2Kana2('[アｱ][イｲ][ウｳ][エｴ][オｵ]', 'aiueo', transform.KANA_KATA);
	assertRoman2Kana2('(ガ|ｶﾞ)(ギ|ｷﾞ)(グ|ｸﾞ)(ゲ|ｹﾞ)(ゴ|ｺﾞ)', 'gagigugego', transform.KANA_KATA);
	assertRoman2Kana2('[ニﾆ][ホﾎ][ンﾝ](ゴ|ｺﾞ)', 'nihongo', transform.KANA_KATA);
	assertRoman2Kana2('(ポ|ﾎﾟ)[ーｰ-][トﾄ]', 'po-to', transform.KANA_KATA);
	assertRoman2Kana2('[キｷ][ャｬ][ッｯ][キｷ][ャｬ]', 'kyakkya', transform.KANA_KATA);
	assertRoman2Kana2('[ウｳ][ッｯ][ウｳ][ーｰ-]', 'uwwu-', transform.KANA_KATA);
	assertRoman2Kana2('ａｉｕｅｏ', 'ａｉｕｅｏ', transform.KANA_KATA);
	assertRoman2Kana2('\\(\\)\\[\\]\\|', '\\(\\)\\[\\]\\|', transform.KANA_KATA);
	assertRoman2Kana2('\\(\\[', '\\(\\[', transform.KANA_KATA);
	assertRoman2Kana2('\\)\\]', '\\)\\]', transform.KANA_KATA);
	assertRoman2Kana2('\\|', '\\|', transform.KANA_KATA);
	assertRoman2Kana2Pattern('カントク', 'かんとく', 'kantoku', transform.KANA_KATA);
	assertRoman2Kana2Pattern('カントク', 'かんとく', 'kanntoku', transform.KANA_KATA);
	assertRoman2Kana2Pattern('ｶﾝﾄｸ', 'かんとく', 'kantoku', transform.KANA_KATA);
	assertRoman2Kana2Pattern('ｶﾝﾄｸ', 'かんとく', 'kanntoku', transform.KANA_KATA);
//	assertRoman2Kana2Pattern('ナンニン', 'なんにん', 'nannin', transform.KANA_KATA);
	assertRoman2Kana2Pattern('ナンニン', 'なんにん', 'nannnin', transform.KANA_KATA);
	assertRoman2Kana2Pattern('ウェルカム', 'うぇるかむ', 'werukamu', transform.KANA_KATA);

	assertRoman2Kana2('[あアｱ][いイｲ][うウｳ][えエｴ][おオｵ]', 'aiueo', transform.KANA_ALL);
	assertRoman2Kana2('(が|ガ|ｶﾞ)(ぎ|ギ|ｷﾞ)(ぐ|グ|ｸﾞ)(げ|ゲ|ｹﾞ)(ご|ゴ|ｺﾞ)', 'gagigugego', transform.KANA_ALL);
	assertRoman2Kana2('[にニﾆ][ほホﾎ][んンﾝ](ご|ゴ|ｺﾞ)', 'nihongo', transform.KANA_ALL);
	assertRoman2Kana2('(ぽ|ポ|ﾎﾟ)[ーｰ-][とトﾄ]', 'po-to', transform.KANA_ALL);
	assertRoman2Kana2('[きキｷ][ゃャｬ][っッｯ][きキｷ][ゃャｬ]', 'kyakkya', transform.KANA_ALL);
	assertRoman2Kana2('[うウｳ][っッｯ][うウｳ][ーｰ-]', 'uwwu-', transform.KANA_ALL);
	assertRoman2Kana2('ａｉｕｅｏ', 'ａｉｕｅｏ', transform.KANA_ALL);
	assertRoman2Kana2('\\(\\)\\[\\]\\|', '\\(\\)\\[\\]\\|', transform.KANA_ALL);
	assertRoman2Kana2('\\(\\[', '\\(\\[', transform.KANA_ALL);
	assertRoman2Kana2('\\)\\]', '\\)\\]', transform.KANA_ALL);
	assertRoman2Kana2('\\|', '\\|', transform.KANA_ALL);
	assertRoman2Kana2Pattern('カントク', null, 'kantoku', transform.KANA_ALL);
	assertRoman2Kana2Pattern('かンとく', null, 'kanntoku', transform.KANA_ALL);
	assertRoman2Kana2Pattern('ｶﾝﾄｸ', null, 'kantoku', transform.KANA_ALL);
	assertRoman2Kana2Pattern('なんニン', null, 'nannnin', transform.KANA_ALL);
	assertRoman2Kana2Pattern('ナンニん', null, 'nannnin', transform.KANA_ALL);
	assertRoman2Kana2Pattern('ウぇるカむ', null, 'werukamu', transform.KANA_ALL);
	assertRoman2Kana2Pattern('ゑるカム', null, 'werukamu', transform.KANA_ALL);
	assertRoman2Kana2Pattern('う゛ぇくたー', null, 'vekuta-', transform.KANA_ALL);
	assertRoman2Kana2Pattern('ヴェルディ', null, 'verudhi', transform.KANA_ALL);
}

function test_hira2roman()
{
	function assertHira2Roman(aExpected, aInput) {
		assert.equals(aExpected, transform.hira2roman(aInput));
	}
	assertHira2Roman('aiueo', 'aiueo');
	assertHira2Roman('ａｉｕｅｏ', 'ａｉｕｅｏ');
	assertHira2Roman('aiueo', 'あいうえお');
	assertHira2Roman('アイウエオ', 'アイウエオ');
	assertHira2Roman('ｱｲｳｴｵ', 'ｱｲｳｴｵ');
	assertHira2Roman('ｶﾞｷﾞｸﾞｹﾞｺﾞ', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertHira2Roman('po-to', 'po-to');
	assertHira2Roman('日本語', '日本語');
	assertHira2Roman('()[]|', '()[]|');
	assertHira2Roman('([', '([');
	assertHira2Roman(')]', ')]');
	assertHira2Roman('|', '|');
	assertHira2Roman('window.open();', 'window.open();');
	assertHira2Roman('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');
}

function test_hira2kata()
{
	function assertHira2Kata(aExpected, aInput) {
		assert.equals(aExpected, transform.hira2kata(aInput));
	}
	assertHira2Kata('aiueo', 'aiueo');
	assertHira2Kata('ａｉｕｅｏ', 'ａｉｕｅｏ');
	assertHira2Kata('アイウエオ', 'あいうえお');
	assertHira2Kata('アイウエオ', 'アイウエオ');
	assertHira2Kata('ヴ', 'う゛');
	assertHira2Kata('ｱｲｳｴｵ', 'ｱｲｳｴｵ');
	assertHira2Kata('ガギグゲゴ', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertHira2Kata('po-to', 'po-to');
	assertHira2Kata('ポート', 'ぽーと');
	assertHira2Kata('日本語', '日本語');
	assertHira2Kata('()[]|', '()[]|');
	assertHira2Kata('([', '([');
	assertHira2Kata(')]', ')]');
	assertHira2Kata('|', '|');
	assertHira2Kata('window.open();', 'window.open();');
	assertHira2Kata('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');

	function assertHira2KataPattern(aExpected, aInput) {
		assert.equals(aExpected, transform.hira2kataPattern(aInput));
	}

	assertHira2KataPattern('aiueo', 'aiueo');
	assertHira2KataPattern('ａｉｕｅｏ', 'ａｉｕｅｏ');
	assertHira2KataPattern('(ア|ｱ)(イ|ｲ)(ウ|ｳ)(エ|ｴ)(オ|ｵ)', 'あいうえお');
	assertHira2KataPattern('アイウエオ', 'アイウエオ');
	assertHira2KataPattern('(ヴ|ｳﾞ)', 'う゛');
	assertHira2KataPattern('ｱｲｳｴｵ', 'ｱｲｳｴｵ');
	assertHira2KataPattern('ガギグゲゴ', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertHira2KataPattern('po-to', 'po-to');
	assertHira2KataPattern('(ポ|ﾎﾟ)(ー|ｰ|-)(ト|ﾄ)', 'ぽーと');
	assertHira2KataPattern('日本語', '日本語');
	assertHira2KataPattern('\\(\\)\\[\\]\\|', '\\(\\)\\[\\]\\|');
	assertHira2KataPattern('\\(\\[', '\\(\\[');
	assertHira2KataPattern('\\)\\]', '\\)\\]');
	assertHira2KataPattern('\\|', '\\|');
	assertHira2KataPattern('window.open();', 'window.open();');
	assertHira2KataPattern('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');
}

function test_kata2hira()
{
	function assertKata2Hira(aExpected, aInput) {
		assert.equals(aExpected, transform.kata2hira(aInput));
	}
	assertKata2Hira('aiueo', 'aiueo');
	assertKata2Hira('ａｉｕｅｏ', 'ａｉｕｅｏ');
	assertKata2Hira('あいうえお', 'あいうえお');
	assertKata2Hira('あいうえお', 'アイウエオ');
	assertKata2Hira('あいうえお', 'ｱｲｳｴｵ');
	assertKata2Hira('がぎぐげご', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertKata2Hira('po-to', 'po-to');
	assertKata2Hira('日本語', '日本語');
	assertKata2Hira('()[]|', '()[]|');
	assertKata2Hira('([', '([');
	assertKata2Hira(')]', ')]');
	assertKata2Hira('|', '|');
	assertKata2Hira('window.open();', 'window.open();');
	assertKata2Hira('window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");');
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

