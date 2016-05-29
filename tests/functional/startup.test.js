var description = '起動時の設定のテスト';

utils.include('common.inc.js');

var originalWarnOnClose = utils.getPref('browser.tabs.warnOnClose');

function normalSetUp(aURI)
{
	utils.setUpTestWindow();

	var retVal = utils.addTab(aURI);

	browser = utils.getBrowser();
	browser.removeAllTabsBut(retVal.tab);

	win = utils.getTestWindow();

	content = win.content;

	gFindBar = win.gFindBar;

	XMigemoUI = win.XMigemoUI;
	XMigemoHighlight = win.XMigemoHighlight;

	field = XMigemoUI.field;
	inputElem = field.inputField;

	utils.wait(WAIT);
}

var customPrefs = {
	'browser.tabs.warnOnClose' : false
};
customPrefs[BASE+'findMode.always' = -1;
customPrefs[BASE+'findMode.default' = 0;
customPrefs[BASE+'checked_by_default.findbar' = false;
customPrefs[BASE+'checked_by_default.highlight' = false;
customPrefs[BASE+'checked_by_default.highlight.always' = false;
customPrefs[BASE+'checked_by_default.caseSensitive' = false;
customPrefs[BASE+'checked_by_default.caseSensitive.always' = false;

function setUp()
{
	for (var i in customPrefs)
	{
		utils.setPref(i, customPrefs[i]);
	}
}

function tearDown()
{
	commonTearDown();
}


testStartWithoutFindToolbar.description = '起動時に検索ツールバーを表示：OFF';
function testStartWithoutFindToolbar()
{
	utils.setPref(BASE+'checked_by_default.findbar', false);
	normalSetUp(keyEventTest);
	assert.findbarState({ mode : 'FIND_MODE_NATIVE', shown : false });
}

testStartWithFindToolbar.description = '起動時に検索ツールバーを表示：ON';
function testStartWithFindToolbar()
{
	utils.setPref(BASE+'checked_by_default.findbar', true);
	normalSetUp(keyEventTest);
	assert.findbarState({ mode : 'FIND_MODE_NATIVE', shown : true });
}


testStartWithNormalFindMode.description = '起動時のモード：通常検索';
function testStartWithNormalFindMode()
{
	utils.setPref(BASE+'findMode.default', 1);
	normalSetUp(keyEventTest);
	assert.findbarState({ mode : 'FIND_MODE_NATIVE', shown : false });

	gFindBar.open();
	utils.wait(WAIT);

	assert.findAndFound({ input : 'fie', found : 'fie' });
	assert.findAgain({ keyOptions : ['return'], found : 'fie' });
	assert.changeModeByButtonClick('FIND_MODE_MIGEMO', 2)
	utils.wait(WAIT);
	assert.findAgain({ keyOptions : ['return'], found : 'field' });
}

testStartWithRegExpFindMode.description = '起動時のモード：正規表現検索';
function testStartWithRegExpFindMode()
{
	utils.setPref(BASE+'findMode.default', 4);
	normalSetUp(keyEventTest);
	assert.findbarState({ mode : 'FIND_MODE_REGEXP', shown : false });

	gFindBar.open();
	utils.wait(WAIT);

	assert.findAndFound({ input : 'fie', found : 'fie' });
	assert.findAgain({ keyOptions : ['return'], found : 'fie' });
	assert.changeModeByButtonClick('FIND_MODE_MIGEMO', 2)
	utils.wait(WAIT);
	assert.findAgain({ keyOptions : ['return'], found : 'field' });
}

testStartWithMigemoFindMode.description = '起動時のモード：Migemo検索';
function testStartWithMigemoFindMode()
{
	utils.setPref(BASE+'findMode.default', 2);
	normalSetUp(keyEventTest);
	assert.findbarState({ mode : 'FIND_MODE_MIGEMO', shown : false });

	gFindBar.open();
	utils.wait(WAIT);

	assert.findAndFound({ input : 'fie', found : 'field' });
	assert.findAgain({ keyOptions : ['return'], found : 'field' });
	assert.changeModeByButtonClick('FIND_MODE_NATIVE', 0)
	utils.wait(WAIT);
	assert.findAgain({ keyOptions : ['return'], found : 'fie' });
}
