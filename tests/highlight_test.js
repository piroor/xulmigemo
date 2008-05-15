// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

utils.include('common.inc');
utils.include('quickfind.inc');

var kSCREEN = '__moz_xmigemo-find-highlight-screen';
var kHIGHLIGHTS = 'descendant::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search" or @class="__mozilla-findbar-animation"]';

function assert_highlightCheck(aDisabled, aChecked, aMessage) {
	var check = XMigemoUI.findHighlightCheck;
	if (aDisabled)
		assert.True(check.disabled, aMessage);
	else
		assert.isFalse(check.disabled, aMessage);
	if (aChecked)
		assert.isTrue(check.checked, aMessage);
	else
		assert.isFalse(check.checked, aMessage);
}

function assert_find_found(aTerm, aMessage) {
	action.inputTextToField(findField, aTerm);
	yield 1500;
	assert.notEquals('notfound', findField.getAttribute('status'), aMessage);
}

function assert_find_notFound(aTerm, aMessage) {
	action.inputTextToField(findField, aTerm);
	yield 1500;
	assert.equals('notfound', findField.getAttribute('status'), aMessage);
}

function autoHighlightTest(aMode, aOKShort, aOKLong, aNGShort, aNGLong, aOKLongNum) {
	var message = 'mode is '+aMode;

	XMigemoUI.findMode = XMigemoUI[aMode];
	XMigemoUI.findCaseSensitiveCheck.checked = false;
	findField.focus();

	yield utils.doIteration(assert_find_found(aOKShort, message));
	assert_highlightCheck(false, false, message);
	yield utils.doIteration(assert_find_found(aOKLong, message));
	assert_highlightCheck(false, true, message);
	var xpathResult = content.document.evaluate(
		kHIGHLIGHTS,
		content.document,
		null,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null
	);
	assert.equals(aOKLongNum, xpathResult.snapshotLength, message);
	yield utils.doIteration(assert_find_notFound(aNGShort, message));
	assert_highlightCheck(false, false, message);
	yield utils.doIteration(assert_find_notFound(aNGLong, message));
	assert_highlightCheck(false, true, message);
}

function assert_screenStateForFind(aTerm, aShown) {
	action.inputTextToField(findField, aTerm);
	yield 1500;
	var screen = content.document.getElementById(kSCREEN);
	assert.isTrue(screen);
	var box = content.document.getBoxObjectFor(screen);
	if (aShown) {
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		assert.isTrue(box.width);
		assert.isTrue(box.height);
	}
	else {
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
		assert.isFalse(box.width);
		assert.isFalse(box.height);
	}
}

var htmlTests = {
	setUp : function() {
		yield utils.doIteration(commonSetUp(keyEventTest));
		assert.isTrue(XMigemoUI.findBarHidden);
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;
	}
};

var xmlTests = {
	setUp : function() {
		yield utils.doIteration(commonSetUp(keyEventTestXML));
		assert.isTrue(XMigemoUI.findBarHidden);
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;
	}
};

var baseTests = {
	tearDown : function() {
		commonTearDown();
	},

	'通常の検索で自動ハイライトが正常に動作するかどうか': function() {
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
		XMigemoHighlight.strongHighlight = true;

		gFindBar.openFindBar();
		yield wait;
		findField.focus();

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NORMAL;
		yield utils.doIteration(assert_screenStateForFind('text field', true));
		yield utils.doIteration(assert_screenStateForFind('', false));
		XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
		yield utils.doIteration(assert_screenStateForFind('nihongo', true));
		yield utils.doIteration(assert_screenStateForFind('', false));
	}
};

htmlTests.__proto__ = baseTests;
xmlTests.__proto__ = baseTests;


var highlightTest = new TestCase('ハイライト表示の基本テスト（HTML）', {runStrategy: 'async'});
highlightTest.tests = htmlTests;

var highlightTestXML = new TestCase('ハイライト表示の基本テスト（XML）', {runStrategy: 'async'});
highlightTestXML.tests = xmlTests;


function fireClickEventOn(aNode, aButton) {
	var box = aNode.ownerDocument.getBoxObjectFor(aNode);
	action.fireMouseEventOnElement(
		content.document.getElementById(kSCREEN),
		{
			button  : aButton,
			x       : box.x + 10,
			y       : box.y + 5,
			screenX : box.screenX + 10,
			screenY : box.screenY + 5
		}
	);
	yield 1500;
}

var highlightAdvancedTest = new TestCase('ハイライト表示時の発展テスト', {runStrategy: 'async'});

highlightAdvancedTest.tests = {
	setUp : function() {
		yield utils.doIteration(commonSetUp(keyEventTest));
		XMigemoUI.highlightCheckedAlways = true;
		XMigemoHighlight.strongHighlight = true;
	},

	tearDown : function() {
		commonTearDown();
	},

	'スクリーン上でのクリック操作': function() {
		XMigemoUI.highlightCheckedAlwaysMinLength = 5;

		gFindBar.openFindBar();
		yield wait;
		findField.focus();

		XMigemoUI.findMode = XMigemoUI.FIND_MODE_NORMAL;

		action.inputTextToField(findField, 'text field');
		yield 1500;
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		yield utils.doIteration(fireClickEventOn(browser.selectedBrowser, 0));
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));

		XMigemoHighlight.toggleHighlightScreen(true);
		yield wait;

		var link = content.document.getElementsByTagName('a')[0];
		var tabNum = browser.mTabContainer.childNodes.length;
		yield utils.doIteration(fireClickEventOn(link, 1));
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		assert.equals(tabNum+1, browser.mTabContainer.childNodes.length);

		yield utils.doIteration(fireClickEventOn(link, 0));
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
		assert.matches(/\#link$/, content.location.href);
	},

	'自動強調表示の最低文字数が0の時、入力文字列がない場合' : function() {
		XMigemoUI.highlightCheckedAlwaysMinLength = 0;
		XMigemoUI.autoStartQuickFind = true;

		var findTerm = 'nihongo';
		yield utils.doIteration(assert_quickFind_autoStart(findTerm));
		for (var i = 0, maxi = findTerm.length; i < maxi; i++)
		{
			assert_highlightCheck(false, true);
			action.fireKeyEventOnElement(findField, key_BS);
			yield wait;
			assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
			assert.isFalse(XMigemoUI.findBarHidden);
		}
		yield wait;
		assert.isFalse(XMigemoUI.findHighlightCheck.checked);
	}
};
