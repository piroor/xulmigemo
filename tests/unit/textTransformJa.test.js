utils.include('../../components/pXMigemoTextTransformJa.js', null, 'Shift_JIS');

var transform;

function setUp()
{
	transform = new pXMigemoTextTransformJa();
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
	assertNormalizeInput('日本語', '日本語');
	assertNormalizeInput('()[]|', '()[]|');
	assertNormalizeInput('([', '([');
	assertNormalizeInput(')]', ')]');
	assertNormalizeInput('|', '|');
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
	assertNormalizeKeyInput('日本語', '日本語');
	assertNormalizeKeyInput('()[]|', '()[]|');
	assertNormalizeKeyInput('([', '([');
	assertNormalizeKeyInput(')]', ')]');
	assertNormalizeKeyInput('|', '|');
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
	assertRoman2Kana('()[]|', '()[]|');
	assertRoman2Kana('([', '([');
	assertRoman2Kana(')]', ')]');
	assertRoman2Kana('|', '|');
}

function test_roman2kana2()
{
	function assertRoman2Kana2(aExpected, aInput, aType) {
		assert.equals(aExpected, transform.roman2kana2(aInput, aType));
	}
	assertRoman2Kana2('あいうえお', 'aiueo', transform.KANA_HIRA);
	assertRoman2Kana2('がぎぐげご', 'gagigugego', transform.KANA_HIRA);
	assertRoman2Kana2('にほんご', 'nihongo', transform.KANA_HIRA);
	assertRoman2Kana2('ａｉｕｅｏ', 'ａｉｕｅｏ', transform.KANA_HIRA);
	assertRoman2Kana2('[アｱ][イｲ][ウｳ][エｴ][オｵ]', 'aiueo', transform.KANA_KATA);
	assertRoman2Kana2('(ガ|ｶﾞ)(ギ|ｷﾞ)(グ|ｸﾞ)(ゲ|ｹﾞ)(ゴ|ｺﾞ)', 'gagigugego', transform.KANA_KATA);
	assertRoman2Kana2('[ニﾆ][ホﾎ][ンﾝ](ゴ|ｺﾞ)', 'nihongo', transform.KANA_KATA);
	assertRoman2Kana2('ａｉｕｅｏ', 'ａｉｕｅｏ', transform.KANA_KATA);
	assertRoman2Kana2('[あアｱ][いイｲ][うウｳ][えエｴ][おオｵ]', 'aiueo', transform.KANA_ALL);
	assertRoman2Kana2('(が|ガ|ｶﾞ)(ぎ|ギ|ｷﾞ)(ぐ|グ|ｸﾞ)(げ|ゲ|ｹﾞ)(ご|ゴ|ｺﾞ)', 'gagigugego', transform.KANA_ALL);
	assertRoman2Kana2('[にニﾆ][ほホﾎ][んンﾝ](ご|ゴ|ｺﾞ)', 'nihongo', transform.KANA_ALL);
	assertRoman2Kana2('ａｉｕｅｏ', 'ａｉｕｅｏ', transform.KANA_ALL);

	assertRoman2Kana2('()[]|', '()[]|', transform.KANA_HIRA);
	assertRoman2Kana2('([', '([', transform.KANA_HIRA);
	assertRoman2Kana2(')]', ')]', transform.KANA_HIRA);
	assertRoman2Kana2('|', '|', transform.KANA_HIRA);

	assertRoman2Kana2('()[]|', '()[]|', transform.KANA_KATA);
	assertRoman2Kana2('([', '([', transform.KANA_KATA);
	assertRoman2Kana2(')]', ')]', transform.KANA_KATA);
	assertRoman2Kana2('|', '|', transform.KANA_KATA);

	assertRoman2Kana2('()[]|', '()[]|', transform.KANA_ALL);
	assertRoman2Kana2('([', '([', transform.KANA_ALL);
	assertRoman2Kana2(')]', ')]', transform.KANA_ALL);
	assertRoman2Kana2('|', '|', transform.KANA_ALL);
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
	assertHira2Roman('日本語', '日本語');
	assertHira2Roman('()[]|', '()[]|');
	assertHira2Roman('([', '([');
	assertHira2Roman(')]', ')]');
	assertHira2Roman('|', '|');
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
	assertHira2Kata('ｱｲｳｴｵ', 'ｱｲｳｴｵ');
	assertHira2Kata('ガギグゲゴ', 'ｶﾞｷﾞｸﾞｹﾞｺﾞ');
	assertHira2Kata('日本語', '日本語');
	assertHira2Kata('()[]|', '()[]|');
	assertHira2Kata('([', '([');
	assertHira2Kata(')]', ')]');
	assertHira2Kata('|', '|');
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
	assertKata2Hira('日本語', '日本語');
	assertKata2Hira('()[]|', '()[]|');
	assertKata2Hira('([', '([');
	assertKata2Hira(')]', ')]');
	assertKata2Hira('|', '|');
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
	assertZenkaku2Hankaku('日本語', '日本語');
	assertZenkaku2Hankaku('()[]|', '()[]|');
	assertZenkaku2Hankaku('([', '([');
	assertZenkaku2Hankaku(')]', ')]');
	assertZenkaku2Hankaku('|', '|');
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
	assertIsYomi(false, '日本語');
	assertIsYomi(false, '()[]|');
	assertIsYomi(false, '([');
	assertIsYomi(false, ')]');
	assertIsYomi(false, '|');
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
	assertJoinVoiceMarks('日本語', '日本語');
	assertJoinVoiceMarks('()[]|', '()[]|');
	assertJoinVoiceMarks('([', '([');
	assertJoinVoiceMarks(')]', ')]');
	assertJoinVoiceMarks('|', '|');
}



