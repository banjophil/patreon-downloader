<template>

  <v-layout>
    <v-app-bar color="red-lighten-2" density="compact">
      <template v-slot:prepend>
        <v-btn icon="mdi-console" @click.stop="consoleOpen = !consoleOpen"></v-btn>
      </template>
      <v-app-bar-title>Patreon Downloader</v-app-bar-title>

      <template v-slot:append>
        <v-btn icon="mdi-information" @click.stop="drawer = !drawer"></v-btn>
      </template>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" location="right" temporary>
      <v-container>
        This extension will attempt to download all images and files from all visble posts on the current page. <br>
        It is recommended that you filter posts by month for a single creator. <br><br>
        The plugin will scrape the page by impersonating a user. <br>
        It is highly recommended that you turn off the "Ask to save each file before downloading" option in chrome before scraping. Otherwise many popup windows will be opened.
        <v-btn href="https://chrome.google.com/webstore/detail/patreon-downloader/fmhpbbdpdhjkpbklloabkncldkmggaik" target="_blank" variant="tonal" class="mt-2">Suport</v-btn>
        <v-btn href="https://www.buymeacoffee.com/patreondloader" target="_blank" variant="tonal" class="mt-2">Buy me a coffee</v-btn>
      </v-container>
    </v-navigation-drawer>
    <v-navigation-drawer v-model="consoleOpen" location="left" temporary width="100%">
      <v-container>
        <h6>Log</h6>
        <div class="log" v-html="log"></div>
      </v-container>
    </v-navigation-drawer>

    <v-main style="" v-if="location">
      <v-container>
        <v-row>
          <v-col cols="3">
            <h6>Mode: </h6>
            <h5 class="text-uppercase">{{mode}}</h5>
          </v-col>
          <v-col cols="9">
            <div> <h6>Save Location:</h6>
              Patreon_Downloader/{{saveLocation}}</div>

          </v-col>
        </v-row>
        <v-divider class="my-2"></v-divider>

        <div class="d-flex justify-space-between">
          <v-switch color="red-lighten-2" density="compact" v-model="pd_scrapeSlideshows" label="Scrape slideshows"></v-switch>
          <div style="position: relative; top: 5px;">
            <v-icon icon="mdi-information" color="red-lighten-2"></v-icon>
            <v-tooltip
              activator="parent"
              location="end"
              text = "Use this option to save images that are saved as either the post header image, or as embedded slideshows. Makes scraping significantly slower as we have to model a user clicking through slideshows"
            >
            </v-tooltip>
          </div>
        </div>
        <div class="d-flex justify-space-between">
          <v-switch color="red-lighten-2" density="compact" v-model="pd_saveText" label="Save post text and comments"></v-switch>
          <div style="position: relative; top: 5px;">
            <v-icon icon="mdi-information" color="red-lighten-2"></v-icon>
            <v-tooltip
              activator="parent"
              location="end"
              text = "Use this option to save all the text from a post as a text file"
            >
            </v-tooltip>
          </div>
        </div>

        <v-btn color="red-lighten-2" @click="scrapePage()"> {{actionButtonText}}</v-btn>

        <v-divider class="mt-3 mb-2"></v-divider>
        <h6 class="text-uppercase mb-2">Downloader STATUS</h6>
        <v-progress-linear
          v-model="power"
          color="red-lighten-2"
          height="25"
        >
          <strong v-html="downloadStatusMessage"> </strong>
        </v-progress-linear>
        <v-divider></v-divider>

      </v-container>
      <v-footer class="d-flex justify-space-between bg-red-lighten-3">
        <div class="text-caption">v.0.1.0</div>
        <div class="links"><v-btn density="compact" icon="mdi-github"></v-btn></div>
        <div class="right"><v-btn href="https://www.buymeacoffee.com/patreondloader" target="_blank" density="compact">BUY ME A COFFEE</v-btn></div>
      </v-footer>
    </v-main>
    <v-main v-if="!location">
      <v-card variant="tonal" style="margin: 10px; padding: 10px">
        Please load this extension on a Patreon page or refresh your browser.
      </v-card>
    </v-main>

  </v-layout>

</template>

<script>
export default {
  data: () => ({
    drawer: false,
    consoleOpen: false,
    pd_saveText: true,
    pd_scrapeSlideshows: true,
    pd_showLog: true,
    location: false,
    status: 'ready',
    log: '',
    pd_downloadStatus: [0,0],
    creatorName: 'creator'
  }),
  watch: {
    pd_saveText(newvalue, oldvalue){
      chrome.storage.local.set({pd_saveText: newvalue});
    },
    pd_scrapeSlideshows(newvalue, oldvalue){
      chrome.storage.local.set({pd_scrapeSlideshows: newvalue});
    },
    pd_showLog(newvalue, oldvalue){
      chrome.storage.local.set({pd_showLog: newvalue});
    }
  },
  methods: {
    async sendMessage(message) {
      console.log('sending message');
      const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
      console.log(tab);
      const response = await chrome.tabs.sendMessage(tab.id, message);
      console.log(response);
      return(response)
    },
    getOption(name){
      console.log('getting: ' + name)
      chrome.storage.local.get([name], (result) => {
        this[name] = result[name];
      });
    },
    scrapePage(){
      this.sendMessage({
        action : 'scrapepage',
        creator: this.creatorName,
        mode: this.mode,
        testkey: 'really dickhead',
        savetext: this.pd_saveText,
        scrapeslideshows: this.pd_scrapeSlideshows
      })

    }
  },
  computed: {
    actionButtonText(){
      if (this.status === 'ready'){
        return 'SCRAPE PAGE'
      }
    },
    mode(){
      if (this.location.indexOf('/home') > 0){
        return 'feed'
      }
      else if ( this.location.indexOf('/posts/') > 0 ) {
        return 'single post'
      }else if ( this.location.indexOf('/posts') > 0 ){
        return 'creator'
      } else return 'unknown'

    },
    saveLocation(){
      if ( this.mode === 'feed' ){
        return '{yyyy_mm_dd}_{post title}';
      } else if (this.mode === 'creator'){
        return this.creatorName + '/{yyyy_mm_dd}_{post title}';
      } else if (this.mode === 'single post'){
        return '{yyyy_mm_dd}_{post title}';
      }
    },
    downloadStatusMessage(){
      return this.pd_downloadStatus[0] + '/' + this.pd_downloadStatus[1]
    }
  },
  mounted() {
    var v = this;
    //get location
    this.sendMessage({getLocation: true}).then( ret => {
        console.log('get location returned: ' + ret);
        this.location = ret;
      }
    );

    if (window.location.href.indexOf('localhost') > 0){
      this.location = true
    }

    this.sendMessage({getSubfolder: true}).then( ret => {
      console.log('Creator Name: ' + ret.response)
      this.creatorName = ret.response;
    } );

    // options to load
    var options = ['pd_saveText', 'pd_scrapeSlideshows']
    options.forEach(function (value, index, array) {
      v.getOption(value);
    })

    chrome.storage.onChanged.addListener(function(changes, namespace) {
      // if (changes['pd_status'] ){
      //   $('.progress').removeClass(changes.pd_status.oldValue)
      //   $('.progress').addClass(changes.pd_status.newValue);
      // }
      // if (changes['pd_statusMessage'] ) {
      //   getStatusMessage();
      // }
      if (changes['pd_downloadStatus'] ) {
        chrome.storage.local.get(['pd_downloadStatus'], (result) => v.pd_downloadStatus = result.pd_downloadStatus);
      }
      // if (changes['pd_showLog'] ) {
      //   getLogVisibilty();
      // }
      if (changes['pd_log']){
        // chrome.storage.local.get(['pd_log'], (result) => this.log = result.pd_log);
        chrome.storage.local.get(['pd_log'], (result) => v.log = result.pd_log);
      }
    });

  }
}
</script>

<style>
.log {
  padding: 5px;
  background: #000;
  margin-top: 5px;
  overflow: auto;
  color: white;
  word-wrap: break-word;
  min-width: 330px;
  min-height: 310px;
}
</style>
