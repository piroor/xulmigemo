utils.include('pXMigemoClasses.inc.js');

var findModule;

function setUp()
{
	yield utils.setUpTestWindow();
	findModule = new pXMigemoFind();
	findModule.target = utils.getTestWindow().gBrowser;
	findModule.findMode = findModule.FIND_MODE_MIGEMO;
}

function tearDown()
{
	findModule.destroy();
	findModule = null;
	utils.tearDownTestWindow();
}


function assertFindInSingleFrame()
{
	yield Do(utils.loadURI(baseURL+'../res/keyEventTest.html'));

	function assertFound(aTerm) {
		assert.equals(aTerm, findModule.foundRange);
	}

	findModule.find(false, 'nihongo', false);
	assertFound('日本語');
	findModule.find(false, 'nihongo', false);
	assertFound('にほんご');
	findModule.find(false, 'nihongo', false);
	assertFound('ニホンゴ');
	findModule.find(false, 'nihongo', false);
	assertFound('nihongo');
	findModule.find(false, 'nihongo', false);
	assertFound('日本語');

	findModule.find(true, 'nihongo', false);
	assertFound('nihongo');
	findModule.find(true, 'nihongo', false);
	assertFound('ニホンゴ');
	findModule.find(true, 'nihongo', false);
	assertFound('にほんご');

	findModule.findNext(false);
	assertFound('ニホンゴ');
	findModule.findNext(false);
	assertFound('nihongo');
	findModule.findNext(false);
	assertFound('日本語');

	findModule.findPrevious(false);
	assertFound('nihongo');
	findModule.findPrevious(false);
	assertFound('ニホンゴ');
	findModule.findPrevious(false);
	assertFound('にほんご');
}

testFind.setUp = function() {
	findModule.startFromViewport = false;
};
function testFind()
{
	yield Do(assertFindInSingleFrame());
}

testFindFromViewport.setUp = function() {
	findModule.startFromViewport = true;
};
function testFindFromViewport()
{
	yield Do(assertFindInSingleFrame());
}


function assertFindInMultipleFrames()
{
	yield Do(utils.loadURI(baseURL+'../res/frameTest.html'));

	function assertFoundInDocument(aTerm, aDocument) {
		assert.equals(aTerm, findModule.foundRange);
		assert.equals(aDocument, findModule.foundRange.startContainer.ownerDocument);
	}

	var firstDoc = $('frame1', content).contentDocument;
	var secondDoc = $('frame2', content).contentDocument;

	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('日本語', firstDoc);
	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('にほんご', firstDoc);
	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('ニホンゴ', firstDoc);
	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('nihongo', firstDoc);
	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('日本語', secondDoc);
	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('にほんご', secondDoc);
	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('ニホンゴ', secondDoc);
	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('nihongo', secondDoc);
	findModule.find(false, 'nihongo', false);
	assertFoundInDocument('日本語', firstDoc);

	findModule.find(true, 'nihongo', false);
	assertFoundInDocument('nihongo', secondDoc);
	findModule.find(true, 'nihongo', false);
	assertFoundInDocument('ニホンゴ', secondDoc);
	findModule.find(true, 'nihongo', false);
	assertFoundInDocument('にほんご', secondDoc);
	findModule.find(true, 'nihongo', false);
	assertFoundInDocument('日本語', secondDoc);
	findModule.find(true, 'nihongo', false);
	assertFoundInDocument('nihongo', firstDoc);
	findModule.find(true, 'nihongo', false);
	assertFoundInDocument('ニホンゴ', firstDoc);

	findModule.findNext(false);
	assertFoundInDocument('nihongo', firstDoc);
	findModule.findNext(false);
	assertFoundInDocument('日本語', secondDoc);
	findModule.findNext(false);
	assertFoundInDocument('にほんご', secondDoc);

	findModule.findPrevious(false);
	assertFoundInDocument('日本語', secondDoc);
	findModule.findPrevious(false);
	assertFoundInDocument('nihongo', firstDoc);
	findModule.findPrevious(false);
	assertFoundInDocument('ニホンゴ', firstDoc);
}

testFindInFrame.setUp = function() {
	findModule.startFromViewport = false;
};
function testFindInFrame()
{
	yield Do(assertFindInMultipleFrames());
}

testFindInFrameFromViewport.setUp = function() {
	findModule.startFromViewport = true;
};
function testFindInFrameFromViewport()
{
	yield Do(assertFindInMultipleFrames());
}


testFindFirstVisibleNode.setUp = function() {
	var win = utils.getTestWindow();
	win.resizeTo(500, 500);
	assert.compare(200, '<', utils.contentWindow.innerHeight);
};
function testFindFirstVisibleNode()
{
	function assertScrollAndFind(aIdOrNode, aFindFlag)
	{
		var frame = utils.contentWindow;
		var item = typeof aIdOrNode == 'string' ? frame.document.getElementById(aIdOrNode) : aIdOrNode ;
		frame.scrollTo(
			0,
			(aFindFlag & findModule.FIND_BACK ?
				item.offsetTop - frame.innerHeight + item.offsetHeight :
				item.offsetTop
			)
		);
		var node = findModule.findFirstVisibleNode(aFindFlag, frame);
		assert.equals(item, node);
	}

	yield utils.addTab(baseURL+'../res/shortPage.html', { selected : true });
	assertScrollAndFind(utils.contentDocument.documentElement, findModule.FIND_DEFAULT);
	assertScrollAndFind('p3', findModule.FIND_BACK);

	yield utils.addTab(baseURL+'../res/longPage.html', { selected : true });
	assertScrollAndFind(utils.contentDocument.documentElement, findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_BACK);
	assertScrollAndFind('p21', findModule.FIND_BACK);

	yield utils.addTab(baseURL+'../res/tooLongPage.html', { selected : true });
	assertScrollAndFind(utils.contentDocument.documentElement, findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_DEFAULT);
	assertScrollAndFind('p10', findModule.FIND_BACK);
	assertScrollAndFind('p21', findModule.FIND_BACK);
}
