// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var XMigemoUI, win, browser;
var keyEventTest = baseURL+'keyEventTest.html';
var wait = 300;

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
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		XMigemoUI.openAgainAction = XMigemoUI.ACTION_NONE;
		XMigemoUI.highlightCheckedAlways = false;
		XMigemoUI.caseSensitiveCheckedAlways = false;
		XMigemoUI.autoStartRegExpFind = true;
		XMigemoUI.autoStartQuickFind = false;
		XMigemoUI.autoExitQuickFindInherit = true;
		XMigemoUI.autoExitQuickFind = true;
		XMigemoUI.timeout = 2000;
		XMigemoUI.shouldTimeout = true;
		XMigemoUI.shouldIndicateTimeout = true;

		win.gFindBar.closeFindBar();
		yield wait;
	},

	tearDown : function() {
		utils.tearDownTestWindow();
	},

	'自動開始→自動終了': function() {
		assert.isTrue(XMigemoUI.findBarHidden);
		yield wait;

		XMigemoUI.autoStartQuickFind = true;

		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		yield XMigemoUI.timeout + wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	'自動開始→手動終了（BS）': function() {
		assert.isTrue(XMigemoUI.findBarHidden);
		yield wait;

		XMigemoUI.autoStartQuickFind = true;

		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		action.inputTextToField(field, '');
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findBarHidden);

		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	'オートスタート→手動終了（ESC）': function() {
		assert.isTrue(XMigemoUI.findBarHidden);
		yield wait;

		XMigemoUI.autoStartQuickFind = true;

		var field = XMigemoUI.findField;
		var findTerm = 'nihongo';

		var key = { charCode : findTerm.charCodeAt(0) };
		action.fireKeyEventOnElement(win.content.document.documentElement, key);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findBarHidden);

		key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE };
		action.fireKeyEventOnElement(field, key);
		yield wait;
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isTrue(XMigemoUI.findBarHidden);
	}
};
