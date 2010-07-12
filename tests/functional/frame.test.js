var description = 'フレームを使用したページのテスト';

utils.include('common.inc.js');

function tearDown()
{
	commonTearDown();
}

testFindInFrame.description = 'フレーム内の検索';
testFindInFrame.setUp = function() {
	commonSetUp(baseURL+'../fixtures/frameTest.html')

	gFindBar.open();
	utils.wait(WAIT);
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	utils.wait(WAIT);
};
function testFindInFrame()
{
	var firstDoc = $('frame1', content).contentDocument;
	var secondDoc = $('frame2', content).contentDocument;

	assert.findAndFound({ input : 'nihongo', found : '日本語', ownerDocument : firstDoc });

	var key = ['return'];
	assert.findAgain({ keyOptions : key, found : 'にほんご', ownerDocument : firstDoc })
	assert.findAgain({ keyOptions : key, found : 'ニホンゴ', ownerDocument : firstDoc })
	assert.findAgain({ keyOptions : key, found : 'nihongo', ownerDocument : firstDoc })
	assert.findAgain({ keyOptions : key, found : '日本語', ownerDocument : secondDoc })
	assert.findAgain({ keyOptions : key, found : 'にほんご', ownerDocument : secondDoc })
	assert.findAgain({ keyOptions : key, found : 'ニホンゴ', ownerDocument : secondDoc })
	assert.findAgain({ keyOptions : key, found : 'nihongo', ownerDocument : secondDoc })
	assert.findAgain({ keyOptions : key, found : '日本語', ownerDocument : firstDoc })

	key = ['return', { shiftKey : true }];
	assert.findAgain({ keyOptions : key, found : 'nihongo', ownerDocument : secondDoc })
	assert.findAgain({ keyOptions : key, found : 'ニホンゴ', ownerDocument : secondDoc })
	assert.findAgain({ keyOptions : key, found : 'にほんご', ownerDocument : secondDoc })
	assert.findAgain({ keyOptions : key, found : '日本語', ownerDocument : secondDoc })
	assert.findAgain({ keyOptions : key, found : 'nihongo', ownerDocument : firstDoc })
	assert.findAgain({ keyOptions : key, found : 'ニホンゴ', ownerDocument : firstDoc })
	assert.findAgain({ keyOptions : key, found : 'にほんご', ownerDocument : firstDoc })
	assert.findAgain({ keyOptions : key, found : '日本語', ownerDocument : firstDoc })
	assert.findAgain({ keyOptions : key, found : 'nihongo', ownerDocument : secondDoc })

}

testNotFound.description = '検索語句を含まないフレームがある場合の検索';
testNotFound.setUp = function() {
	commonSetUp(baseURL+'../fixtures/frameTest2.html')

	gFindBar.open();
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	utils.wait(WAIT);
};
function testNotFound()
{
	var rootDoc = content.document;
	var frameDoc = content.frames[0].document;

	assert.findAndFound({ input : 'nihongo', found : '日本語', ownerDocument : rootDoc });

	var key = ['return'];
	assert.findAgain({ keyOptions : key, found : 'にほんご', ownerDocument : rootDoc })
	assert.findAgain({ keyOptions : key, found : 'ニホンゴ', ownerDocument : rootDoc })
	assert.findAgain({ keyOptions : key, found : 'nihongo', ownerDocument : rootDoc })

	key = ['return', { shiftKey : true }];
	assert.findAgain({ keyOptions : key, found : 'ニホンゴ', ownerDocument : rootDoc })
	assert.findAgain({ keyOptions : key, found : 'にほんご', ownerDocument : rootDoc })
}
