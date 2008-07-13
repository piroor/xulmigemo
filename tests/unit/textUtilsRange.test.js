var description = 'XMigemoTextUtilsのテスト（DOM Range関連）';
var isAsync = true;

utils.include('../../components/pXMigemoTextUtils.js', null, 'Shift_JIS');

var textUtils;

function setUp()
{
	textUtils = new pXMigemoTextUtils();
	yield Do(utils.setUpTestFrame('../res/keyEventTest.html'));
}

function tearDown()
{
	textUtils = null;
	yield Do(utils.tearDownTestFrame());
}

test_isRangeOverlap.description = 'isRangeOverlap（DOM Rangeの重なり合いのチェック）'
test_isRangeOverlap.priority = 1;
function test_isRangeOverlap()
{
	var range1 = utils.testDocument.createRange();
	var range2 = utils.testDocument.createRange();
	var node = utils.testDocument.getElementById('single-row');

	range1.selectNode(node);
	range2.selectNode(node);
	assert.isTrue(textUtils.isRangeOverlap(range1, range2));

	range1.selectNode(node);
	range2.selectNodeContents(node);
	assert.isTrue(textUtils.isRangeOverlap(range1, range2));

	range1.selectNodeContents(node);
	range2.selectNode(node);
	assert.isTrue(textUtils.isRangeOverlap(range1, range2));
}

test_range2Text.description = 'range2Text（DOM Rangeの文字列化）'
function test_range2Text()
{
	var range = utils.testDocument.createRange();

	range.selectNode(utils.testDocument.getElementById('single-row'));
	assert.equals('single-row field\ntext in input field\n', textUtils.range2Text(range));

	range.selectNodeContents(utils.testDocument.getElementById('single-row'));
	assert.equals('single-row field\ntext in input field\n', textUtils.range2Text(range));

	range.selectNodeContents(utils.testDocument.body);
	assert.equals(<![CDATA[



This is a sample text and a sample link.
single-row field
text in input field

multirow field

text in textarea


word1, out of text field
word1, out of text field
word1, in text field
word1, in text field
word1, out of text field
word1, out of text field
word1, in text field
word1, in text field
word1, out of text field
word1, out of text field

word2, out of text field
word2, out of text field
word2, in text field
word2, in text field

word3, in text field
word3, in text field
word3, out of text field
word3, out of text field

日本語のテキスト　にほんごのテキスト　ニホンゴのテキスト　nihongoのテキスト

another link


Pressed:




]]>.toString(), textUtils.range2Text(range));

	range.detach();
}

test_getFoundRange.description = 'getFoundRange（フレーム内のヒット箇所の取得）'
test_getFoundRange.priority = 'never';
function test_getFoundRange()
{
}

test_delayedSelect.description = 'delayedSelect（DOM Rangeの選択）'
test_delayedSelect.priority = 'never';
function test_delayedSelect()
{
}

