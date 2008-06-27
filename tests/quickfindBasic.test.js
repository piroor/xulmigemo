// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc.js');
utils.include('quickfind.inc.js');

var quickFindBasicTest = new TestCase('クイックMigemo検索の基本テスト', {runStrategy: 'async'});

quickFindBasicTest.tests = {
	setUp : function() {
		yield Do(commonSetUp(keyEventTest));
		assert.isTrue(XMigemoUI.hidden);
	},

	tearDown : function() {
		commonTearDown();
	},

	'自動開始→タイムアウトによる自動終了': function() {
		XMigemoUI.autoStartQuickFind = true;
		yield Do(assert.autoStart('nihongo'));
		yield Do(assert.timeout());
		yield Do(assert.findStart());
	},

	'自動開始→手動終了（BS）': function() {
		XMigemoUI.autoStartQuickFind = true;
		var findTerm = 'nihongo';
		yield Do(assert.autoStart(findTerm));
		yield Do(assert.exitByBS(findTerm));
		yield Do(assert.findStart());
	},

	'自動開始→手動終了（ESC）': function() {
		XMigemoUI.autoStartQuickFind = true;
		var findTerm = 'nihongo';
		yield Do(assert.autoStart(findTerm));
		yield Do(assert.exitByESC());
		yield Do(assert.findStart());
	},

	'自動開始→手動終了（画面クリック）': function() {
		XMigemoUI.autoStartQuickFind = true;
		var findTerm = 'nihongo';
		yield Do(assert.autoStart(findTerm));
		yield Do(assert.exitByClick());
		yield Do(assert.findStart());
	},

	'自動開始の時に手動開始を試みた場合': function() {
		XMigemoUI.autoStartQuickFind = true;
		yield Do(assert.autoStart('/'));
	},

	'手動開始→タイムアウトによる自動終了': function() {
		var findTerm = 'nihongo';
		yield Do(assert.manualStart(findTerm));
		yield Do(assert.timeout());
		yield Do(assert.findStart());
	},

	'手動開始→手動終了（BS）': function() {
		var findTerm = 'nihongo';
		yield Do(assert.manualStart(findTerm));
		yield Do(assert.exitByBS(findTerm));
		yield Do(assert.findStart());
	},

	'手動開始→手動終了（ESC）': function() {
		var findTerm = 'nihongo';
		yield Do(assert.manualStart(findTerm));
		yield Do(assert.exitByESC());
		yield Do(assert.findStart());
	},

	'手動開始→手動終了（画面クリック）': function() {
		var findTerm = 'nihongo';
		yield Do(assert.manualStart(findTerm));
		yield Do(assert.exitByClick());
		yield Do(assert.findStart());
	},

	'手動開始の時に自動開始を試みた場合': function() {
		var key = { charCode : 'n'.charCodeAt(0) };
		action.fireKeyEventOnElement(content.document.documentElement, key);
		yield wait;
		assert.isTrue(XMigemoUI.hidden);
	}
};
