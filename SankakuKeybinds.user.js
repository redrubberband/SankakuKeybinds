// ==UserScript==
// @name         Sankaku Downloader (Manual)
// @namespace    http://tampermonkey.net/
// @version      0.69-tryingtofixmessycode
// @description  Added favorite + download keybind for sankaku
// @author       redrubberband
// @include      *
// @exclude      *.google.*/*
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';
    console.log("Script is loaded")
    
    // Two functions: scrolls the page so that it's more usable,
    // and marks the chan site as a single-execution type.
    if (isChan){
        document.querySelector(".favoriteIcon").scrollIntoView()
        singleExecution = true
    } 

    // Detect keyboard keypress
    document.onkeypress = function (e) {
        // I just copied this part from stackoverflow
        // and I don't wanna break it, because it worked.
        e = e || window.event; 

        // Feature activation via switch-case
        switch(e.key){
            case favoriteKey:{
                console.log("Key " + favoriteKey + " is pressed")
                if (isChan){
                    let favicon     = document.querySelector(".favoriteIcon")
                    let addToFavs   = document.querySelector("#add-to-favs")
                    //check if fav-icon is hidden
                    var currStyle   = window.getComputedStyle(addToFavs)
                    //check if fav-icon is already favorited
                    if (currStyle.getPropertyValue("display") == "none"){
                        console.log("Changing favorite value...")
                        favicon = document.querySelectorAll(".favoriteIcon.clicked")[0]
                        //console.log(favicon)
                    }
                    favicon.click()
                    //revert back to default state for repeatability
                    favicon = document.querySelector(".favoriteIcon")
                    break
                } else {
                    console.log("Website is not Chan / Idol!")
                    break
                }
            }

            case downloadKey:{
                console.log("Key " + downloadKey + " is pressed")
                if (!alreadyExecutedOnce){
                    switch(currentLocation){
                        case addresses.BING:
                            imageSource = document.querySelector(selectors.BING).currentSrc
                            folderName = folderNames.BING
                            console.log("Current site is bing")
                            break
                        case addresses.CHAN:
                            imageSource = document.querySelector(selectors.CHAN).currentSrc
                            folderName = folderNames.CHAN
                            console.log("Current site is Chan")
                            break
                        case addresses.CHAN_IDOL:
                            imageSource = document.querySelector(selectors.CHAN_IDOL).currentSrc
                            folderName = folderNames.CHAN_IDOL
                            console.log("Current site is Idol")
                            break
                        case addresses.REDGIFS:
                            imageSource = document.querySelector(selectors.REDGIFS).currentSrc
                            folderName = folderNames.REDGIFS
                            console.log("Current site is redgifs")
                            break
                        case addresses.SANKAKU_WEBSITE:
                            imageSource = document.querySelector(selectors.SANKAKU_WEBSITE).currentSrc
                            folderName = folderNames.SANKAKU_WEBSITE
                            console.log("Current site is Sankaku")
                            break
                        case addresses._6GAMES:
                            imageSource = document.querySelector(selectors._6GAMES).getAttribute(selectors._6GAMES_ATTRIBUTE)
                            break
                        case addresses.H_FLASH:
                            imageSource = document.querySelector(selectors.H_FLASH).src
                            break
                    }
                    // Calls the download function
                    grab_content(imageSource, folderName)
                    // Prevents duplicate download
                    if (singleExecution) alreadyExecutedOnce = true
                } else {
                    console.log("Repeat download is disabled! You have already downloaded this image once")
                }
                break;
            }
        }
    };
})();

// Default values for reference, do not change. 
// You can customize them later below.
var downloadKey = "x"
var favoriteKey = "v"
var timeoutLength = 5000
var usingCustomFolder = false
var customFolderName = ""
var allowRepeatDownloads = false

// Another init, but unrelated.
// Still, do not change the values here.
var currentLink         = window.location.href
var currentLocation     = location.host

const addresses = {
    BING                : "www.bing.com",
    CHAN                : "chan.sankakucomplex.com",
    CHAN_IDOL           : "idol.sankakucomplex.com",
    REDGIFS             : "redgifs.com",
    SANKAKU_WEBSITE     : "www.sankakucomplex.com",
    _6GAMES             : "6gamesonline.com",
    H_FLASH             : "h-flash.com"
}

const selectors = {
    BING                : "img.nofocus",
    CHAN                : "#image",
    CHAN_IDOL           : "#image",
    REDGIFS             : ".video.media",
    SANKAKU_WEBSITE     : "img",
    _6GAMES             : "param",
    _6GAMES_ATTRIBUTE   : "value",
    H_FLASH             : "embed"
}

const folderNames = {
    BING                : "bing",
    CHAN                : "Sankaku Channel",
    CHAN_IDOL           : "Idol Complex",
    REDGIFS             : "redgifs",
    SANKAKU_WEBSITE     : "Sankaku Website",
    default             : window.location.hostname
}

var isChan = (currentLocation == addresses.CHAN) || (currentLocation == addresses.CHAN_IDOL)
var isBing = (currentLocation == addresses.BING)

// Change this value to false if you want to customize them
var using_default_values        = true
if (!using_default_values) {
    downloadKey                 = "x"
    favoriteKey                 = "v"
    timeoutLength               = 5000
    usingCustomFolder           = false
    customFolderName            = ""
    allowRepeatDownloads        = false
}

// Init some other default values
var imageSource
var folderName = folderNames.default
var singleExecution = false
var alreadyExecutedOnce = false

function grab_content(imageSource){
        console.log("Content grabber activated.")

        // Cleans the link and get the filename
        let fileName = imageSource.replace(/^.*[\\\/]/, '');
        if (fileName.indexOf('?') != -1){
            fileName = fileName.substring(0, fileName.indexOf('?'));
        }

        if (usingCustomFolder){
            folderName = customFolderName
        }

        if (isBing){
            let extension = fileName.split('.').pop()
            if (extension.length > 5){                                  //this one checks for files without extensions, usually media extensions is no longer than 5 characters
                console.log("Missing extension! Adding...")
                fileName = fileName.replace(".", "")                    //replaces weird characters (need to be added later)
                extension = ".jpg"                                      //I just assumed it will be a jpg. Fix it manually later on if it's wrong
                fileName = fileName.concat(extension)
            }
        }

        let finalFileName = "SKDownloader/" + folderName + "/" + fileName

        let downloadArgs = {
            url: imageSource,
            name: finalFileName,
            onload: function(){
                GM_notification({
                    text:"Download finished " + fileName,
                    timeout:timeoutLength
                })
            }
        }

        console.log("Attempting download...")
        GM_download(downloadArgs)

        // Copies the image link to clipboard for in case something went wrong
        GM_setClipboard(imageSource)
    }