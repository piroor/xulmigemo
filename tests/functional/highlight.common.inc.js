var kSCREEN = '__moz_xmigemo-find-highlight-screen';
var kHIGHLIGHTS = 'descendant::*[@id="__firefox-findbar-search-id" or contains(@class, "__mozilla-findbar-search") or contains(@class, "__mozilla-findbar-animation")]';
var kMARKER_CANVAS = '__moz_xmigemo-found-marker-canvas';

assert.highlightCheck = function(aDisabled, aChecked, aMessage) {
	var check = XMigemoUI.highlightCheck;
	if (aDisabled)
		assert.isTrue(check.disabled, aMessage);
	else
		assert.isFalse(check.disabled, aMessage);
	if (aChecked)
		assert.isTrue(check.checked, aMessage);
	else
		assert.isFalse(check.checked, aMessage);
}

function selectTextInPage()
{
	var selection = content.getSelection();
	var range = content.document.createRange();
	var node = content.document.getElementsByTagName('a')[0].firstChild;
	range.setStart(node, 0);
	range.setEnd(node, 6);
	selection.addRange(range);
	assert.equals('sample', selection.toString());
	return selection;
}

function autoHighlightTest(aMode, aOKShort, aOKLong, aNGShort, aNGLong, aOKLongNum) {
	var message = 'mode is '+aMode;

	XMigemoUI.findMode = XMigemoUI[aMode];
	XMigemoUI.caseSensitiveCheck.checked = false;
	field.focus();

	assert.findAndFound({ input : aOKShort, wait : 1500, ignoreFoundRange : true })
	assert.isFalse(XMigemoUI.shouldHighlightAll);
	assert.highlightCheck(false, false, message);
	assert.findAndFound({ input : aOKLong, wait : 1500, ignoreFoundRange : true })
	assert.isTrue(XMigemoUI.shouldHighlightAll);
	assert.highlightCheck(false, true, message);
	var xpathResult = content.document.evaluate(
		kHIGHLIGHTS,
		content.document,
		null,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null
	);
	assert.equals(aOKLongNum, xpathResult.snapshotLength, message);
	assert.findAndNofFound({ input : aNGShort, wait : 1500 });
	assert.isFalse(XMigemoUI.shouldHighlightAll);
	assert.highlightCheck(false, false, message);
	assert.findAndNofFound({ input : aNGLong, wait : 1500 });
	assert.isFalse(XMigemoUI.shouldHighlightAll);
	assert.highlightCheck(false, false, message);

	gFindBar.close();
	utils.wait(WAIT);
	var selection = selectTextInPage();
	var lastFindTerm = selection.toString();
	gFindBar.open();
	utils.wait(WAIT);
	assert.highlightCheck(false, true);

	gFindBar.close();
	utils.wait(WAIT);
	selection.removeAllRanges();
	gFindBar.open();
	utils.wait(WAIT);
	assert.equals(lastFindTerm, field.value);
	assert.highlightCheck(false, false);
}

assert.screenStateForFind = function(aTerm, aShown) {
	action.inputTo(field, aTerm);
	utils.wait(1500);
	var screen = content.document.getElementById(kSCREEN);
	assert.isTrue(screen);
	var box = utils.getBoxObjectFor(screen);
	if (aShown) {
		assert.isTrue(XMigemoUI.highlightCheck.checked);
		assert.equals('on', content.document.documentElement.getAttribute(kSCREEN));
		assert.isTrue(box.width);
		assert.isTrue(box.height);
	}
	else {
		if (aTerm)
			assert.isFalse(XMigemoUI.highlightCheck.checked);
		else
			assert.isTrue(XMigemoUI.highlightCheck.disabled)
		assert.notEquals('on', content.document.documentElement.getAttribute(kSCREEN));
		assert.isFalse(box.width);
		assert.isFalse(box.height);
	}
}

assert.markerStateForFind = function(aTerm, aShown) {
	action.inputTo(field, aTerm);
	utils.wait(1500);
	var canvas = content.document.getElementById(kMARKER_CANVAS);
	if (aShown) {
		assert.isTrue(canvas);
		var box = utils.getBoxObjectFor(canvas);
		assert.isTrue(box.width);
		assert.isTrue(box.height);
	}
	else {
		assert.isNull(canvas);
	}
}
