// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');

var XMigemoUIUnitTest = new TestCase('XMigemoUIのユニットテスト', {runStrategy: 'async'});

XMigemoUIUnitTest.tests = {
	setUp : function() {
		yield Do(commonSetUp(keyEventTest));
		assert.isTrue(XMigemoUI.findBarHidden);
	},

	tearDown : function() {
		commonTearDown();
	},

	'プロパティのチェック': function() {
		assert.isTrue(XMigemoUI.browser);
		assert.isTrue(XMigemoUI.activeBrowser);
		assert.isTrue(XMigemoUI.findMigemoBar);
		assert.isTrue(XMigemoUI.migemoModeBox);
		assert.isTrue(XMigemoUI.findBar);
		assert.isTrue(XMigemoUI.findField);
		assert.isTrue(XMigemoUI.findLabel);
		assert.isTrue(XMigemoUI.findCaseSensitiveCheck);
		assert.isTrue(XMigemoUI.findHighlightCheck);
		assert.isTrue(XMigemoUI.findModeSelector);
		assert.isTrue(XMigemoUI.timeoutIndicator);
		assert.isTrue(XMigemoUI.timeoutIndicatorBox);
		assert.isTrue(win.XMigemoFind);
		assert.isTrue(win.XMigemoCore);
	}
};
