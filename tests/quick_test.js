// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var XMigemoUI, win, browser, source;
var keyEventTest = baseURL+'keyEventTest.html';
var wait = 300;

function getSourceViewer() {
	return utils.getChromeWindows({ type : 'navigator:view-source' })
}

var quickFindTest = new TestCase('クイックMigemo検索のテスト', {runStrategy: 'async'});

quickFindTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;

		browser = utils.getBrowser();
		browser.removeAllTabsBut(retVal.tab);

		win = utils.getTestWindow();
		XMigemoUI = win.XMigemoUI;
		XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
		XMigemoUI.highlightCheckedAlways = false;
		XMigemoUI.caseSensitiveCheckedAlways = false;
		XMigemoUI.autoStartRegExpFind = true;
		XMigemoUI.autoStartQuickFind = false;

		win.gFindBar.closeFindBar();
		yield wait;
	},

	tearDown : function() {
		utils.tearDownTestWindow();
		getSourceViewer().forEach(function(aWindow) { aWindow.close(); });
	},

	'自動起動': function() {
		XMigemoUI.autoStartQuickFind = true;
		var key = { charCode : 'n'.charCodeAt(0) };
		action.fireKeyEventOnElement(browser, key);
		yield wait;
		assert.isFalse(XMigemoUI.findBarHidden);
	}
};
