// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');
utils.include('quickfind.inc');

var kSCREEN = '__moz_xmigemo-find-highlight-screen';
var kHIGHLIGHTS = 'descendant::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search" or @class="__mozilla-findbar-animation"]';

var htmlTests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;
		commonSetUp(retVal);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	}
};

var xmlTests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTestXML);
		yield retVal;
		commonSetUp(retVal);
		yield wait;
		assert.isTrue(XMigemoUI.findBarHidden);
	}
};

function autoHighlightTest(aMode, aOKShort, aOKLong, aNGShort, aNGLong, aOKLongNum) {
	var message = 'mode is '+aMode;

	XMigemoUI.findMode = XMigemoUI[aMode];
	XMigemoUI.findCaseSensitiveCheck.checked = false;
	findField.focus();

	action.inputTextToField(findField, aOKShort);
	yield 1500;
	assert.notEquals('notfound', findField.getAttribute('status'), message);
	assert.isFalse(XMigemoUI.findHighlightCheck.disabled, message);
	assert.isFalse(XMigemoUI.findHighlightCheck.checked, message);

	action.inputTextToField(findField, aOKLong);
	yield 1500;
	assert.notEquals('notfound', findField.getAttribute('status'), message);
	assert.isFalse(XMigemoUI.findHighlightCheck.disabled, message);
	assert.isTrue(XMigemoUI.findHighlightCheck.checked, message);
	var xpathResult = content.document.evaluate(
		kHIGHLIGHTS,
		content.document,
		null,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null
	);
	assert.equals(aOKLongNum, xpathResult.snapshotLength, message);

	action.inputTextToField(findField, aNGShort);
	yield 1500;
	assert.equals('notfound', findField.getAttribute('status'), message);
	assert.isFalse(XMigemoUI.findHighlightCheck.disabled, message);
	assert.isFalse(XMigemoUI.findHighlightCheck.checked, message);

	action.inputTextToField(findField, aNGLong);
	yield 1500;
	assert.equals('notfound', findField.getAttribute('status'), message);
	assert.isFalse(XMigemoUI.findHighlightCheck.disabled, message);
	assert.isTrue(XMigemoUI.findHighlightCheck.checked, message);
}

var baseTests = {
	tearDown : function() {
		commonTearDown();
	},

	'通常の検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;
		var xpathResult;

		gFindBar.openFindBar();
		yield wait;
		yield utils.doIteration(autoHighlightTest(
			'FIND_MODE_NATIVE',
			'text',
			'text field',
			'qute',
			'not found long term',
			10
		));
	},

	'正規表現検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		gFindBar.openFindBar();
		yield wait;
		yield utils.doIteration(autoHighlightTest(
			'FIND_MODE_REGEXP',
			'tex',
			'text ?(field|area)',
			'qute',
			'not found long term',
			10
		));
	},

	'Migemo検索で自動ハイライトが正常に動作するかどうか': function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		gFindBar.openFindBar();
		yield wait;
		yield utils.doIteration(autoHighlightTest(
			'FIND_MODE_MIGEMO',
			'niho',
			'nihongo',
			'qute',
			'not found long term',
			4
		));
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
		yield 1500;
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		var screen = content.document.getElementById(kSCREEN);
		assert.isTrue(screen);
		var box = content.document.getBoxObjectFor(screen);
		assert.isTrue(box.width);
		assert.isTrue(box.height);


		action.inputTextToField(findField, '');
		yield 1500;
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
		box = content.document.getBoxObjectFor(screen);
		assert.isFalse(box.width);
		assert.isFalse(box.height);


		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;

		action.inputTextToField(findField, 'nihongo');
		yield 1500;
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		box = content.document.getBoxObjectFor(screen);
		assert.isTrue(box.width);
		assert.isTrue(box.height);


		action.inputTextToField(findField, '');
		yield 1500;
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
		box = content.document.getBoxObjectFor(screen);
		assert.isFalse(box.width);
		assert.isFalse(box.height);
	}
};

htmlTests.__proto__ = baseTests;
xmlTests.__proto__ = baseTests;


var highlightTest = new TestCase('ハイライト表示の基本テスト（HTML）', {runStrategy: 'async'});
highlightTest.tests = htmlTests;

var highlightTestXML = new TestCase('ハイライト表示の基本テスト（XML）', {runStrategy: 'async'});
highlightTestXML.tests = xmlTests;


var highlightAdvancedTest = new TestCase('ハイライト表示時の発展テスト', {runStrategy: 'async'});

highlightAdvancedTest.tests = {
	setUp : function() {
		yield utils.setUpTestWindow();

		var retVal = utils.addTab(keyEventTest);
		yield retVal;
		commonSetUp(retVal);
		yield wait;
	},

	tearDown : function() {
		commonTearDown();
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
		yield 1500;
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		var screen = content.document.getElementById(kSCREEN);
		var box = browser.selectedBrowser.boxObject;
		var click = {
				button : 0,
				x : box.x + 10,
				y : box.y + 10,
				screenX : box.screenX + 10,
				screenY : box.screenY + 10
			};
		action.fireMouseEventOnElement(screen, click);
		yield wait;
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));


		var tabNum = browser.mTabContainer.childNodes.length;


		XMigemoHighlight.toggleHighlightScreen(true);
		yield wait;
		var link = content.document.getElementsByTagName('a')[0];
		var linkBox = content.document.getBoxObjectFor(link);
		click.button = 1;
		click.x = linkBox.x + 10;
		click.y = linkBox.y + 5;
		click.screenX = linkBox.screenX + 10;
		click.screenY = linkBox.screenY + 5;
		action.fireMouseEventOnElement(screen, click);
		yield 1500;
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		assert.equals(tabNum+1, browser.mTabContainer.childNodes.length);


		linkBox = content.document.getBoxObjectFor(link);
		click.button = 0;
		click.x = linkBox.x + 10;
		click.y = linkBox.y + 5;
		click.screenX = linkBox.screenX + 10;
		click.screenY = linkBox.screenY + 5;
		action.fireMouseEventOnElement(screen, click);
		yield 1500;
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
		assert.matches(/\#link$/, content.location.href);
	},

	'自動強調表示の最低文字数が0の時、入力文字列がない場合' : function() {
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 0;
		XMigemoHighlight.strongHighlight = true;
		XMigemoUI.autoStartQuickFind = true;

		var findTerm = 'nihongo';
		yield utils.doIteration(assert_quickFind_autoStart(findTerm));
		assert.isTrue(XMigemoUI.findHighlightCheck.checked);

		for (var i = 0, maxi = findTerm.length; i < maxi; i++)
		{
			assert.isFalse(XMigemoUI.findHighlightCheck.disabled);
			assert.isTrue(XMigemoUI.findHighlightCheck.checked);
			action.fireKeyEventOnElement(findField, key_BS);
			yield wait;
			assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
			assert.isFalse(XMigemoUI.findBarHidden);
		}
		yield wait;
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);
	}
};
