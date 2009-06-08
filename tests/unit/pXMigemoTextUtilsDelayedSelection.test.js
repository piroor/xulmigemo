var description = 'XMigemoTextUtilsのテスト（遅延選択関連）';

utils.include('pXMigemoClasses.inc.js');

var textUtils;

function setUp()
{
	textUtils = new pXMigemoTextUtils();
	yield Do(utils.loadURI('../fixtures/highlighted.html'));
}

function tearDown()
{
	textUtils = null;
	yield Do(utils.loadURI());
}

function getHighlights()
{
	return content.document.getElementsByTagName('span');
}

function testNormalTextSingle()
{
	var range = content.document.createRange();
	var container = content.document.getElementsByTagName('p')[0];

	var highlight = getHighlights()[0];
	range.selectNodeContents(highlight);
	assert.equals('is', range.toString());

	var selection = content.getSelection();
	selection.addRange(range);

	assert.equals('is', selection.toString());

	textUtils.delayedSelect(highlight, 2, false);

	var text = range.extractContents();
	container.insertBefore(text, highlight.nextSibling);
	container.removeChild(highlight);
	container.normalize();
	assert.equals(5, container.childNodes.length);
	yield 500;

	selection = content.getSelection();
	assert.equals('is', selection.toString());

	range.detach();
}

function testNormalTextMultiple()
{
	var container = content.document.getElementsByTagName('p')[0];
	var selection = content.getSelection();

	var range1 = content.document.createRange();
	var highlight1 = getHighlights()[0];
	range1.selectNodeContents(highlight1);
	assert.equals('is', range1.toString());

	var range2 = content.document.createRange();
	var highlight2 = getHighlights()[1];
	range2.selectNodeContents(highlight2);
	assert.equals('sample', range2.toString());
	selection.addRange(range2);
	assert.equals('sample', selection.toString());

	textUtils.delayedSelect(highlight2, 6, false);

	var text = range1.extractContents();
	container.insertBefore(text, highlight1.nextSibling);
	container.removeChild(highlight1);

	text = range2.extractContents();
	container.insertBefore(text, highlight2.nextSibling);
	container.removeChild(highlight2);

	container.normalize();
	assert.equals(3, container.childNodes.length);
	yield 100;

	selection = content.getSelection();
	assert.equals('sample', selection.toString());

	range1.detach();
	range2.detach();
}

function testEdgeTextSingle()
{
	var range = content.document.createRange();
	var link = content.document.getElementsByTagName('a')[0];

	var highlight = getHighlights()[2];
	range.selectNodeContents(highlight);
	assert.equals('sam', range.toString());

	var selection = content.getSelection();
	selection.addRange(range);
	assert.equals('sam', selection.toString());

	textUtils.delayedSelect(highlight, 3, false);

	var text = range.extractContents();
	link.insertBefore(text, highlight);
	link.removeChild(highlight);
	link.normalize();
	assert.equals(1, link.childNodes.length);
	yield 100;

	selection = content.getSelection();
	assert.equals('sam', selection.toString());

	range.detach();
}

function testSelectContent()
{
	var container = content.document.getElementsByTagName('p')[0];

	textUtils.selectContent(container, 17, 4, false);
	var selection = content.getSelection();
	assert.equals('text', selection.toString());
}

function testSelectContentWithDelay()
{
	var container = content.document.getElementsByTagName('p')[0];

	var range = content.document.createRange();
	range.setStart(container.childNodes[4], 1);
	range.setEnd(container.childNodes[4], 5);
	assert.equals('text', range.toString());

	textUtils.selectContentWithDelay(container, 17, 4, false);

	var highlights = getHighlights();
	Array.slice(highlights).reverse().forEach(function(aNode) {
		var range = content.document.createRange();
		range.selectNodeContents(aNode);
		var text = range.extractContents();
		aNode.parentNode.insertBefore(text, aNode.nextSibling);
		aNode.parentNode.removeChild(aNode);
		range.detach();
	});

	container.normalize();
	assert.equals(3, container.childNodes.length);
	yield 100;

	var selection = content.getSelection();
	assert.equals('text', selection.toString());

	range.detach();
}

