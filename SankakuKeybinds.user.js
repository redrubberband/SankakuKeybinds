// ==UserScript==
// @name         Sankaku Downloader (Manual)
// @namespace    http://tampermonkey.net/
// @version      1.6a-nhentai_resize
// @description  Added favorite + download keybind for sankaku
// @author       redrubberband
// @match        *.bing.com/*
// @match        *.nhentai.net/*
// @match        *.pixiv.net/en/artworks/*
// @match        *.pornhub.com/*
// @match        *.redd.it/*
// @match        *.sankakucomplex.com/*
// @match        *.tsumino.com/*
// @match        *.media.tumblr.com/*
// @match        exhentai.org/*
// @match        e-hentai.org/*
// @match        h-flash.com/*
// @match        i.pximg.net/*
// @match        puu.sh/*
// @match        redgifs.com/*
// @match        6gamesonline.com/*
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_setClipboard
// ==/UserScript==

'use strict'

// Change this value to true if you want to customize them
var using_custom_values        = true

if (using_custom_values) {
    var downloadKey                 = "x"
    var favoriteKey                 = "v"
    var timeoutLength               = 500
    var usingCustomFolder           = false
    var customFolderName            = ""
    var allowRepeatDownloads        = true
    var quickArchiveMode            = true
    var autoCloseTab                = false
} else { // Default values, DO NOT change!
    downloadKey = "x"
    favoriteKey = "v"
    timeoutLength = 5000
    usingCustomFolder = false
    customFolderName = ""
    allowRepeatDownloads = false
    quickArchiveMode = false
    autoCloseTab = true
}


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
    PORNHUB             : "www.pornhub.com",
    PXIMG               : "i.pximg.net",
    IREDDIT             : "i.redd.it",
    EXTPREVREDDIT       : "external-preview.redd.it",
    EXHENTAI            : "exhentai.org",
    EHENTAI             : "e-hentai.org",
    NHENTAI             : "nhentai.net",
    TSUMINO             : "www.tsumino.com",
    PUUSH               : "puu.sh",
    TUMBLR_MEDIA_64     : "64.media.tumblr.com",
    SANKAKU_BETA        : "beta.sankakucomplex.com"
}

const selectors = {
    BING                : "img.nofocus",
    CHAN                : "#image",
    _6GAMES             : "param",
    _6GAMES_ATTRIBUTE   : "value",
    H_FLASH             : "embed",
    EXHENTAI            : "#img",
    NHENTAI             : "#image-container a img",
    PORNHUB_GIF         : "#gifWebmPlayer",
    REDGIFS             : ".video.media",
    TSUMINO             : ".img-responsive.reader-img",
    SANKAKU_BETA_FAV    : "svg",
    SANKAKU_BETA_DOWN   : "button",
    default             : "img",
}

const folderNames = {
    BING                : "bing",
    CHAN                : "Sankaku Channel",
    CHAN_IDOL           : "Idol Complex",
    SANKAKU_WEBSITE     : "Sankaku Website",
    PIXIV               : "Pixiv",
    PORNHUB             : "PornHub Gifs",
    REDDIT              : "Reddit",
    REDGIFS             : "redgifs",
    EXHENTAI            : "exhentai",
    NHENTAI             : "nhentai",
    TSUMINO             : "Tsumino",
    PUUSH               : "puu.sh",
    TUMBLR              : "tumblr",
    default             : window.location.hostname
}

var isChan = (currentLocation == addresses.CHAN) || (currentLocation == addresses.CHAN_IDOL)
var isBing = (currentLocation == addresses.BING)
var isExhentai = ((currentLocation == addresses.EXHENTAI || currentLocation == addresses.EHENTAI) && document.location.href.indexOf("/g/") > -1)
var isExhentaiImage = ((currentLocation == addresses.EXHENTAI || currentLocation == addresses.EHENTAI) && document.location.href.indexOf("/s/") > -1)
var isNhentaiImage = (currentLocation == addresses.NHENTAI && document.location.href.indexOf("/g/") > -1)
var isTsuminoImage = (currentLocation == addresses.TSUMINO && document.location.href.indexOf("/Read/Index/") > -1)
var isBetaSankakuImage = (currentLocation == addresses.SANKAKU_BETA && document.location.href.indexOf("/post/show/") > -1)

// Init some other default values
var folderName = folderNames.default
var singleExecution = !allowRepeatDownloads
var alreadyExecutedOnce = false
var imageSource
var maxImageHeight = '850px'
try{
    imageSource = document.querySelector(selectors.default).currentSrc
} catch (err) {
    imageSource = ""
}

console.log("Script is loaded")

// This is my personal script customization which may or may not be suitable for general use.
if (isChan){
    document.querySelector(selectors.CHAN).scrollIntoView()
}
if (isExhentaiImage) {
    console.log("Is exhentai image!")
    window.onload = function() {
        document.querySelector(selectors.EXHENTAI).style.width = 'auto'
        document.querySelector(selectors.EXHENTAI).style.maxHeight = maxImageHeight
        document.querySelector(selectors.EXHENTAI).scrollIntoView()
        if (quickArchiveMode) {
            setSourceAndFolder()
            grab_content(imageSource, folderName)
            window.close()
        }
    }
}

if (isNhentaiImage) {
    window.onload = function() {
        document.querySelector(selectors.NHENTAI).style.width = 'auto'
        document.querySelector(selectors.NHENTAI).style.maxHeight = maxImageHeight
        document.querySelector(selectors.NHENTAI).scrollIntoView()
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
            } else if (isChan) {
                document.querySelector(".recommended-prev a").click()
            } else if (isNhentaiImage) {
                document.querySelector(selectors.NHENTAI).style.width = 'auto'
                document.querySelector(selectors.NHENTAI).style.maxHeight = maxImageHeight
                document.querySelector(selectors.NHENTAI).scrollIntoView()
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
            } else if (isChan) {
                document.querySelector(".recommended-next a").click()
            } else if (isNhentaiImage) {
                document.querySelector(selectors.NHENTAI).style.width = 'auto'
                document.querySelector(selectors.NHENTAI).style.maxHeight = maxImageHeight
                document.querySelector(selectors.NHENTAI).scrollIntoView()
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
            } else if (isBetaSankakuImage) {
                console.log("is btea sankaku img")
                let all_buttons = document.querySelectorAll(selectors.SANKAKU_BETA_FAV)
                let favorite_button
                // current status as of October 19th 2020
                switch (all_buttons.length) {
                    case 43:
                        favorite_button = all_buttons[17]
                        break
                    case 44:
                        favorite_button = all_buttons[18]
                        break
                    case 45:
                        favorite_button = all_buttons[19]
                        break
                }
                console.log(favorite_button)
                //favorite_button.dispatchEvent(new Event('click'));
                favorite_button.dispatchEvent(new MouseEvent("click"));
                break
            } else {
                console.log("Website is not Chan / Idol!")
                break
            }
        }

        case downloadKey:{
            console.log("Key " + downloadKey + " is pressed")
            if (isBetaSankakuImage){
                // current status as of October 19th 2020
                let download_button = document.querySelectorAll(selectors.SANKAKU_BETA_DOWN)[3]
                download_button.click()
                break
            }
            if (!alreadyExecutedOnce){
                setSourceAndFolder()
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

function setSourceAndFolder() {
    switch(currentLocation){
        case addresses.BING:
            imageSource = document.querySelector(selectors.BING).currentSrc
            folderName = folderNames.BING
            break
        case addresses.CHAN:
            imageSource = document.querySelector(selectors.CHAN).currentSrc
            folderName = folderNames.CHAN
            break
        case addresses.CHAN_IDOL:
            imageSource = document.querySelector(selectors.CHAN).currentSrc
            folderName = folderNames.CHAN_IDOL
            break
        case addresses.REDGIFS:
            imageSource = document.querySelector(selectors.REDGIFS).currentSrc
            folderName = folderNames.REDGIFS
            break
        case addresses.SANKAKU_WEBSITE:
            folderName = folderNames.SANKAKU_WEBSITE
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
            //console.log(document.querySelectorAll(selectors.default))
            //console.log(imageSource)
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
        case addresses.EHENTAI: // fallthrough
        case addresses.EXHENTAI:
            imageSource = document.querySelector(selectors.EXHENTAI).currentSrc
            folderName = folderNames.EXHENTAI
            break
        case addresses.NHENTAI:
            imageSource = document.querySelector(selectors.NHENTAI).currentSrc
            folderName = folderNames.NHENTAI
            break
        case addresses.PORNHUB:
            imageSource = document.querySelector(selectors.PORNHUB_GIF).querySelectorAll("source")[0].src
            //imageSource = document.querySelector(selectors.PORNHUB_GIF).querySelectorAll("*")
            //console.log(document.querySelector(selectors.PORNHUB_GIF).querySelectorAll("source")[0].src)
            folderName = folderNames.PORNHUB
            break
        case addresses.TSUMINO:
            imageSource = document.querySelector(selectors.TSUMINO).currentSrc
            folderName = folderNames.TSUMINO
            break
        case addresses.PUUSH:
            folderName = folderNames.PUUSH
            break
        case addresses.TUMBLR_MEDIA_64:
            folderName = folderNames.TUMBLR
            break
    }
}

function grab_content(imageSource){
    console.log("Content grabber activated.")
    console.log(imageSource)

    // Cleans the link and get the filename
    let fileName = imageSource.replace(/^.*[\\\/]/, '');

    if (isExhentaiImage) {
        //console.log(fileName)
        //fileName = document.querySelector("h1").innerHTML.split('\|').join('／').split('\/').join('／').replace(/^.*[\\\/]/, '').concat(" "+fileName)
        //fileName = document.querySelector("h1").innerHTML.replace('\|', '[').replace('\|', ']').replace('\/', '／').replace(/^.*[\\\/]/, '').concat(" "+fileName)
        fileName = document.querySelector("h1").innerHTML.replace('\|', '[').replace('\|', ']').replace(/^.*[\\\/]/, '').replace(/[:\/|&;$%@"<>()+,]/g, "-").replace(/^\s+/,"").concat(" "+fileName)
        console.log(fileName)
        //console.log(typeof(fileName))
    } else if (isNhentaiImage) {
        let title = document.title
        //console.log(fileName)
        fileName = title.replace(/[|&;$%@"<>()+,]/g, "-").substring(0, title.indexOf(" - Page")).concat(" "+fileName)
        console.log(fileName)
    } else if (isTsuminoImage) {
        let title = document.title
        fileName = title.replace(/[|&;$%@"<>()+,/]/g, "-").substring(("Tsumino - Read ").length).concat(" "+fileName)
        console.log(fileName)
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
    } else if (isTsuminoImage) {
        // your usual bad coding habit(tm)
        fileName = fileName.concat(".jpg")
    }

    //let finalFileName = "SKDownloader/" + folderName + "/" + fileName
    let finalFileName = folderName + "/" + fileName
    //console.log(finalFileName)

    let downloadArgs = {
        url: imageSource,
        name: finalFileName,
        //onload: notify(fileName)
    }

    console.log("Attempting download...")
    console.log("File name: " + fileName)
    GM_download(downloadArgs)

    // Copies the image link to clipboard for in case something went wrong
    GM_setClipboard(imageSource)

    if (autoCloseTab) {
        window.close()
    }
}

function notify(fileName){
    return GM_notification({
        text:"Download finished " + fileName,
        timeout:timeoutLength
    })
}