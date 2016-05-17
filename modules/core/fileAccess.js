var EXPORTED_SYMBOLS = ['MigemoFileAccess'];

var DEBUG = false;
function log(...aArgs) 
{
	if (DEBUG ||
		Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.fileAccess'))
		Services.console.logStringMessage(aArgs.join(', '));
}

var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

var UConv = Cc['@mozilla.org/intl/scriptableunicodeconverter']
		.getService(Ci.nsIScriptableUnicodeConverter);

var DIR = Cc['@mozilla.org/file/directory_service;1']
		.getService(Ci.nsIProperties);

var nsIFile = Ci.nsIFile;

var MigemoFileAccess = {
	get isWindows() 
	{
		delete this.isWindows;
		let { XMigemoService } = Components.utils.import('resource://xulmigemo-modules/service.jsm', {});
		return this.isWindows = XMigemoService.isWindows;
	},

	readFrom : function(aFile, aEncoding)
	{
		var fileContents;

		var stream = Cc['@mozilla.org/network/file-input-stream;1']
						.createInstance(Ci.nsIFileInputStream);
		try {
			stream.init(aFile, 1, 0, false); // open as "read only"

			var scriptableStream = Cc['@mozilla.org/scriptableinputstream;1']
									.createInstance(Ci.nsIScriptableInputStream);
			scriptableStream.init(stream);

			var fileSize = scriptableStream.available();
			fileContents = scriptableStream.read(fileSize);

			scriptableStream.close();
			stream.close();
		}
		catch(e) {
			dump(e+'\n');
			return null;
		}

		try {
			UConv.charset = aEncoding || 'UTF-8';
			fileContents = UConv.ConvertToUnicode(fileContents);
		}
		catch(e) {
			try {
				UConv.charset = 'Shift_JIS';
				fileContents = UConv.ConvertToUnicode(fileContents);
			}
			catch(e){
			}
		}

		return fileContents;
	},

	writeTo : function(aFile, aContent, aEncoding)
	{
		try {
			UConv.charset = aEncoding || 'UTF-8';
			aContent = UConv.ConvertFromUnicode(aContent);
		}
		catch(e) {
			dump(e+'\n');
		}
		if (!aFile)
			throw 'writeTo: output file is not specified!';

		if (aFile.exists()) aFile.remove(true); // 上書き確認は無し。必要があれば処理を追加。
		aFile.create(aFile.NORMAL_FILE_TYPE, 0666); // アクセス権を8進数で指定。 Win9x などでは無視される。

		if (!aFile.exists())
			throw 'writeTo: failed to create output file '+aFile.path+'!';

		var stream = Cc['@mozilla.org/network/file-output-stream;1']
						.createInstance(Ci.nsIFileOutputStream);
		stream.init(aFile, 2, 0x200, false); // open as "write only"
		stream.write(aContent, aContent.length);
		stream.close();

		return aFile;
	},

	getAbsolutePath : function(aPath)
	{
		var file = Cc['@mozilla.org/file/local;1']
				.createInstance(Ci.nsILocalFile);
		try {
			file.initWithPath(aPath);
			return aPath;
		}
		catch(e) {
		}

		var path;
		if (this.relativePathKeywords.some(function(aKeyword) {
				try {
					if (aPath.indexOf('['+aKeyword+']') == 0) {
						path = aPath.replace('['+aKeyword+']', DIR.get(aKeyword, nsIFile).path);
						return true;
					}
				}
				catch(e) {
				}
				return false;
			}))
			return path;

		if (aPath.indexOf('.') == 0) {
			// relative path
			if (this.isWindows) {
				aPath = aPath.replace(/^\.\.\./g, '\.\.\\\.\.')
							.replace(/\\\.\.\./g, '\\\.\.\\\.\.')
							.replace(/\\/g, '/');
			}
			var binDir = DIR.get('CurProcD', nsIFile);
			file.setRelativeDescriptor(binDir, aPath);
			return file.path;
		}

		return '';
	},

	getRelativePath : function(aPath)
	{
		var path;
		if (this.relativePathKeywords.some(function(aKeyword) {
				try {
					var dir = DIR.get(aKeyword, nsIFile);
					if (aPath.indexOf(dir.path) == 0) {
						path = aPath.replace(dir.path, '['+aKeyword+']');
						return true;
					}
				}
				catch(e) {
				}
				return false;
			}))
			return path;

		var file = Cc['@mozilla.org/file/local;1']
				.createInstance(Ci.nsILocalFile);
		file.initWithPath(aPath);

		var binDir = DIR.get('CurProcD', Ci.nsIFile);
		try {
			aPath = file.getRelativeDescriptor(binDir);
		}
		catch(e) {
			return '';
		}

		if (this.isWindows) {
			aPath = aPath.replace(/\//g, '\\');
		}

		return aPath;
	},

	relativePathKeywords : [
		'ProfD',
		'AppData',
		'LocalAppData',
		'Home',
		'Desk',
		'Docs', // OS X
		'CurProcD',
		'CurWorkD',
		'GreD'
	],


	getExistingPath : function(aPath)
	{
		var file = Cc['@mozilla.org/file/local;1']
				.createInstance(Ci.nsILocalFile);
		try {
			aPath = this.getAbsolutePath(aPath);
			file.initWithPath(aPath);
			if (file.exists()) return aPath;
		}
		catch(e) {
		}
		return '';
	}
};
