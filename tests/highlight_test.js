// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var XMigemoUI, XMigemoHighlight, win, browser, findCommand;
var keyEventTest = baseURL+'keyEventTest.html';
var wait = 300;

var highlightTest = new TestCase('ハイライト表示のテスト', {runStrategy: 'async'});

highlightTest.tests = {
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
		XMigemoUI.highlightCheckedAlwaysMinLength = 2;
		XMigemoUI.caseSensitiveCheckedAlways = false;
		XMigemoUI.autoStartRegExpFind = true;
		XMigemoUI.autoStartQuickFind = false;
		XMigemoUI.autoExitQuickFindInherit = true;
		XMigemoUI.autoExitQuickFind = true;
		XMigemoUI.timeout = 2000;
		XMigemoUI.shouldTimeout = true;
		XMigemoUI.shouldIndicateTimeout = true;

		XMigemoHighlight = win.XMigemoHighlight;
		XMigemoHighlight.strongHighlight = false;
		XMigemoHighlight.animationEnabled = false;
		XMigemoHighlight.animationStyle = XMigemoHighlight.STYLE_ZOOM;

		findCommand = 'with (win) {'+
			win.document.getElementById('cmd_find').getAttribute('oncommand')+
		'}';

		win.gFindBar.closeFindBar();
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	tearDown : function() {
		utils.tearDownTestWindow();
	},

	'通常の検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		win.gFindBar.openFindBar();
		yield wait;

		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		field.focus();

		action.inputTextToField(field, 'text');
		yield 500 + wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'text field');
		yield 500 + wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'qute');
		yield 500 + wait;
		assert.equals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'not found long term');
		yield 500 + wait;
		assert.equals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);
	},

	'正規表現検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		win.gFindBar.openFindBar();
		yield wait;

		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		field.focus();

		action.inputTextToField(field, 'tex');
		yield 500 + wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'text ?(field|area)');
		yield 500 + wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'qute');
		yield 500 + wait;
		assert.equals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'not found long term');
		yield 500 + wait;
		assert.equals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);
	},

	'Migemo検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		win.gFindBar.openFindBar();
		yield wait;

		var field = XMigemoUI.findField;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		field.focus();

		action.inputTextToField(field, 'niho');
		yield 500 + wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'nihongo');
		yield 500 + wait;
		assert.notEquals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'qute');
		yield 500 + wait;
		assert.equals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(field, 'not found long term');
		yield 500 + wait;
		assert.equals('notfound', field.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);
	}
};
