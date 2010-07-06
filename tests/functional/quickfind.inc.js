assert.autoStart = function(aTerm) {
	action.keypressOn(content.document.documentElement, aTerm.charAt(0));
	yield WAIT;
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals(aTerm.charAt(0), XMigemoUI.findTerm);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicator.getAttribute('hidden'));
	if (aTerm.length > 1) {
		action.appendTo(field, aTerm.substring(1), true);
		yield WAIT;
	}
}

assert.manualStart = function(aTerm, aKey) {
	action.keypressOn(content.document.documentElement, (aKey || '/').charAt(0));
	yield WAIT;
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('', XMigemoUI.findTerm);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicator.getAttribute('hidden'));
	if (aTerm) {
		action.appendTo(field, aTerm, true);
		yield WAIT;
	}
}

assert.exitByBS = function(aTerm) {
	for (var i = 0, maxi = aTerm.length; i < maxi; i++)
	{
		action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
		yield WAIT;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.hidden);
	}

	action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
	yield WAIT;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.exitByESC = function() {
	action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_ESCAPE);
	yield WAIT;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.exitByClick = function() {
	action.clickOn(content.document.documentElement);
	yield WAIT;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.timeout = function(aBackToMode) {
	yield XMigemoUI.timeout + WAIT;
	if (aBackToMode !== void(0))
		assert.equals(aBackToMode, XMigemoUI.findMode);
	else
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.findStart = function() {
	eval(findCommand);
	yield WAIT;
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('true', XMigemoUI.timeoutIndicator.getAttribute('hidden'));
}

assert.isQuickMigemoFindActive = function() {
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicator.getAttribute('hidden'));
}
