
var XMigemoFileDownloader = {
	progressListener   : null,
	onCompleteListener : null,
	onErrorListener    : null,

	percent : 0,

	tempFile : null,
	dicDir   : null,

	PERMS_FILE      : 0644,
	PERMS_DIRECTORY : 0755,

	nsILocalFile : Components.interfaces.nsILocalFile,

	get DirectoryService()
	{
		if (!this._DirectoryService)
			this._DirectoryService = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
		return this._DirectoryService;
	},
	_DirectoryService : null,

	downloadDictionary : function()
	{
		const IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);

		var lang = XMigemoService.getPref('xulmigemo.lang');
		var uri = XMigemoService.getPref('xulmigemo.dictionary.download.uri.'+lang);
		if (!uri)
			throw 'Download URI for "' + lang + '" is undefined.';

		var source   = IOService.newURI(uri, null, null);
		var tempFile = this.DirectoryService.get('TmpD', Components.interfaces.nsIFile);

		tempFile.append('xulmigemodic.zip');
		if (tempFile.exists()) {
			tempFile.remove(true);
		}

		this.tempFile = tempFile;

		const nsIWebBrowserPersist = Components.interfaces.nsIWebBrowserPersist;
		const Persist = Components.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(nsIWebBrowserPersist);

		Persist.persistFlags = nsIWebBrowserPersist.PERSIST_FLAGS_AUTODETECT_APPLY_CONVERSION |
				nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES |
				nsIWebBrowserPersist.PERSIST_FLAGS_BYPASS_CACHE;

		Persist.progressListener = this;
		Persist.saveURI(source, null, null, null, null, tempFile);
	},

	onComplete : function()
	{
		try {
			var path = this.tempFile.path;

			var parentDir = this.DirectoryService.get('ProfD', Components.interfaces.nsIFile);
			parentDir.append('xulmigemodic');
			if (!parentDir.exists()) {
				try {
					parentDir.create(this.nsILocalFile.DIRECTORY_TYPE, this.PERMS_DIRECTORY);
				}
				catch (e) {
				}
			}

			this.unzipTo(this.tempFile, parentDir);
			this.tempFile.remove(true);

			this.tempFile = null;
		}
		catch(e) {
			this.onError(e);
			return;
		}

		this.dicDir = parentDir;

		var utils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/file-access;1']
				.getService(Components.interfaces.xmIXMigemoFileAccess);

		XMigemoService.setPref('xulmigemo.dicpath', '');
		XMigemoService.setPref('xulmigemo.dicpath-relative', '');
		XMigemoService.setPref('xulmigemo.dicpath', parentDir.path);
		XMigemoService.setPref('xulmigemo.dicpath-relative', utils.getRelativePath(parentDir.path));

		if (this.onCompleteListener && typeof this.onCompleteListener == 'function')
			this.onCompleteListener();
	},

	onError : function(aError)
	{
		if (this.onErrorListener && typeof this.onErrorListener == 'function')
			this.onErrorListener(aError);
	},

	unzipTo : function(aFile, aParent)
	{
		var zipReader = Components.classes['@mozilla.org/libjar/zip-reader;1'].createInstance(Components.interfaces.nsIZipReader);
		try { // Firefox 1.x-2.0
			zipReader.init(aFile);
			zipReader.open();
		}
		catch(e) {
			try {
				zipReader.open(aFile); // Firefox 3.0-
			}
			catch(e) {
				zipReader.close();
				throw e;
			}
		}

		var entries = zipReader.findEntries('*/');
		var target;
		while (
				('hasMore' in entries) ?
				entries.hasMore() : // Firefox 3.0-
				entries.hasMoreElements() // Firefox 1.x-2.0
				)
		{
			var entry = entries.getNext();
			if (typeof entry != 'string') // Firefox 1.x-2.0
				entry = entry.QueryInterface(Components.interfaces.nsIZipEntry).name;
			target = aParent.clone();
			target.append(entry);
			if (!target.exists()) {
				try {
					target.create(this.nsILocalFile.DIRECTORY_TYPE, this.PERMS_DIRECTORY);
				}
				catch (e) {
				}
			}
		}

		entries = zipReader.findEntries('*');
		while (
				('hasMore' in entries) ?
				entries.hasMore() : // Firefox 3.0-
				entries.hasMoreElements() // Firefox 1.x-2.0
				)
		{
			var entry = entries.getNext();
			if (typeof entry != 'string') // Firefox 1.x-2.0
				entry = entry.QueryInterface(Components.interfaces.nsIZipEntry).name;
			target = aParent.clone();
			target.append(entry);
			if (target.exists()) {
//				continue;
				target.remove(true);
			}

			try {
				target.create(this.nsILocalFile.NORMAL_FILE_TYPE, this.PERMS_FILE);
			}
			catch (e) {
			}
			zipReader.extract(entry, target);
		}

		zipReader.close();
	},


	// nsIWebProgressListener
	onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus)
	{
		if (this.progressListener)
			this.progressListener.onStateChange.apply(this.progressListener, arguments);
		if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP) {
			if (this.percent >= 100)
				this.onComplete();
			else
				this.onError();
		}
	},
	onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress)
	{
		if (this.progressListener)
			this.progressListener.onProgressChange.apply(this.progressListener, arguments);
		if (aMaxTotalProgress > 0) {
			this.percent = Math.floor((aCurTotalProgress*100.0)/aMaxTotalProgress);
			if (this.percent > 100) this.percent = 100;
		}
		else {
			this.percent = -1;
		}
	},
	onLocationChange: function()
	{
		if (this.progressListener)
			this.progressListener.onLocationChange.apply(this.progressListener, arguments);
	},
	onStatusChange: function()
	{
		if (this.progressListener)
			this.progressListener.onStatusChange.apply(this.progressListener, arguments);
	},
	onSecurityChange: function()
	{
		if (this.progressListener)
			this.progressListener.onSecurityChange.apply(this.progressListener, arguments);
	},
	QueryInterface : function(aIID)
	{
		if (aIID.equals(Components.interfaces.nsIDownloadProgressListener) ||
			aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_NOINTERFACE;
	}

};


//XMigemoFileDownloader.downloadDictionary();
