var description = 'XMigemoTextUtilsのテスト（DOM Range関連）';
var isAsync = true;

utils.include('pXMigemoClasses.inc.js');

var textUtils;

function setUp()
{
	textUtils = new pXMigemoTextUtils();
	yield Do(utils.loadURI('../res/keyEventTest.html'));
}

function tearDown()
{
	textUtils = null;
	yield Do(utils.loadURI());
}

test_isRangeOverlap.description = 'isRangeOverlap（DOM Rangeの重なり合いのチェック）'
function test_isRangeOverlap()
{
	var range1 = content.document.createRange();
	var range2 = content.document.createRange();
	var node = content.document.getElementById('single-row');

	// range1 == range2
	range1.selectNode(node);
	range2.selectNode(node);
	assert.isTrue(textUtils.isRangeOverlap(range1, range2));

	// [range1[range2]]
	range1.selectNode(node);
	range2.selectNodeContents(node);
	assert.isTrue(textUtils.isRangeOverlap(range1, range2));
	assert.isTrue(textUtils.isRangeOverlap(range2, range1));

	// [range1  [range2]  ]
	range1.selectNode(node);
	range2.selectNode(node.getElementsByTagName('input')[0]);
	assert.isTrue(textUtils.isRangeOverlap(range1, range2));
	assert.isTrue(textUtils.isRangeOverlap(range2, range1));

	// cross
	range1.selectNode(node.firstChild);
	range1.setStart(node.firstChild, 5);
	range1.setEnd(node.firstChild, 15);
	range2.selectNode(node.firstChild);
	range1.setStart(node.firstChild, 0);
	range1.setEnd(node.firstChild, 10);
	assert.isTrue(textUtils.isRangeOverlap(range1, range2));
	assert.isTrue(textUtils.isRangeOverlap(range2, range1));

	// corss(2)
	range1.selectNode(node.firstChild);
	range1.setStart(node.firstChild, 5);
	range1.setEnd(node.firstChild, 15);
	range2.selectNode(node.firstChild);
	range1.setStart(node.firstChild, 0);
	range1.setEnd(node.firstChild, 15);
	assert.isTrue(textUtils.isRangeOverlap(range1, range2));
	assert.isTrue(textUtils.isRangeOverlap(range2, range1));

	range1.detach();
	range2.detach();
}

test_range2Text.description = 'range2Text（DOM Rangeの文字列化）'
function test_range2Text()
{
	var range = content.document.createRange();

	range.selectNode(content.document.getElementById('single-row'));
	assert.equals('single-row field\ntext in input field\n', textUtils.range2Text(range));

	range.selectNodeContents(content.document.getElementById('single-row'));
	assert.equals('single-row field\ntext in input field\n', textUtils.range2Text(range));

	range.selectNodeContents(content.document.body);
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
function test_getFoundRange()
{
	var Find = Cc['@mozilla.org/embedcomp/rangefind;1']
			.createInstance(Ci.nsIFind);

	var target = content.document.getElementById('first');

	var findRange = content.document.createRange();
	findRange.selectNodeContents(target);

	var startPoint = content.document.createRange();
	startPoint.selectNodeContents(target);
	startPoint.collapse(true);

	var endPoint = content.document.createRange();
	endPoint.selectNodeContents(target);
	endPoint.collapse(false);

	var foundRange = Find.Find('sample', findRange, startPoint, endPoint);
	assert.equals('sample', foundRange);

	var selCon = utils.gBrowser.docShell
			.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsISelectionDisplay)
			.QueryInterface(Ci.nsISelectionController);
	var selection = selCon.getSelection(selCon.SELECTION_NORMAL);
	selection.addRange(foundRange);
	selCon.setDisplaySelection(selCon.SELECTION_ATTENTION);

	var range = textUtils.getFoundRange(content);
	assert.equals('sample', range.toString());
	assert.equals(0, range.compareBoundaryPoints(range.START_TO_START, foundRange));
	assert.equals(0, range.compareBoundaryPoints(range.END_TO_END, foundRange));
}

