function setUp()
{
	yield Do(commonSetUp(gTestPageURI));
	assert.isTrue(XMigemoUI.hidden);
	XMigemoUI.highlightCheckedAlways = true;
	XMigemoUI.highlightCheckedAlwaysMinLength = 5;
}

function tearDown()
{
	commonTearDown();
}

function selectTextInPage()
{
	var selection = content.getSelection();
	var range = content.document.createRange();
	var node = content.document.getElementsByTagName('a')[0].firstChild;
	range.setStart(node, 0);
	range.setEnd(node, 6);
	selection.addRange(range);
	assert.equals('sample', selection.toString());
}

testAutoHighlightNormal.description = '通常の検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightNormal()
{
	gFindBar.openFindBar();
	yield wait;
	yield Do(autoHighlightTest(
		'FIND_MODE_NATIVE',
		'text',
		'text field',
		'qute',
		'not found long term',
		10
	));
	gFindBar.closeFindBar();
	yield wait;
	selectTextInPage();
	gFindBar.openFindBar();
	yield wait;
	assert.highlightCheck(false, true);
}

testAutoHighlightRegExp.description = '正規表現検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightRegExp()
{
	gFindBar.openFindBar();
	yield wait;
	yield Do(autoHighlightTest(
		'FIND_MODE_REGEXP',
		'tex',
		'text ?(field|area)',
		'qute',
		'not found long term',
		10
	));
	gFindBar.closeFindBar();
	yield wait;
	selectTextInPage();
	gFindBar.openFindBar();
	yield wait;
	assert.highlightCheck(false, true);
}

testAutoHighlightMigemo.description = 'Migemo検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightMigemo()
{
	gFindBar.openFindBar();
	yield wait;
	yield Do(autoHighlightTest(
		'FIND_MODE_MIGEMO',
		'niho',
		'nihongo',
		'qute',
		'not found long term',
		4
	));
	gFindBar.closeFindBar();
	yield wait;
	selectTextInPage();
	gFindBar.openFindBar();
	yield wait;
	assert.highlightCheck(false, true);
}

testSafariHighlight.description = 'Safari風自動ハイライト';
function testSafariHighlight()
{
	XMigemoHighlight.strongHighlight = true;

	gFindBar.openFindBar();
	yield wait;
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NORMAL;
	yield Do(assert.screenStateForFind('text field', true));
	yield Do(assert.screenStateForFind('', false));
	yield Do(assert.screenStateForFind('t', false));
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield Do(assert.screenStateForFind('nihongo', true));
	yield Do(assert.screenStateForFind('', false));
	yield Do(assert.screenStateForFind('n', false));
}
function getHighlightCount()
{
	return content.document.evaluate(
			'count(descendant::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search"])',
			content.document,
			null,
			XPathResult.NUMBER_TYPE,
			null
		).numberValue;
}

testAutoHighlightAndModeSwitch.description = 'ハイライト表示したまま検索モードを切り替えた場合';
function testAutoHighlightAndModeSwitch()
{
	gFindBar.openFindBar();
	yield wait;
	field.focus();
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	yield Do(assert.find_found('sample'));
	yield wait;
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	yield wait;
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield wait;
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield wait;
	assert.highlightCheck(false, true);

	action.inputTextToField(field, '');
	yield wait;
	gFindBar.closeFindBar();
	yield wait;

	content.getSelection().removeAllRanges();
	XMigemoHighlight.strongHighlight = true;

	gFindBar.openFindBar();
	yield wait;
	field.focus();
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	yield Do(assert.find_found('sample'));
	yield wait;
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	yield wait;
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield wait;
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	yield wait;
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());
}

