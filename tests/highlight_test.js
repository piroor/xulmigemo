// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include(baseURL+'common.inc');

var highlightTest = new TestCase('ハイライト表示のテスト', {runStrategy: 'async'});

highlightTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;
		commonSetUp(retVal);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	tearDown : function() {
		commonTearDown();
	},

	'通常の検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		gFindBar.openFindBar();
		yield wait;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NATIVE;
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		findField.focus();

		action.inputTextToField(findField, 'text');
		yield 1000;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'text field');
		yield 1000;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'qute');
		yield 1000;
		assert.equals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'not found long term');
		yield 1000;
		assert.equals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);
	},

	'正規表現検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		gFindBar.openFindBar();
		yield wait;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_REGEXP;
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		findField.focus();

		action.inputTextToField(findField, 'tex');
		yield 1000;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'text ?(field|area)');
		yield 1000;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'qute');
		yield 1000;
		assert.equals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'not found long term');
		yield 1000;
		assert.equals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);
	},

	'Migemo検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		gFindBar.openFindBar();
		yield wait;

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		XMigemoUI.findCaseSensitiveCheck.checked = false;
		findField.focus();

		action.inputTextToField(findField, 'niho');
		yield 1000;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'nihongo');
		yield 1000;
		assert.notEquals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'qute');
		yield 1000;
		assert.equals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);

		action.inputTextToField(findField, 'not found long term');
		yield 1000;
		assert.equals('notfound', findField.getAttribute('status'));
		assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);
	}
};
