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


function testGetEditableNodes()
{
	function assertGetEditableNodes()
	{
		var nodes = [$('single-row1', content), $('multi-row', content), $('single-row2', content), $('single-row3', content), $('single-row4', content), $('single-row5', content), $('single-row6', content), $('single-row7', content), $('single-row8', content), $('single-row9', content)];

		var result = XMigemoUI.getEditableNodes(content.document);
		assert.equals(nodes.length, result.snapshotLength);
		nodes.forEach(function(aNode, aIndex) {
			assert.isNotNull(aNode);
			assert.equals(aNode, result.snapshotItem(aIndex), aIndex);
		});
	}

	yield Do(utils.loadURI(baseURL+'../res/keyEventTest.html'));
	assertGetEditableNodes();
	yield Do(utils.loadURI(baseURL+'../res/keyEventTest.xml'));
	assertGetEditableNodes();
}

function testGetDocumentBody()
{
	yield Do(utils.loadURI(baseURL+'../res/keyEventTest.html'));
	assert.equals(content.document.body, XMigemoUI.getDocumentBody(content.document));
	yield Do(utils.loadURI(baseURL+'../res/keyEventTest.xml'));
	assert.equals(content.document.getElementsByTagName('body')[0], XMigemoUI.getDocumentBody(content.document));
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
