<![CDATA[
../../components/xmXMigemoTextUtils.js
../../components/xmXMigemoFileAccess.js
../../components/xmXMigemoDicManager.js
../../components/xmXMigemoDictionary.js
../../components/xmXMigemoDictionaryJa.js
../../components/xmXMigemoCache.js
../../components/xmXMigemoEngineJa.js
../../components/xmXMigemoTextTransform.js
../../components/xmXMigemoTextTransformJa.js
../../components/xmXMigemoCore.js
../../components/xmXMigemoFind.js
../../components/xmXMigemoMail.js
]]>.toString()
	.replace(/^\s+|\s+$/g, '')
	.split('\n')
	.forEach(function(aURI) {
		utils.include({
			uri                    : aURI,
			encoding               : 'Shift_JIS',
			allowOverrideConstants : true
		});
	}, this);
TEST = true;
