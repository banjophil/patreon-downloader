# patreon-downloader 

This extension will scrape a Patreon feed and download all posted images, slideshows and files. Useful for archiving.

No longer in active development. Old versions can be installed by loading an unpacked extension in Chrome. 
https://developer.chrome.com/docs/extensions/mv2/getstarted/


CHROME STORE TEXT
Due to the reactive nature of the Patreon front end, the only way to download slideshow images is to simulate a user interacting with the site. Please don't complain that you don't want to sit through slideshows, it's the only way I can get all the urls. . The reason images are downloaded at the end of the process is that network errors or timeouts will break the scraping, so trying to download a large file while scraping is a bad idea. 

I highly suggest filtering the feed by month or selecting single posts for feeds with a lot of images or files. You will need a fairly fast connection as network errors will stop the scraping.

The extension will take control of the website and attempt to find all images and files. It then sends the urls to be downloaded sequentially. 

To use simply load the page you want to archive, you can stop the page loading once the dom has loaded if you don't want to wait for all the images to download. Then press download. Images will be downloaded to downloads/Patreon_Downloader/ in the given folder and in subfolders named after the post titles.

WARNING: If you haven't set up a default download directory, you will have to manually choose the save location for each image, which might open a lot of popup windows. It is not recommended to attempt to download too many images at once without a default download directory.

If you have a network error while scraping a slideshow, you can right click on the image missing icon and select "load image". The scraper will continue.

CHANGELOG:
0.1.4 
Better text searching, remove buy me a coffee link
0.1.3
Returned ability to set folder name, folder defaults. 
0.1.0
Major redesign
Attempts to save with folders as creator name and date of the post
0.0.8
Scraping slideshows optional
Files are not overriden when downloading
0.0.6
File links downloaded as well as images
Main subfolder named after the creator
Post subfolder named after the post date and not the sequence
0.0.5
Add option to save all text from post
Add option to not confirm before downloading
Stop scraper attempting to open locked posts
0.0.4
Removed special characters from subfolder name

## Project setup

```
# yarn
yarn

# npm
npm install

# pnpm
pnpm install
```

### Compiles and hot-reloads for development

```
# yarn
yarn dev

# npm
npm run dev

# pnpm
pnpm dev
```

### Compiles and minifies for production

```
# yarn
yarn build

# npm
npm run build

# pnpm
pnpm build
```

### Customize configuration

See [Configuration Reference](https://vitejs.dev/config/).

