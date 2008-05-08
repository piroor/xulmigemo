// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var XMigemoUI, win, browser, source;
var keyEventTest = baseURL+'keyEventTest.html';
var wait = 300;

function getSourceViewer() {
	return utils.getChromeWindows({ type : 'navigator:view-source' })
}

var sourceTest = new TestCase('ソース表示での検索テスト', {runStrategy: 'async'});

sourceTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;

		browser = utils.getBrowser();
		browser.removeAllTabsBut(retVal.tab);

		win = utils.getTestWindow();
		win.BrowserViewSourceOfDocument(browser.contentDocument);

		yield (function() {
				return getSourceViewer().length
			});

		soruce = getSourceViewer()[0];
		XMigemoUI = soruce.XMigemoUI;
		XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
		XMigemoUI.highlightCheckedAlways = false;
		XMigemoUI.caseSensitiveCheckedAlways = false;
		XMigemoUI.autoStartRegExpFind = true;

		yield wait;
	},

	tearDown : function() {
		getSourceViewer().forEach(function(aWindow) { aWindow.close(); });
		utils.tearDownTestWindow();
	},

	'a': function() {
	}
};
