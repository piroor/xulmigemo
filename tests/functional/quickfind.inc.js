assert.autoStart = function(aTerm) {
	action.keypressOn(content.document.documentElement, aTerm.charAt(0));
	utils.wait(WAIT);
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals(aTerm.charAt(0), XMigemoUI.findTerm);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicator.getAttribute('hidden'));
	if (aTerm.length > 1) {
		action.appendTo(field, aTerm.substring(1), true);
		utils.wait(WAIT);
	}
}

assert.manualStart = function(aTerm, aKey) {
	action.keypressOn(content.document.documentElement, (aKey || '/').charAt(0));
	utils.wait(WAIT);
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('', XMigemoUI.findTerm);
	assert.notEquals('notfound', field.getAttribute('status'));
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicator.getAttribute('hidden'));
	if (aTerm) {
		action.appendTo(field, aTerm, true);
		utils.wait(WAIT);
	}
}

assert.exitByBS = function(aTerm) {
	for (var i = 0, maxi = aTerm.length; i < maxi; i++)
	{
		action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
		utils.wait(WAIT);
		assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
		assert.isFalse(XMigemoUI.hidden);
	}

	action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_BACK_SPACE);
	utils.wait(WAIT);
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.exitByESC = function() {
	action.keypressOn(field, Ci.nsIDOMKeyEvent.DOM_VK_ESCAPE);
	utils.wait(WAIT);
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.exitByClick = function() {
	action.clickOn(content.document.documentElement);
	utils.wait(WAIT);
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.timeout = function(aBackToMode) {
	utils.wait(XMigemoUI.timeout + WAIT);
	if (aBackToMode !== void(0))
		assert.equals(aBackToMode, XMigemoUI.findMode);
	else
		assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isTrue(XMigemoUI.hidden);
}

assert.findStart = function() {
	eval(findCommand);
	utils.wait(WAIT);
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.equals('true', XMigemoUI.timeoutIndicator.getAttribute('hidden'));
}

assert.isQuickMigemoFindActive = function() {
	assert.equals(XMigemoUI.FIND_MODE_MIGEMO, XMigemoUI.findMode);
	assert.isFalse(XMigemoUI.hidden);
	assert.notEquals('true', XMigemoUI.timeoutIndicator.getAttribute('hidden'));
}
