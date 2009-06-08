var description = 'フレームを使用したページのテスト';

utils.include('common.inc.js');

assert.found = function(aTerm, aDocument) {
	var range = XMigemoUI.lastFoundRange;
	assert.isTrue(range);
	if (aTerm) assert.equals(aTerm, range.toString());
	assert.equals(aDocument.URL, range.startContainer.ownerDocument.URL);
}

assert.find_again = function(aKey, aTimes, aTerm, aDocument) {
	yield Do(fireKeyEvents(field, aKey, aTimes));
	assert.found(aTerm, aDocument);
}

function tearDown()
{
	commonTearDown();
}

testFindInFrame.description = 'フレーム内の検索';
testFindInFrame.setUp = function() {
	yield Do(commonSetUp(baseURL+'../fixtures/frameTest.html'));

	gFindBar.openFindBar();
	yield wait;
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield wait;
};
function testFindInFrame()
{
	var firstDoc = $('frame1', content).contentDocument;
	var secondDoc = $('frame2', content).contentDocument;

	action.inputTextToField(field, 'nihongo');
	yield wait;
	assert.found('日本語', firstDoc);

	yield Do(assert.find_again(key_RETURN, 1, 'にほんご', firstDoc));
	yield Do(assert.find_again(key_RETURN, 1, 'ニホンゴ', firstDoc));
	yield Do(assert.find_again(key_RETURN, 1, 'nihongo', firstDoc));
	yield Do(assert.find_again(key_RETURN, 1, '日本語', secondDoc));
	yield Do(assert.find_again(key_RETURN, 1, 'にほんご', secondDoc));
	yield Do(assert.find_again(key_RETURN, 1, 'ニホンゴ', secondDoc));
	yield Do(assert.find_again(key_RETURN, 1, 'nihongo', secondDoc));
	yield Do(assert.find_again(key_RETURN, 1, '日本語', firstDoc));

	var key = {
		keyCode : key_RETURN.keyCode,
		shiftKey : true
	};
	yield Do(assert.find_again(key, 1, 'nihongo', secondDoc));
	yield Do(assert.find_again(key, 1, 'ニホンゴ', secondDoc));
	yield Do(assert.find_again(key, 1, 'にほんご', secondDoc));
	yield Do(assert.find_again(key, 1, '日本語', secondDoc));
	yield Do(assert.find_again(key, 1, 'nihongo', firstDoc));
	yield Do(assert.find_again(key, 1, 'ニホンゴ', firstDoc));
	yield Do(assert.find_again(key, 1, 'にほんご', firstDoc));
	yield Do(assert.find_again(key, 1, '日本語', firstDoc));
	yield Do(assert.find_again(key, 1, 'nihongo', secondDoc));

}

testNotFound.description = '検索語句を含まないフレームがある場合の検索';
testNotFound.setUp = function() {
	yield Do(commonSetUp(baseURL+'../fixtures/frameTest2.html'));

	gFindBar.openFindBar();
	XMigemoUI.findMode = XMigemoUI.FIND_MODE_MIGEMO;
	yield wait;
};
function testNotFound()
{
	var rootDoc = content.document;
	var frameDoc = content.frames[0].document;

	action.inputTextToField(field, 'nihongo');
	yield wait;
	assert.found('日本語', rootDoc);

	yield Do(assert.find_again(key_RETURN, 1, 'にほんご', rootDoc));
	yield Do(assert.find_again(key_RETURN, 1, 'ニホンゴ', rootDoc));
	yield Do(assert.find_again(key_RETURN, 1, 'nihongo', rootDoc));

	var key = {
		keyCode : key_RETURN.keyCode,
		shiftKey : true
	};
	yield Do(assert.find_again(key, 1, 'ニホンゴ', rootDoc));
	yield Do(assert.find_again(key, 1, 'にほんご', rootDoc));
}
