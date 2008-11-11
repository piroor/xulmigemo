// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc.js');

var XMigemoUIUnitTest = new TestCase('XMigemoUIのユニットテスト');

XMigemoUIUnitTest.tests = {
	setUp : function() {
		yield Do(commonSetUp(keyEventTest));
		assert.isTrue(XMigemoUI.hidden);
	},

	tearDown : function() {
		commonTearDown();
	},

	'プロパティのチェック': function() {
		assert.isTrue(XMigemoUI.browser);
		assert.isTrue(XMigemoUI.activeBrowser);
		assert.isTrue(XMigemoUI.findBar);
		assert.isTrue(XMigemoUI.field);
		assert.isTrue(XMigemoUI.label);
		assert.isTrue(XMigemoUI.caseSensitiveCheck);
		assert.isTrue(XMigemoUI.highlightCheck);
		assert.isTrue(XMigemoUI.findMigemoBar);
		assert.isTrue(XMigemoUI.findModeSelectorBox);
		assert.isTrue(XMigemoUI.findModeSelector);
		assert.isTrue(XMigemoUI.timeoutIndicatorBox);
		assert.isTrue(XMigemoUI.timeoutIndicator);
		assert.isTrue(win.XMigemoFind);
		assert.isTrue(win.XMigemoCore);
	}
};
