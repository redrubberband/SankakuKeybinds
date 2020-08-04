// ==UserScript==
// @name         Sankaku Downloader (Manual)
// @namespace    http://tampermonkey.net/
// @version      1.2d-exhentai-QOL
// @description  Added favorite + download keybind for sankaku
// @author       redrubberband
// @match        *.bing.com/*
// @match        *.pixiv.net/en/artworks/*
// @match        *.redd.it/*
// @match        *.sankakucomplex.com/*
// @match        exhentai.org/*
// @match        h-flash.com/*
// @match        i.pximg.net/*
// @match        redgifs.com/*
// @match        6gamesonline.com/*
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_setClipboard
// ==/UserScript==

'use strict'

// !! Default values for reference, do not change. !!
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
    H_FLASH             : "h-flash.com",
    PIXIV               : "www.pixiv.net",
    PXIMG               : "i.pximg.net",
    IREDDIT             : "i.redd.it",
    EXTPREVREDDIT       : "external-preview.redd.it",
    EXHENTAI            : "exhentai.org"
}

const selectors = {
    BING                : "img.nofocus",
    CHAN                : "#image",
    REDGIFS             : ".video.media",
    _6GAMES             : "param",
    _6GAMES_ATTRIBUTE   : "value",
    H_FLASH             : "embed",
    EXHENTAI            : "#img",
    default             : "img"
}

const folderNames = {
    BING                : "bing",
    CHAN                : "Sankaku Channel",
    CHAN_IDOL           : "Idol Complex",
    REDGIFS             : "redgifs",
    SANKAKU_WEBSITE     : "Sankaku Website",
    PIXIV               : "Pixiv",
    REDDIT              : "Reddit",
    EXHENTAI            : "exhentai",
    default             : window.location.hostname
}

var isChan = (currentLocation == addresses.CHAN) || (currentLocation == addresses.CHAN_IDOL)
var isBing = (currentLocation == addresses.BING)
var isExhentai = (currentLocation == addresses.EXHENTAI && document.location.href.indexOf("/g/") > -1)
var isExhentaiImage = (currentLocation == addresses.EXHENTAI && document.location.href.indexOf("/s/") > -1)

// Change this value to true if you want to customize them
var using_custom_values        = false

if (using_custom_values) {
    downloadKey                 = "x"
    favoriteKey                 = "v"
    timeoutLength               = 500
    usingCustomFolder           = false
    customFolderName            = ""
    allowRepeatDownloads        = true
}

// Init some other default values
var folderName = folderNames.default
var imageSource = document.querySelector(selectors.default).currentSrc
var singleExecution = !allowRepeatDownloads
var alreadyExecutedOnce = false

console.log("Script is loaded")

// Two functions: scrolls the page so that it's more usable,
// and marks the chan site as a single-execution type.
if (isChan){
    document.querySelector(selectors.CHAN).scrollIntoView()
}
if (isExhentaiImage) {
    console.log("Is exhentai image!")
    document.querySelector(selectors.EXHENTAI).onload = function() {
        document.querySelector(selectors.EXHENTAI).scrollIntoView()
        document.querySelector(selectors.EXHENTAI).style.width = 'auto'
        document.querySelector(selectors.EXHENTAI).style.maxHeight = '650px'
    }
}

// Detect keyboard keypress
document.onkeydown = function (e) {
    // I just copied this part from stackoverflow
    // and I don't wanna break it, because it worked.
    e = e || window.event;

    // Feature activation via switch-case
    switch(e.key){
        case "ArrowLeft":{
            if (isExhentai) {
                let originalUrl = document.location.href.split("?")
                window.location = (originalUrl[0].concat("?p=").concat(parseInt(originalUrl[1].replace(/[^0-9]/g,''))-1))
            }
            break
        }

        case "ArrowRight":{
            if (isExhentai) {
                let originalUrl = document.location.href.split("?")
                try{
                    window.location = (originalUrl[0].concat("?p=").concat(parseInt(originalUrl[1].replace(/[^0-9]/g,''))+1))
                } catch (err){
                    window.location = (originalUrl[0].concat("?p=1"))
                }
            }
            break
        }

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
                    favicon = document.querySelector(".favoriteIcon.clicked")
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
                        imageSource = document.querySelector(selectors.CHAN).currentSrc
                        folderName = folderNames.CHAN_IDOL
                        console.log("Current site is Idol")
                        break
                    case addresses.REDGIFS:
                        imageSource = document.querySelector(selectors.REDGIFS).currentSrc
                        folderName = folderNames.REDGIFS
                        console.log("Current site is redgifs")
                        break
                    case addresses.SANKAKU_WEBSITE:
                        folderName = folderNames.SANKAKU_WEBSITE
                        console.log("Current site is Sankaku")
                        break
                    case addresses._6GAMES:
                        imageSource = document.querySelector(selectors._6GAMES).getAttribute(selectors._6GAMES_ATTRIBUTE)
                        break
                    case addresses.H_FLASH:
                        imageSource = document.querySelector(selectors.H_FLASH).src
                        break
                    case addresses.PIXIV:
                        imageSource = document.querySelectorAll(selectors.default)[2].src
                        folderName = folderNames.PIXIV
                        // Don't remove the line below, might be used again if pixiv changed the site layout
                        console.log(document.querySelectorAll(selectors.default))
                        break
                    case addresses.PXIMG:
                        folderName = folderNames.PIXIV
                        break
                    case addresses.IREDDIT:
                        folderName = folderNames.REDDIT
                        break
                    case addresses.EXTPREVREDDIT:
                        folderName = folderNames.REDDIT
                        break
                    case addresses.EXHENTAI:
                        imageSource = document.querySelector(selectors.EXHENTAI).currentSrc
                        folderName = folderNames.EXHENTAI
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
}

function grab_content(imageSource){
    console.log("Content grabber activated.")

    // Cleans the link and get the filename
    let fileName = imageSource.replace(/^.*[\\\/]/, '');

    if (isExhentaiImage) {
        console.log(fileName)
        //fileName = document.querySelector("h1").innerHTML.split('\|').join('／').split('\/').join('／').replace(/^.*[\\\/]/, '').concat(" "+fileName)
        fileName = document.querySelector("h1").innerHTML.replace('\|', '[').replace('\|', ']').replace('\/', '／').replace(/^.*[\\\/]/, '').concat(" "+fileName)
        console.log(fileName)
        //console.log(typeof(fileName))
    }

    if (fileName.indexOf('?') != -1){
        fileName = fileName.substring(0, fileName.indexOf('?'));
    }

    if (usingCustomFolder){
        folderName = customFolderName
    }

    if (isBing){
        let extension = fileName.split('.').pop()
        // Check for files without extension
        // 5 is chosen as the value because usually media extensions is no longer than 5 characters
        // please do correct me if I'm wrong
        if (extension.length > 5){
            console.log("Missing extension! Adding...")
            // Replace weird characters (for now, just dot, more might get added later)
            fileName = fileName.replace(".", "")
            // I just assumed it will be a jpg. Fix it manually later on if it's wrong
            extension = ".jpg"
            fileName = fileName.concat(extension)
        }
    }

    //let finalFileName = "SKDownloader/" + folderName + "/" + fileName
    let finalFileName = folderName + "/" + fileName

    let downloadArgs = {
        url: imageSource,
        name: finalFileName,
        //onload: notify(fileName)
    }

    console.log("Attempting download...")
    GM_download(downloadArgs)

    // Copies the image link to clipboard for in case something went wrong
    GM_setClipboard(imageSource)
}

function notify(fileName){
    return GM_notification({
        text:"Download finished " + fileName,
        timeout:timeoutLength
    })
}