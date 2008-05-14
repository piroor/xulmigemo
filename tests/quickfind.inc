function assert_quickFind_autoStart(aTerm) {
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

function assert_quickFind_manualStart(aTerm) {
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

function assert_quickFind_exitByBS(aTerm) {
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

function assert_quickFind_exitByESC() {
	var key = { keyCode : Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE };
	action.fireKeyEventOnElement(findField, key);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.findBarHidden);
}

function assert_quickFind_exitByClick() {
	action.fireMouseEventOnElement(content.document.documentElement);
	yield wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.findBarHidden);
}

function assert_quickFind_timeout() {
	yield XMigemoUI.timeout + wait;
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.findBarHidden);
}

function assert_find_start() {
	eval(findCommand);
	yield wait;
	assert.isFalse(XMigemoUI.findBarHidden);
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('true', XMigemoUI.timeoutIndicatorBox.getAttribute('hidden'));
}
