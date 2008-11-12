var description = 'XMigemoUIのユニットテスト';

utils.include('common.inc.js');

function setUp()
{
	yield Do(commonSetUp(keyEventTest));
	assert.isTrue(XMigemoUI.hidden);
}

function tearDown()
{
	commonTearDown();
}

function testProperties()
{
		assert.isTrue(XMigemoUI.browser);
		assert.isTrue(XMigemoUI.activeBrowser);
		assert.isTrue(XMigemoUI.findBar);
		assert.isTrue(XMigemoUI.field);
		assert.isTrue(XMigemoUI.label);
		assert.isTrue(XMigemoUI.caseSensitiveCheck);
		assert.isTrue(XMigemoUI.highlightCheck);
		assert.isTrue(XMigemoUI.findMigemoBar);
		assert.isTrue(XMigemoUI.findModeSelectorBox);
		assert.isTrue(XMigemoUI.findModeSelector);
		assert.isTrue(XMigemoUI.timeoutIndicatorBox);
		assert.isTrue(XMigemoUI.timeoutIndicator);
		assert.isTrue(win.XMigemoFind);
		assert.isTrue(win.XMigemoCore);
}
