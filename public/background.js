
var downloadArray = [];
var cancel = false;

chrome.runtime.onMessage.addListener(request => {
    if (request.downloadSequentially) {
        cancel = false;
        downloadSequentially(request.downloadSequentially);
    }
    if (request.cancel){
        cancel = true
    }
});

chrome.downloads.onDeterminingFilename.addListener( (item, suggest) => {
    console.log(item);
    var originalDownload = downloadArray.find( x => x.url == item.url );
    console.log(originalDownload)
    if (originalDownload.filename == 'posttext.txt'){
        suggest({filename: originalDownload.path + originalDownload.filename, conflictAction: "uniquify"})
    } else {
        suggest({filename: originalDownload.path + item.filename, conflictAction: "uniquify"})
    }

})


function downloadSequentially(downloads) {
    downloadArray = downloads;
    let index = 0;
    let currentId;

    chrome.downloads.onChanged.addListener(onChanged);

    next();

    function next() {
        chrome.storage.local.set({pd_downloadStatus: [index, downloads.length]});
        chrome.storage.local.set({pd_status: 'downloading'});

        if (cancel) {
            chrome.tabs.query({ active: true }, tabs => {
                tabs.forEach(tab =>
                    chrome.tabs.sendMessage(tab.id, { finished: 'Cancelled by user' } )
                );
            });
            return false;
        }

        if (index >= downloads.length) {
            chrome.downloads.onChanged.removeListener(onChanged);
            chrome.tabs.query({ active: true }, tabs => {
                tabs.forEach(tab =>
                    chrome.tabs.sendMessage(tab.id, { finished: 'Finished downloading' } )
                );
            });
            return;
        }
        const download = downloads[index];
        index++;


        if (download && download.url) {
            if ( download.filename === 'auto' ){
                chrome.downloads.download({
                    url: download.url
                }, id => {
                    currentId = id;
                });
            } else {
                chrome.downloads.download({
                    url: download.url,
                    filename: download.path + download.filename
                }, id => {
                    currentId = id;
                });
            }

        } else {
            console.log('error in download link url');
        }
    }

    function onChanged({id, state}) {
        if (id === currentId && state && state.current !== 'in_progress') {
            next();
        }
    }
}

chrome.runtime.onInstalled.addListener(function (){
  chrome.tabs.create({url:chrome.runtime.getURL("update.html")},function(){})
})

