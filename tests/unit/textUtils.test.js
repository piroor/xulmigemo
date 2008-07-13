var description = 'XMigemoTextUtilsのテスト（基本）';

utils.include('../../components/pXMigemoTextUtils.js', null, 'Shift_JIS');

var textUtils;

function setUp()
{
	textUtils = new pXMigemoTextUtils();
}

function tearDown()
{
	textUtils = null;
}

test_trim.description = 'trim（前後の空白の除去）';
function test_trim()
{
	assert.equals('space', textUtils.trim('space '));
	assert.equals('space', textUtils.trim(' space'));
	assert.equals('space', textUtils.trim(' space '));
	assert.equals('space, multiple', textUtils.trim('space, multiple  '));
	assert.equals('space, multiple', textUtils.trim('  space, multiple'));
	assert.equals('space, multiple', textUtils.trim('  space, multiple  '));
	assert.equals('tab', textUtils.trim('tab\t'));
	assert.equals('tab', textUtils.trim('\ttab'));
	assert.equals('tab', textUtils.trim('\ttab\t'));
	assert.equals('tab, multiple', textUtils.trim('tab, multiple\t\t'));
	assert.equals('tab, multiple', textUtils.trim('\t\ttab, multiple'));
	assert.equals('tab, multiple', textUtils.trim('\t\ttab, multiple\t\t'));
	assert.equals('mixed', textUtils.trim('mixed\t\n \r'));
	assert.equals('mixed', textUtils.trim('\t\n \rmixed'));
	assert.equals('mixed', textUtils.trim('\t\n \rmixed\t\n\r '));
}

test_brushUpTerms.description = 'brushUpTerms（整列と重複項目の削除）';
function test_brushUpTerms()
{
	var terms = '英語,日本語,フランス語,ドイツ語,中国語,english,japanese,french,german,chinese'.split(',');
	terms.sort();

	assert.arrayEquals(
		terms,
		textUtils.brushUpTerms('英語,フランス語,ドイツ語,german,中国語,english,japanese,french,chinese,日本語'.split(',')),
		'並べ替えのみ'
	);
	assert.arrayEquals(
		terms,
		textUtils.brushUpTerms('ドイツ語,日本語,Japanese,フランス語,ドイツ語,中国語,英語,English,Japanese,French,German,Chinese,英語'.split(',')),
		'重複あり'
	);
}

test_sanitize.description = 'sanitize（正規表現のメタキャラクタのエスケープ）';
function test_sanitize()
{
	assert.equals(
		'a\\\\bc\\(def\\|ghi\\)jk\\[\\^lmn\\]o\\.\\*p\\+q\\?r\\{0\\}s\\$',
		textUtils.sanitize('a\\bc(def|ghi)jk[^lmn]o.*p+q?r{0}s$')
	);
}

test_sanitize2.description = 'sanitize2（Migemoが生成するパターンに含まれない正規表現のメタキャラクタのエスケープ）';
function test_sanitize2()
{
	assert.equals(
		'a\\\\bc(def|ghi)jk[\\^lmn]o\\.\\*p\\+q\\?r\\{0\\}s\\$',
		textUtils.sanitize2('a\\bc(def|ghi)jk[^lmn]o.*p+q?r{0}s$')
	);
}

test_isRegExp.description = 'isRegExp（正規表現リテラルの判別）';
function test_isRegExp()
{
	assert.isTrue(textUtils.isRegExp('/foobar/'), '単純な例');
	assert.isTrue(textUtils.isRegExp('/foo|bar/'), '|');
	assert.isTrue(textUtils.isRegExp('/foo(bar|baz)/'), '()');
	assert.isTrue(textUtils.isRegExp('/[foobar]/'), '[]');
	assert.isTrue(textUtils.isRegExp('/foo|bar/gim'), 'フラグ');
	assert.isFalse(textUtils.isRegExp('/directory/subdirectory'), 'パス');
}

test_extractRegExpSource.description = 'extractRegExpSource（正規表現リテラルからのソース文字列抽出）';
function test_extractRegExpSource()
{
	assert.equals('foobar', textUtils.extractRegExpSource('/foobar/'), '単純な例');
	assert.equals('foo|bar', textUtils.extractRegExpSource('/foo|bar/gim'), 'フラグ');
	assert.equals('foo|bar', textUtils.extractRegExpSource('foo|bar'), '正規表現リテラルでない');
}

test_getMatchedTermsFromSource.description = 'getMatchedTermsFromSource（正規表現リテラルからのソース文字列抽出）';
function test_getMatchedTermsFromSource()
{
	var source = <![CDATA[
		英語,日本語,フランス語,ドイツ語,中国語,english,japanese,french,german,chinese,
		タガログ語,ポーランド語,ハンガリー語,バルタン星語
	]]>.toString();

	assert.arrayEquals(
		['語'],
		textUtils.getMatchedTermsFromSource('語', source)
	);

	var expected = '英語,日本語,フランス語,ドイツ語,中国語,タガログ語,ポーランド語,ハンガリー語,バルタン星語'.split(',');
	expected.sort();
	var actual = textUtils.getMatchedTermsFromSource('[^\\s,]+語', source);
	assert.arrayEquals(
		expected,
		actual
	);
}

test_getORFindRegExpFromTerms.description = 'getORFindRegExpFromTerms（OR検索用正規表現の生成）';
function test_getORFindRegExpFromTerms()
{
	var terms = '日本語,英語'.split(',');

	var regexp = textUtils.getORFindRegExpFromTerms(terms);
	assert.isTrue(textUtils.isRegExp('/'+regexp+'/'));
	regexp = new RegExp(regexp, 'gim');
	assert.pattern('日本語,フランス語,英語', regexp);
	assert.pattern('フランス語,英語,日本語', regexp);
	assert.pattern('日本語', regexp);
}

test_getANDFindRegExpFromTerms.description = 'getANDFindRegExpFromTerms（AND検索用正規表現の生成）';
function test_getANDFindRegExpFromTerms()
{
	var terms = '日本語,英語'.split(',');

	var regexp = textUtils.getANDFindRegExpFromTerms(terms);
	assert.isTrue(textUtils.isRegExp('/'+regexp+'/'));
	regexp = new RegExp(regexp, 'gim');
	assert.pattern('日本語,フランス語,英語', regexp);
	assert.pattern('フランス語,英語,日本語', regexp);
	assert.notPattern('日本語,フランス語', regexp);
}
