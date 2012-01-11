/**
 * Loads HTML bible files and searches them for text (RegExp).
 * Requires jQuery for AJAX
 *
 * @author John Dyer (http://j.hn/)
 */

bible.BibleSearch = {
		
	isSearching: false,
	
	canceled: false,
	
	bookOsisID: '',
	
	chapterIndex: 0,
	
	searchText: '',
	
	searchRegExp: null,
	
	highlightRegExp: null,
	
	//verseRegExp: new RegExp('v[0-9]{9}','gi'),
	
	verseRegExp: new RegExp('\\w{1,6}\\.\\d{1,3}\\.\\d{1,3}','gi'),
	
	//stripNotesRegExp: new RegExp('<span class="(note|cf)">.+?</span>','gi'),
	stripNotesRegExp: new RegExp('<dl class="(note|cf)">.+?</dl>','gi'),
	
	replaceLexRegExp: new RegExp('<span class="word"[^>]+>(.+?)</span>','gi'),
	
	resultCount: 0,
	
	startTime: null,
	
	searchResultsArray: [],
	
	version: '',
	
	search: function(text, version, chapterCallback, endedCallback) {
		if (this.isSearching)
			return;
		
		// save variables
		this.searchText = text;
		this.version = version;
		this.chapterCallback = chapterCallback;
		this.endedCallback = endedCallback;
		
		// compile regexp
		this.searchRegExp = new RegExp('<span class="verse(.)*\\b' + text + '\\b(.)*</span>\r', 'gi');
		this.highlightRegExp = new RegExp('\\b' + text + '\\b', 'gi');

		// reset variables
		this.bookOsisID = bible.DEFAULT_BIBLE[0];
		this.chapterIndex = 0;
		this.canceled = false;
		this.resultCount = 0;
		this.startTime = new Date();
		this.searchResultsArray = [];
		
		this.isSearching = true;
		this.loadChapter();
	},
	
	cancelSearch: function() {
		this.isSearching = false;
		this.canceled = true;
	},
	
	loadChapter: function() {
		
		var s = this,
			chapterUrl = 'content/bibles/' + this.version + '/' + (this.bookOsisID + '.' + (this.chapterIndex+1)) + '.html';
		
		this.chapterCallback(this.bookOsisID, this.chapterIndex, this.resultCount, this.startTime);
		
		$.ajax({
			url: chapterUrl,
			dataType: 'html',
			success: function(data) {
				
				s.textSearch(data);
				
				//s.ended();
				//return;
				
				// move on or cancel
				if (!s.canceled) {
					s.nextChapter();
				} else {
					s.ended();
				}
			},
			error: function(e) {
				s.nextChapter();
			}
		});			
	},
	
	textSearch: function(data) {

		
		// remove notes
		// <dl class="note"></dl>
		// <dl class="cf"></dl>
		data = data.replace( this.stripNotesRegExp, '' );
		
		data = data.replace( new RegExp('<br>','gi'), '');
		
		// remove Lex/Morph data
		// <span class="word" data-morph="">XXX</span>
		//data = data.replace( this.replaceLexRegExp, '$1');
		
		// find words
		var matches = data.match(this.searchRegExp),
			i, il,
			html, verse;
		
		if (matches != null && matches.length > 0) {
			
			for (i=0, il=matches.length; i<il; i++) {
				
				// hightlight text
				html = matches[i].replace(this.highlightRegExp, function(match) {
					return '<span class="highlight">' + match + '</span>';
				});
				
				// find and format verse
				//console.log(matches[i].match( this.verseRegExp )[0]);
				verse = new bible.Reference( matches[i].match( this.verseRegExp )[0] ); //.toString();
				//console.log(verse);
				
				// put it altogether for a row
				html = '<div class="search-result"><span class="search-verse">' + verse + '</span>' + html + '</div>';
				
				// store results
				this.searchResultsArray.push(  html );
				this.resultCount++;
			}
		}
	},
	
	nextChapter: function() {
		
		// more chapters?
		if (this.chapterIndex < bible.BOOK_DATA[this.bookOsisID].chapters.length-1 ) {
			this.chapterIndex++;
		} else {
			
			this.chapterIndex = 0;
			
			// check for last book!
			if ( bible.DEFAULT_BIBLE.indexOf( this.bookOsisID ) == bible.DEFAULT_BIBLE.length-1 ) {
				this.ended();
				return;
			} else {
				
				// go forward one book
				this.bookOsisID = bible.DEFAULT_BIBLE[ bible.DEFAULT_BIBLE.indexOf( this.bookOsisID )+1 ];
				
			}
		}
		
		var t = this;
		
		// IE errors out without this
		setTimeout(function() {
			t.loadChapter();
		}, 1);
		
	},
	
	ended: function() {		
		this.isSearching = false;
		
		this.endedCallback(this.searchResultsArray.join(''), this.resultCount, this.startTime);
		
		this.searchResultsArray = null;
		
		//results.html( this.searchResultsArray.join('') );	
	}
};