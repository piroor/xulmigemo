function setUp()
{
	commonSetUp(gTestPageURI);
	assert.isTrue(XMigemoUI.hidden);
	XMigemoUI.highlightCheckedAlways = true;
	XMigemoUI.highlightCheckedAlwaysMinLength = 5;
	XMigemoUI.highlightSelectionAvailable = false;
}

function tearDown()
{
	commonTearDown();
}

testAutoHighlightNormal.description = '通常の検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightNormal()
{
	gFindBar.open();
	utils.wait(WAIT);
	autoHighlightTest(
		'FIND_MODE_NATIVE',
		'text',
		'text field',
		'qute',
		'not found long term',
		10
	);
}

testAutoHighlightRegExp.description = '正規表現検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightRegExp()
{
	gFindBar.open();
	utils.wait(WAIT);
	autoHighlightTest(
		'FIND_MODE_REGEXP',
		'tex',
		'text ?(field|area)',
		'qute',
		'not found long term',
		10
	);
}

testAutoHighlightMigemo.description = 'Migemo検索で自動ハイライトが正常に動作するかどうか';
function testAutoHighlightMigemo()
{
	gFindBar.open();
	utils.wait(WAIT);
	autoHighlightTest(
		'FIND_MODE_MIGEMO',
		'niho',
		'nihongo',
		'qute',
		'not found long term',
		4
	);
}

testSafariHighlight.description = 'Safari風自動ハイライト';
function testSafariHighlight()
{
	XMigemoHighlight.strongHighlight = true;

	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	assert.screenStateForFind('text field', true)
	assert.screenStateForFind('', false)
	assert.screenStateForFind('t', false)
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	assert.screenStateForFind('nihongo', true)
	assert.screenStateForFind('', false)
	assert.screenStateForFind('n', false)
}

function getHighlightCount()
{
	return content.document.evaluate(
			'count('+kHIGHLIGHTS+')',
			content.document,
			null,
			XPathResult.NUMBER_TYPE,
			null
		).numberValue;
}

testAutoHighlightAndModeSwitch.description = 'ハイライト表示したまま検索モードを切り替えた場合';
function testAutoHighlightAndModeSwitch()
{
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	assert.found('sample')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	action.inputTo(field, '');
	utils.wait(WAIT);
	gFindBar.close();
	utils.wait(WAIT);

	content.getSelection().removeAllRanges();
	XMigemoHighlight.strongHighlight = true;

	gFindBar.open();
	utils.wait(WAIT);
	field.focus();
	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	assert.found('sample')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());
}

testAutoHighlightAndFindAnotherWordNative.description = 'ハイライト表示したまま別の単語の検索を開始した場合（通常検索）';
function testAutoHighlightAndFindAnotherWordNative()
{
	XMigemoHighlight.strongHighlight = true;
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	assert.equals(XMigemoUI.FIND_MODE_NATIVE, XMigemoUI.findMode);
	assert.highlightCheck(true, false);
	assert.found('sample')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.found('word1, out of text field')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(6, getHighlightCount());

	assert.found('word3, out of text field')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());
}

testAutoHighlightAndFindAnotherWordRegExp.description = 'ハイライト表示したまま別の単語の検索を開始した場合（正規表現検索）';
function testAutoHighlightAndFindAnotherWordRegExp()
{
	XMigemoHighlight.strongHighlight = true;
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
	assert.highlightCheck(true, false);

	assert.found('sample')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.found('word1, out of text field')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(6, getHighlightCount());

	assert.found('word3, out of text field')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.found('word[13], out of text field')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(8, getHighlightCount());
}

testAutoHighlightAndFindAnotherWordMigemo.description = 'ハイライト表示したまま別の単語の検索を開始した場合（Migemo検索）';
function testAutoHighlightAndFindAnotherWordMigemo()
{
	XMigemoHighlight.strongHighlight = true;
	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;

	assert.highlightCheck(true, false);
	assert.found('sample')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.found('word1, out of text field')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(6, getHighlightCount());

	assert.found('word3, out of text field')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(2, getHighlightCount());

	assert.found('nihongo')
	utils.wait(WAIT);
	assert.highlightCheck(false, true);
	assert.equals(4, getHighlightCount());
}


function testMarker()
{
	XMigemoMarker.enabled = true;

	gFindBar.open();
	utils.wait(WAIT);
	field.focus();

	XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
	assert.markerStateForFind('text field', true)
	assert.markerStateForFind('', false)
	assert.markerStateForFind('t', false)
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	assert.markerStateForFind('nihongo', true)
	assert.markerStateForFind('', false)
	assert.markerStateForFind('n', false)
}
