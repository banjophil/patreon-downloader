
$(function(){
    //Event Listeners
    chrome.runtime.onMessage.addListener(request => {
        if (request.cancel){
            cancel = true
            sendLog('cancelling');
            sendReport('', 'Cancelling');
        }

        if (request.folder) {
            if ( document.readyState != 'complete' ){
                alert('Please wait for the page to fully load or cancel loading');
                return false;
            }

            if (isBusy){
                sendLog('Currently Scraping - Please wait')
                return false;
            }

            folder = request.folder;
            getSettings();

        }

        if (request.finished) {
            alert(request.finished)
            isBusy = false;
            cleanup();
        }

    });

    // Reporting Functions

    function sendLog(message = '') {

        if (message.length > 1){
            Thelog += message;
            Thelog += '<br/>';
        }

        chrome.storage.local.set({pd_log: Thelog});
    }

    function sendReport(status = '', message = ''){
        chrome.storage.local.set({pd_status: status});
        chrome.storage.local.set({pd_statusMessage: message});
    }

    function updateProgress(current = 0, total = 0){
        chrome.storage.local.set({pd_downloadStatus: [current, total]});
    }

    // Utlity Functions

    function padd(num){
        if ( num < 10 ){
            return '0' + num
        } else {
            return num
        }
    }

    function removeSpecialCharacters(string){
        return string.replace(/[^\w\s]/gi, '')
    }

    function cleanup(){
        isBusy = false;
        cancel = false;
        sendReport('ready', 'Ready');
        updateProgress(0,0);
    };

    // Setup

    var cancel = false;
    let posts = [];
    let currentPost = -1;
    let postObjects;
    let folder = '';
    let Thelog = '';
    let isBusy = false;
    let saveText = false;
    let startdownload = false;

    sendReport('ready', 'Ready');
    chrome.storage.local.remove('pd_log');
    updateProgress(0,0);

    function getSettings(){
        chrome.storage.local.get(null, function (result) {
            if ( result.pd_saveText ) {
                saveText = true;
            }

            startdownload = !result.pd_askBefore;

            findPosts();
        })
    }

    function findPosts() {
        Thelog = '';
        isBusy = true;
        cancel = false;
        currentPost = -1;
        posts = [];
        postObjects = $('[data-tag=post-card]');
        chrome.storage.local.remove('pd_log');

        sendLog('Scraping page - please wait');
        sendReport('scraping', 'Scraping page');

        if (postObjects.length > 0){
            console.log(postObjects);
            scrapeData();
        } else {
            alert('Sorry, no posts found!')
            return false;
        }
    }

    // Recursive function End case at start
    function scrapeData(){
        if ( !cancel && currentPost == postObjects.length - 1){

            console.log(posts);

            let downloads = [];

            function prepareDownloadObject(url, subfolder, prefix, filename = null) {
                if (filename == null) {
                    filename = url.substring(url.lastIndexOf('/') + 1);
                    filename = filename.substring(0, filename.lastIndexOf('?'));
                }
                var subfolder = removeSpecialCharacters(subfolder);
                return {
                    url: url,
                    path: 'Patreon_Downloader/' + folder + '/' + subfolder + '/' + padd(prefix) + '_' + filename
                }

            }

            posts.forEach(post => {

                let counter = 0;

                if (post.slideshowimages) {
                    post.slideshowimages.forEach(url => {
                        downloads.push(prepareDownloadObject(url, post.name, counter));
                        counter++
                    })
                }

                if (post.postimages) {
                    post.postimages.forEach(url => {
                        downloads.push(prepareDownloadObject(url, post.name, counter));
                        counter++
                    })
                }

                if (post.text && saveText) {

                    var blob = new Blob([post.text], {
                        type: 'text/plain'
                    });

                    var url = URL.createObjectURL(blob);

                    downloads.push(prepareDownloadObject(url, post.name, 0, 'posttext.txt'));
                }

            });

            sendLog('Finished scraping. Sending ' + downloads.length + ' images to downloader');
            sendReport('scraping', 'Sending to downloader');

            if (!startdownload){
                startdownload = confirm('Sending ' + downloads.length + ' images to downloader. Have you turned off "Ask where to save each file before downloading" in Chrome settings?');
            }

            if (startdownload) {
                chrome.runtime.sendMessage({downloadSequentially: downloads})
            } else {
                sendLog('User cancelled download');
                cleanup();
            }

            console.log(downloads);

        } else if (!cancel) {
            currentPost ++;
            setupPost(postObjects[currentPost]);
        } else {
            cleanup()
        }
    }


    function setupPost(postObject){
        let images = [];
        let post = {};
        let loadedSrc = [];
        let text = '';
        $('html').animate({scrollTop: $(postObject).offset().top }, 1000, 'swing', function(){

            setTimeout(() => {
                $(postObject).find('img').each(function(index, item){

                    if (!loadedSrc.includes(item.src)){
                        images.push(item)
                        loadedSrc.push(item.src)
                    }
                });

                let title = $(postObject).find('[data-tag=post-title] a').html();
                if (!title){
                    title = $(postObject).find('[data-tag=post-title]').html();
                }
                title = title.replace(/\s+/g, '_').toLowerCase();
                let prefix = ( posts.length + 1 ) < 10 ? "0" + ( posts.length + 1 ) : ( posts.length + 1 );
                title = prefix + '_' + title;

                post.name = title;
                post.images = images;
                post.slideshowimages = [];
                post.postimages = [];
                post.lockedIcon = $(postObject).find('div[data-tag=locked-post-icon]');

                var textfile = ''
                function textFileBuilder(text = '', newline){
                    textfile += text + '\n'
                }

                textFileBuilder('Post Date: ' + $(postObject).find('a[data-tag=post-published-at]').text() )
                textFileBuilder('Title: ' + $(postObject).find('*[data-tag=post-title]').text() + '\n');

                let collapsedContent = $(postObject).find('div[data-tag=post-content-collapse] p')
                let normalContent = $(postObject).find('div[data-tag=post-content] p');

                textFileBuilder( 'Content:');
                textFileBuilder( );

                collapsedContent.each(function () {
                    textFileBuilder( $(this).text());
                })

                normalContent.each(function () {
                    textFileBuilder( $(this).text());
                })

                textFileBuilder();
                textFileBuilder( 'Comments:');
                textFileBuilder();

                let comments = $(postObject).find('div[data-tag=comment-row]');
                comments.each(function () {
                    textFileBuilder( $(this).find('a[data-tag=commenter-name]').text());
                    textFileBuilder( $(this).find('div[data-tag=comment-body]').text());
                    textFileBuilder();

                })

                post.text = textfile;

                sendLog("Post found: " + post.name);


                if (post.lockedIcon.length > 0){
                    sendLog('Post is locked. Moving on')
                }
                else if (images.length > 0){
                    posts.push(post);
                    findSlideshows(post);

                } else {
                    posts.push(post);
                    scrapeData();
                }

            }, 1000);

        });

    }

    function findSlideshows(post){
        const targetNode = document.getElementsByTagName('body');
        const config = { attributes: false, childList: true, subtree: false };
        let foundLightbox = false;

        const callback = function(mutationsList, observer) {

            for(let mutation of mutationsList) {

                if (foundLightbox){
                    return false;
                }

                if (mutation.type === 'childList') {
                    const lightbox = $('[data-target=lightbox-content]');
                    if (lightbox.length > 0){
                        foundLightbox = true;
                        observer.disconnect();
                        var img = lightbox.find('img');
                        observeSlideshow(img[0], post);
                    }
                }

            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode[0], config);

        if (post.images.length > 0 ){
            post.images[0].click();
        }

        //Wait to see if slideshow appears
        setTimeout(() => {
            if (!foundLightbox){
                observer.disconnect();
                findPostImages(post);
            }
        }, 2000);

    }

    function observeSlideshow(element, post){

        let images = [];
        const config = { attributes: true, childList: false, subtree: false };
        let total;

        const callback = function(){
            if (!images.includes(element.src)){
                images.push(element.src)
            }
        }

        const loaded = function(){
            total = $('[data-target=lightbox-content]').find('p').html();
            if (total){
                total = total.split('/');
                total = parseInt( total[1]);
            }
            if ( total && images.length == total ){
                finishSlideshow();
            } else {
                //Check if next button found. Single image slide shows do not have next button
                let nextButton = $('[data-target=lightbox-content]').parent().find('button')[1];
                if (nextButton && !cancel){
                    setTimeout( function(){ $('[data-target=lightbox-content]').parent().find('button')[1].click() }, 1000 )
                } else {
                    finishSlideshow();
                }

            }

        }

        function finishSlideshow(){
            observer.disconnect();
            post.slideshowimages = images;
            let buttons = $('[data-target=lightbox-content]').parent().find('button');
            if (buttons.length > 1 ){
                buttons[2].click();
            } else {
                buttons[0].click();
            }

            if (!cancel){
                setTimeout( findPostImages(post), 1000 )
            } else {
                cleanup();
            }

        }

        element.addEventListener('load', function(){
            loaded();
        })

        const observer = new MutationObserver(callback);
        observer.observe(element, config);

    }

    function findPostImages(post){
        var postimages = [];

        post.images.forEach((img, iindex) => {
            if (img){
                var filename = img.src.substring(img.src.lastIndexOf('/')+1);
                filename = filename.substring(0 , filename.lastIndexOf('?'));

                if (filename && filename.length > 4 ){ //checks we've found a real file
                    if (img.naturalWidth == 0) { //add images that were not loaded
                        postimages.push(img.src)
                    } else if( img.naturalWidth > 400 ) {
                        postimages.push(img.src)
                    }
                }
            }
        })

        post.postimages = postimages;
        sendLog(post.name + ' : ' + ( post.postimages.length + post.slideshowimages.length ) + ' images found' );
        chrome.storage.local.get(['pd_downloadStatus'], function(result) {
            updateProgress(0,post.postimages.length + post.slideshowimages.length + result.pd_downloadStatus[1]);
        })

        scrapeData();
    }


})
