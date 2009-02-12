var kSCREEN = '__moz_xmigemo-find-highlight-screen';
var kHIGHLIGHTS = 'descendant::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search" or @class="__mozilla-findbar-animation"]';

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

assert.find_found = function(aTerm, aMessage) {
	action.inputTextToField(field, aTerm);
	yield 1500;
	assert.notEquals('notfound', field.getAttribute('status'), aMessage);
}

assert.find_notFound = function(aTerm, aMessage) {
	action.inputTextToField(field, aTerm);
	yield 1500;
	assert.equals('notfound', field.getAttribute('status'), aMessage);
}

function autoHighlightTest(aMode, aOKShort, aOKLong, aNGShort, aNGLong, aOKLongNum) {
	var message = 'mode is '+aMode;

	XMigemoUI.findMode = XMigemoUI[aMode];
	XMigemoUI.caseSensitiveCheck.checked = false;
	field.focus();

	yield Do(assert.find_found(aOKShort, message));
	assert.isFalse(XMigemoUI.shouldHighlightAll);
	assert.highlightCheck(false, false, message);
	yield Do(assert.find_found(aOKLong, message));
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
	yield Do(assert.find_notFound(aNGShort, message));
	assert.isFalse(XMigemoUI.shouldHighlightAll);
	assert.highlightCheck(false, false, message);
	yield Do(assert.find_notFound(aNGLong, message));
	assert.isFalse(XMigemoUI.shouldHighlightAll);
	assert.highlightCheck(false, false, message);
}

assert.screenStateForFind = function(aTerm, aShown) {
	action.inputTextToField(field, aTerm);
	yield 1500;
	var screen = content.document.getElementById(kSCREEN);
	assert.isTrue(screen);
	var box = content.document.getBoxObjectFor(screen);
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
