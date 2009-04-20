assert.autoStart = function(aTerm) {
	var key = { charCode : aTerm.charCodeAt(0) };
	action.fireKeyEventOnElement(content.document.documentElement, key);
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals(aTerm.charAt(0), XMigemoUI.findTerm);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	if (aTerm.length > 1) {
		action.inputTextToField(field, aTerm.substring(1), true);
		yield wait;
	}
}

assert.manualStart = function(aTerm, aKey) {
	var key = { charCode : (aKey || '/').charCodeAt(0) };
	action.fireKeyEventOnElement(content.document.documentElement, key);
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('', XMigemoUI.findTerm);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	if (aTerm) {
		action.inputTextToField(field, aTerm, true);
		yield wait;
	}
}

assert.exitByBS = function(aTerm) {
	for (var i = 0, maxi = aTerm.length; i < maxi; i++)
	{
		action.fireKeyEventOnElement(field, key_BS);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.hidden);
	}

	action.fireKeyEventOnElement(field, key_BS);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.exitByESC = function() {
	var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE };
	action.fireKeyEventOnElement(field, key);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.exitByClick = function() {
	action.fireMouseEventOnElement(content.document.documentElement);
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
