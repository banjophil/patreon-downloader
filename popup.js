
$(function(){


  $('#startdownload').click(function(){
    let folder = $('#foldername').val();
    chrome.tabs.query({ active: true }, tabs => {
      tabs.forEach(tab =>
          chrome.tabs.sendMessage(tab.id, { folder: folder } )
      );
    });
  })

  $('#cancel').click(function() {
    chrome.runtime.sendMessage({cancel: true});
    chrome.tabs.query({active: true}, tabs => {
      tabs.forEach(tab =>
          chrome.tabs.sendMessage(tab.id, {cancel: true})
      );
    });
  })

  var $message = $('.message .progress .text');

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes['pd_status'] ){
      $('.progress').removeClass(changes.pd_status.oldValue)
      $('.progress').addClass(changes.pd_status.newValue);
    }
    if (changes['pd_statusMessage'] ) {
      getStatusMessage();
    }
    if (changes['pd_downloadStatus'] ) {
      getDownloadStatus();
    }
    if (changes['pd_showLog'] ) {
      getLogVisibilty();
    }
    if (changes['pd_log']){
      getLog();
    }

  });


  chrome.storage.local.get(['pd_status'], function(result) {
    $('.progress').addClass(result.pd_status);
  });


  function getLog(){
    chrome.storage.local.get(['pd_log'], function(result) {
      $('.log').html(result.pd_log)
    });
  }
  getLog();


  function getStatusMessage(){
    chrome.storage.local.get(['pd_statusMessage'], function(result) {
      $('.progress .message .text').html( result.pd_statusMessage );
    });
  }
  getStatusMessage();

  function getLogVisibilty(){
    chrome.storage.local.get(['pd_showLog'], function(result) {
      if ( result.pd_showLog == true ){
        $('.switch input[name=log]').attr('checked', 'checked');
        chrome.storage.local.set({pd_showLog: true});
        $('.log-container').show();
      } else  {
        $('.log-container').hide();
      }

    });
  }
  getLogVisibilty()

  function getTextVisibilty(){
    chrome.storage.local.get(['pd_saveText'], function(result) {
      if ( result.pd_saveText == true ){
        $('.switch input[name=text]').attr('checked', 'checked');
        chrome.storage.local.set({pd_saveText: true});
      }

    });
  }
  getTextVisibilty()

  function getAskBeforeOption(){
    chrome.storage.local.get(['pd_askBefore'], function(result) {
      if ( result.pd_askBefore != false ){
        $('.switch input[name=askbefore]').attr('checked', 'checked');
        chrome.storage.local.set({pd_askBefore: true});
      }

    });
  }
  getAskBeforeOption()

  $('.switch input[name=log]').change(function(){
    if ( $(this)[0].checked === true ) {
      chrome.storage.local.set({pd_showLog: true});
      $('.log-container').show();
    } else {
      chrome.storage.local.set({pd_showLog: false});
      $('.log-container').hide();
    }
  })

  $('.switch input[name=text]').change(function(){
    if ( $(this)[0].checked === true ) {
      chrome.storage.local.set({pd_saveText: true});
    } else {
      chrome.storage.local.set({pd_saveText: false});
    }
  })

  $('.switch input[name=askbefore]').change(function(){
    if ( $(this)[0].checked === true ) {
      chrome.storage.local.set({pd_askBefore: true});
    } else {
      chrome.storage.local.set({pd_askBefore: false});
    }
  })

  function getDownloadStatus(){
    chrome.storage.local.get(['pd_downloadStatus'], function(result) {
      if (result.pd_downloadStatus && result.pd_downloadStatus.length > 1){
        $('.progress-bar .text').html( result.pd_downloadStatus[0] + '/' + result.pd_downloadStatus[1] );
        $('.progress-bar .progress-inner').width( result.pd_downloadStatus[0] / result.pd_downloadStatus[1] * 100 + '%' );
      }
    });
  }
  getDownloadStatus()


})