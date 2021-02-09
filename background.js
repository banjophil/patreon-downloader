
chrome.runtime.onMessage.addListener(request => {
    if (request.downloadSequentially) {
        cancel = false;
        downloadSequentially(request.downloadSequentially);
    }
    if (request.cancel){
        cancel = true
    }
});
    
var cancel = false;

function downloadSequentially(downloads) {
    let index = 0;
    let currentId;
    
    chrome.downloads.onChanged.addListener(onChanged);
    
    next();
    
    function next() {
        chrome.storage.local.set({pd_downloadStatus: [index, downloads.length]});
        chrome.storage.local.set({pd_status: 'downloading'});
        chrome.storage.local.set({pd_statusMessage: 'Downloading'});

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
        chrome.downloads.download({
            url: download.url,
            filename: download.path
        }, id => {
            currentId = id;
        });
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
    
