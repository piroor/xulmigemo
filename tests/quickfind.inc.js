assert.autoStart = function(aTerm) {
	var key = { charCode : aTerm.charCodeAt(0) };
	action.fireKeyEventOnElement(content.document.documentElement, key);
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals(aTerm.charAt(0), XMigemoUI.findTerm);
	assert.notEquals('notfound', findField.getAttribute('status'));
	assert.isFalse(XMigemoUI.findBarHidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	if (aTerm.length > 1) {
		action.inputTextToField(findField, aTerm.substring(1), true);
		yield wait;
	}
}

assert.manualStart = function(aTerm) {
	var key = { charCode : '/'.charCodeAt(0) };
	action.fireKeyEventOnElement(content.document.documentElement, key);
	yield wait;
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('', XMigemoUI.findTerm);
	assert.notEquals('notfound', findField.getAttribute('status'));
	assert.isFalse(XMigemoUI.findBarHidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
	if (aTerm) {
		action.inputTextToField(findField, aTerm, true);
		yield wait;
	}
}

assert.exitByBS = function(aTerm) {
	for (var i = 0, maxi = aTerm.length; i < maxi; i++)
	{
		action.fireKeyEventOnElement(findField, key_BS);
		yield wait;
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.findBarHidden);
	}

	action.fireKeyEventOnElement(findField, key_BS);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.findBarHidden);
}

assert.exitByESC = function() {
	var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE };
	action.fireKeyEventOnElement(findField, key);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.findBarHidden);
}

assert.exitByClick = function() {
	action.fireMouseEventOnElement(content.document.documentElement);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.findBarHidden);
}

assert.timeout = function(aBackToMode) {
	yield XMigemoUI.timeout + wait;
	if (aBackToMode !== void(0))
		assert.equals(aBackToMode, XMigemoUI.findMode);
	else
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.findBarHidden);
}

assert.findStart = function() {
	eval(findCommand);
	yield wait;
	assert.isFalse(XMigemoUI.findBarHidden);
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
}

assert.isQuickMigemoFindActive = function() {
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isFalse(XMigemoUI.findBarHidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
}
