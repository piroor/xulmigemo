// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include(baseURL+'common.inc');
var kSCREEN = '__moz_xmigemo-find-highlight-screen';
var kHIGHLIGHTS = 'descendant::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search" or @class="__mozilla-findbar-animation"]';

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
		var xpathResult;

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
		var xpathResult = content.document.evaluate(
			kHIGHLIGHTS,
			content.document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
		assert.equals(10, xpathResult.snapshotLength);

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
		var xpathResult = content.document.evaluate(
			kHIGHLIGHTS,
			content.document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
		assert.equals(10, xpathResult.snapshotLength);

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
		var xpathResult = content.document.evaluate(
			kHIGHLIGHTS,
			content.document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
		assert.equals(4, xpathResult.snapshotLength);

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

	'Safari風自動ハイライト': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;
		XMigemoHighlight.strongHighlight = true;

		gFindBar.openFindBar();
		yield wait;
		findField.focus();

		var xpathResult;


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NORMAL;

		action.inputTextToField(findField, 'text field');
		yield 1000;
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		var screen = content.document.getElementById(kSCREEN);
		assert.isTrue(screen);
		var box = content.document.getBoxObjectFor(screen);
		assert.isTrue(box.width);
		assert.isTrue(box.height);


		action.inputTextToField(findField, '');
		yield 1000;
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
		box = content.document.getBoxObjectFor(screen);
		assert.isFalse(box.width);
		assert.isFalse(box.height);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;

		action.inputTextToField(findField, 'nihongo');
		yield 1000;
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		box = content.document.getBoxObjectFor(screen);
		assert.isTrue(box.width);
		assert.isTrue(box.height);


		action.inputTextToField(findField, '');
		yield 1000;
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
		box = content.document.getBoxObjectFor(screen);
		assert.isFalse(box.width);
		assert.isFalse(box.height);
	},

	'スクリーン上でのクリック操作': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;
		XMigemoHighlight.strongHighlight = true;

		gFindBar.openFindBar();
		yield wait;
		findField.focus();


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NORMAL;

		action.inputTextToField(findField, 'text field');
		yield 1000;
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		var screen = content.document.getElementById(kSCREEN);
		var box = browser.selectedBrowser.boxObject;
		var click = {
				button : 0,
				x : 10,
				y : 10,
				screenX : box.screenX + 10,
				screenY : box.screenY + 10
			};
		action.fireMouseEventOnElement(screen, click);
		yield wait;
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));

	}
};
