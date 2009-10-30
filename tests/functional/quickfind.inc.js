assert.autoStart = function(aTerm) {
	action.keypressOn(content.document.documentElement, aTerm.charAt(0));
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals(aTerm.charAt(0), XMigemoUI.findTerm);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	if (aTerm.length > 1) {
		action.appendTo(field, aTerm.substring(1), true);
		yield wait;
	}
}

assert.manualStart = function(aTerm, aKey) {
	action.keypressOn(content.document.documentElement, (aKey || '/').charAt(0));
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('', XMigemoUI.findTerm);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	if (aTerm) {
		action.appendTo(field, aTerm, true);
		yield wait;
	}
}

assert.exitByBS = function(aTerm) {
	for (var i = 0, maxi = aTerm.length; i < maxi; i++)
	{
		action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.hidden);
	}

	action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.exitByESC = function() {
	action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_ESCAPE);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.exitByClick = function() {
	action.clickOn(content.document.documentElement);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.timeout = function(aBackToMode) {
	yield XMigemoUI.timeout + wait;
	if (aBackToMode !== void(0))
		assert.equals(aBackToMode, XMigemoUI.findMode);
	else
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.findStart = function() {
	eval(findCommand);
	yield wait;
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
}

assert.isQuickMigemoFindActive = function() {
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
}
