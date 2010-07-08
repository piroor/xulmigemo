var description = 'フレームを使用したページのテスト';

utils.include('common.inc.js');

assert.found = function(aTerm, aDocument) {
	var range = XMigemoUI.lastFoundRange;
	assert.isTrue(range);
	if (aTerm) assert.equals(aTerm, range.toString());
	assert.equals(aDocument.URL, range.startContainer.ownerDocument.URL);
}

assert.findAgain = function(aKeyOptions, aTimes, aTerm, aDocument) {
	keypressMultiply([field].concat(aKeyOptions), aTimes)
	assert.found(aTerm, aDocument);
}

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

	action.inputTo(field, 'nihongo');
	utils.wait(WAIT);
	assert.found('日本語', firstDoc);

	var key = ['return'];
	assert.findAgain(key, 1, 'にほんご', firstDoc)
	assert.findAgain(key, 1, 'ニホンゴ', firstDoc)
	assert.findAgain(key, 1, 'nihongo', firstDoc)
	assert.findAgain(key, 1, '日本語', secondDoc)
	assert.findAgain(key, 1, 'にほんご', secondDoc)
	assert.findAgain(key, 1, 'ニホンゴ', secondDoc)
	assert.findAgain(key, 1, 'nihongo', secondDoc)
	assert.findAgain(key, 1, '日本語', firstDoc)

	key = ['return', { shiftKey : true }];
	assert.findAgain(key, 1, 'nihongo', secondDoc)
	assert.findAgain(key, 1, 'ニホンゴ', secondDoc)
	assert.findAgain(key, 1, 'にほんご', secondDoc)
	assert.findAgain(key, 1, '日本語', secondDoc)
	assert.findAgain(key, 1, 'nihongo', firstDoc)
	assert.findAgain(key, 1, 'ニホンゴ', firstDoc)
	assert.findAgain(key, 1, 'にほんご', firstDoc)
	assert.findAgain(key, 1, '日本語', firstDoc)
	assert.findAgain(key, 1, 'nihongo', secondDoc)

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

	action.inputTo(field, 'nihongo');
	utils.wait(WAIT);
	assert.found('日本語', rootDoc);

	var key = ['return'];
	assert.findAgain(key, 1, 'にほんご', rootDoc)
	assert.findAgain(key, 1, 'ニホンゴ', rootDoc)
	assert.findAgain(key, 1, 'nihongo', rootDoc)

	key = ['return', { shiftKey : true }];
	assert.findAgain(key, 1, 'ニホンゴ', rootDoc)
	assert.findAgain(key, 1, 'にほんご', rootDoc)
}
