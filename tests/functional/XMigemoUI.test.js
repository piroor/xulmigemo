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


testDoProcessForAllFrames.setUp = function()
{
	yield Do(utils.loadURI(baseURL+'../res/frameTest.html'));
};
function testDoProcessForAllFrames()
{
	var scope = { attrName : '_moz-xmigemo-test-attribute' };
	XMigemoUI.doProcessForAllFrames(
		function(aFrame) {
			aFrame.document.documentElement.setAttribute(this.attrName, true);
		},
		scope
	);
	assert.isTrue(content.document.documentElement.hasAttribute(scope.attrName));
	assert.isTrue($('frame1', content).contentDocument.documentElement.hasAttribute(scope.attrName));
	assert.isTrue($('frame2', content).contentDocument.documentElement.hasAttribute(scope.attrName));

	XMigemoUI.doProcessForAllFrames(
		function(aFrame) {
			aFrame.document.documentElement.removeAttribute(this.attrName, true);
		},
		scope
	);
	assert.isFalse(content.document.documentElement.hasAttribute(scope.attrName));
	assert.isFalse($('frame1', content).contentDocument.documentElement.hasAttribute(scope.attrName));
	assert.isFalse($('frame2', content).contentDocument.documentElement.hasAttribute(scope.attrName));
}

testClearFocusRingForSingleFrame.setUp = function()
{
	yield Do(utils.loadURI(baseURL+'../res/keyEventTest.html'));
	Array.slice(content.document.links).forEach(function(aLink) {
		aLink.setAttribute(XMigemoUI.kFOCUSED, true);
	});
};
function testClearFocusRingForSingleFrame()
{
	var links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', content.document);
	assert.equals(2, links.length);
	XMigemoUI.clearFocusRing();
	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', content.document);
	assert.equals(0, links.length);
}

testClearFocusRingForMultipleFrames.setUp = function()
{
	yield Do(utils.loadURI(baseURL+'../res/frameTest.html'));
	Array.slice($('frame1', content).contentDocument.links).forEach(function(aLink) {
		aLink.setAttribute(XMigemoUI.kFOCUSED, true);
	});
	Array.slice($('frame2', content).contentDocument.links).forEach(function(aLink) {
		aLink.setAttribute(XMigemoUI.kFOCUSED, true);
	});
};
function testClearFocusRingForMultipleFrames()
{
	var links;

	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', $('frame1', content).contentDocument);
	assert.equals(2, links.length);
	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', $('frame2', content).contentDocument);
	assert.equals(2, links.length);

	XMigemoUI.clearFocusRing();

	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', $('frame1', content).contentDocument);
	assert.equals(0, links.length);
	links = $X('/descendant::*[@'+XMigemoUI.kFOCUSED+'="true"]', $('frame2', content).contentDocument);
	assert.equals(0, links.length);
}
