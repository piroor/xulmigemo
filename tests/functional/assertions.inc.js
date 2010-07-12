
assert.findbarState = function(aOptions) {
	assert.equals(XMigemoUI[aOptions.mode], XMigemoUI.findMode, inspect(aOptions));
	if (aOptions.shown)
		assert.isFalse(XMigemoUI.hidden, inspect(aOptions));
	else
		assert.isTrue(XMigemoUI.hidden, inspect(aOptions));
}


assert.findAndFound = function(aOptions) {
	action.inputTo(XMigemoUI.field, aOptions.input);
	utils.wait(aOptions.wait || WAIT);
	assert.found(aOptions);
}

assert.found = function(aOptions) {
	assert.notEquals('notfound', XMigemoUI.field.getAttribute('status'), inspect(aOptions));

	if (aOptions.ignoreFoundRange)
		return;

	var range = XMigemoUI.lastFoundRange;
	assert.isTrue(range, inspect(aOptions));

	if (aOptions.found) {
		if (typeof aOptions.found == 'string')
			assert.equals(aOptions.found, range.toString(), inspect(aOptions));
		else
			assert.matches(aOptions.found, range.toString(), inspect(aOptions));
	}
	if (aOptions.ownerDocument) {
		assert.equals(aOptions.ownerDocument.URL, range.startContainer.ownerDocument.URL, inspect(aOptions));
		assert.equals(aOptions.ownerDocument, range.startContainer.ownerDocument, inspect(aOptions));
	}
}

assert.findAndNofFound = function(aOptions) {
	action.inputTo(XMigemoUI.field, aOptions.input);
	utils.wait(aOptions.wait || WAIT);
	assert.nofFound(aOptions);
}

assert.nofFound = function(aOptions) {
	assert.equals('notfound', XMigemoUI.field.getAttribute('status'), inspect(aOptions));
}

assert.findAgain = function(aOptions) {
	keypressMultiply([XMigemoUI.field].concat(aOptions.keyOptions), aOptions.times || 1);
	assert.found(aOptions);
}


assert.changeModeByAPI = function(aMode) {
	XMigemoUI.findMode = XMigemoUI[aMode];
	utils.wait(WAIT);
	assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
}

assert.changeModeByButtonClick = function(aMode, aIndex) {
	action.clickOn(XMigemoUI.findModeSelector.childNodes[aIndex]);
	utils.wait(WAIT);
	assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
}

assert.changeModeByFlipBack = function(aMode, aIndex, aNext) {
	action.clickOn(XMigemoUI.findModeSelector.childNodes[aIndex]);
	utils.wait(WAIT);
	assert.equals(XMigemoUI[aNext], XMigemoUI.findMode, aMode);
}

assert.changeModeByFindCommand = function(aMode) {
	eval(findCommand);
	utils.wait(WAIT);
	assert.equals(XMigemoUI[aMode], XMigemoUI.findMode, aMode);
}

