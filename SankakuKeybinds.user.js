// ==UserScript==
// @name         Sankaku Downloader (JQuery)
// @namespace    http://tampermonkey.net/
// @version      1.8d-another jQuery addition
// @description  Added favorite + download keybind for sankaku
// @author       redrubberband
// @match        *.bing.com/*
// @match        *.deltaporno.com/*
// @match        *.nhentai.net/*
// @match        *.pixiv.net/en/artworks/*
// @match        *.pornhub.com/*
// @match        *.redd.it/*
// @match        *.sankakucomplex.com/*
// @match        *.tsumino.com/*
// @match        *.media.tumblr.com/*
// @match        exhentai.org/*
// @match        e-hentai.org/*
// @match        e621.net/*
// @match        hitomi.la/*
// @match        h-flash.com/*
// @match        i.pximg.net/*
// @match        puu.sh/*
// @match        redgifs.com/*
// @match        6gamesonline.com/*
// @match        *.facebook.com/*
// @match        *.instagram.com/*
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_setClipboard
// @require      https://code.jquery.com/jquery-3.5.1.min.js

// ==/UserScript==

/* Use this in browser console to run JQuery in console

var jqry = document.createElement('script');
jqry.src = "https://code.jquery.com/jquery-3.5.1.min.js";
document.getElementsByTagName('head')[0].appendChild(jqry);
jQuery.noConflict();

*/

'use strict'

var $ = window.jQuery

// Change this value to true if you want to customize them
var using_custom_values        = true

if (using_custom_values) {
    var downloadKey                 = "x"
    var favoriteKey                 = "v"
    var timeoutLength               = 500
    var usingCustomFolder           = false
    var customFolderName            = ""
    var allowRepeatDownloads        = true
    var exHentaiQuickArchiveMode    = false // instantly downloads after you open the image
    var autoCloseTabAfterDownload   = false // instantly closes the page after the downloadKey is pressed // always true for exhentai and sankaku website
} else { // Default values, DO NOT change!
    downloadKey = "x"
    favoriteKey = "v"
    timeoutLength = 5000
    usingCustomFolder = false
    customFolderName = ""
    allowRepeatDownloads = false
    exHentaiQuickArchiveMode = false
    autoCloseTabAfterDownload = true
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
    SANKAKU_BETA        : "beta.sankakucomplex.com",
    HITOMI_LA           : "hitomi.la",
    DELTAPORNO          : "gallery.deltaporno.com",
    E621                : "e621.net"
}

const selectors = {
    BING                : "img.nofocus",
    CHAN                : "#image",
    _6GAMES             : "param",
    _6GAMES_ATTRIBUTE   : "value",
    H_FLASH             : "embed",
    EXHENTAI            : "a img#img",
    NHENTAI             : "#image-container a img",
    PORNHUB_GIF         : "#gifWebmPlayer",
    REDGIFS             : ".video.media",
    TSUMINO             : ".img-responsive.reader-img",
    SANKAKU_BETA_FAV    : "svg",
    SANKAKU_BETA_DOWN   : "button",
    HITOMI_LA           : "#comicImages picture img",
    DELTAPORNO          : "#image-viewer-container img",
    E621                : "#image",
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
    HITOMI_LA           : "hitomi.la",
    DELTAPORNO          : "deltaporno",
    E621                : "e621",
    default             : window.location.hostname
}

var isChan = (currentLocation == addresses.CHAN) || (currentLocation == addresses.CHAN_IDOL)
var isChanImage = (isChan && document.location.href.indexOf("/post/show") > -1 )
var isBing = (currentLocation == addresses.BING)
var isExhentai = ((currentLocation == addresses.EXHENTAI || currentLocation == addresses.EHENTAI) && document.location.href.indexOf("/g/") > -1)
var isExhentaiImage = ((currentLocation == addresses.EXHENTAI || currentLocation == addresses.EHENTAI) && document.location.href.indexOf("/s/") > -1)
var isNhentaiImage = (currentLocation == addresses.NHENTAI && document.location.href.indexOf("/g/") > -1)
var isTsuminoImage = (currentLocation == addresses.TSUMINO && document.location.href.indexOf("/Read/Index/") > -1)
var isBetaSankakuImage = (currentLocation == addresses.SANKAKU_BETA && document.location.href.indexOf("/post/show/") > -1)
var isHitomiLaImage = (currentLocation == addresses.HITOMI_LA && document.location.href.indexOf("/reader/") > -1)
var isE621Image = (currentLocation == addresses.E621 && document.location.href.indexOf("/posts/") > -1)

var isFacebookImage = (currentLocation == "www.facebook.com" && document.location.href.indexOf("photo.php?") > -1)

// Init some other default values
var folderName = folderNames.default
var singleExecutionOnly = !allowRepeatDownloads
var alreadyExecutedOnce = false
var imageSource
var maxImageHeight_Nhentai = '750px'

var maxImageHeight_Chan = '450px'
var maxImageHeight_E621 = '850px'
try{
    imageSource = document.querySelector(selectors.default).currentSrc
} catch (err) {
    imageSource = ""
}

console.log("Script is loaded")

// This is my personal script customization which may or may not be suitable for general use.

if (isExhentaiImage) {
    autoCloseTabAfterDownload = true
    window.addEventListener("load", function() {
        $(selectors.EXHENTAI).css("width", 'auto')
        $(selectors.EXHENTAI).css("maxHeight", 550)

        $(selectors.EXHENTAI)[0].scrollIntoView()
        if (exHentaiQuickArchiveMode) {
            setSourceAndFolder()
            grab_content(imageSource, folderName)
            window.close()
        }
    })
}

else if (isChanImage) {
    // I'll put this outside the onload listener just in case.
    $('div[id="sp1"]').hide()

    window.addEventListener("load", function(){
        let top_box = $(".status-notice").not("#notice")
        // Resize the image to fit your screen
        $(selectors.CHAN).css("width", "auto")
        $(selectors.CHAN).css("maxHeight", maxImageHeight_Chan)

        // Hide EVERY SINGLE #sp1 (fucking duplicate IDs, man)
        // (it's the "Hide ads" one with huge empty space if you have adblocker)
        $('div[id="sp1"]').hide()

        // Make the top box appear transparent
        top_box.css("background-color", "rgb(255,255,255)")
        top_box.not("#notice").css("border-style", "none")

        // Hide various top texts
        $("#pending-notice").hide()
        $(".status-notice div").not("#parent-preview").not("#child-preview").hide()

        // Make the parent/child post height smaller
        top_box.css("height", "150")

        // Remove the padding and margins
        $(".status-notice").css("padding", "0 0 0 0")
        $(".status-notice").css("margin", "0 0 0 0")

        // Remove the "Get plus" ad
        $("#has-mail-notice").hide()

        // Cram more images into the page
        $("#share").hide()
        $("#recommended h3").hide()

        // You need to add [0] in jQuery's scrollIntoView for it to work.
        $("#tags")[0].scrollIntoView()
    })
}

else if (isChan) {
    window.addEventListener("load", function(){

        // Hide EVERY SINGLE #sp1
        $('div[id="sp1"]').hide()

        // Remove the "Get plus" ad
        $("#has-mail-notice").hide()
    })
}

else if (isE621Image) {
    $("#img").css("width", 'auto')
    $("#img").css("maxHeight", 850)
    $("#tags")[0].scrollIntoView()
}

else if (isNhentaiImage) {

    let nhentai_selector = "#image-container a img"
    $(nhentai_selector).change(function() {
        window.alert("YEEEAAAAAH")
    })

    // $( "select" ) .change(function () {
    //     document.getElementById("loc").innerHTML="You selected: "+document.getElementById("se").value;
    //     });

    window.onload = function() {
        document.querySelector(selectors.NHENTAI).style.width = 'auto'
        document.querySelector(selectors.NHENTAI).style.maxHeight = maxImageHeight_Nhentai
        document.querySelector(selectors.NHENTAI).scrollIntoView()
    }

    $("a.next").on("click", function() {
        $(nhentai_selector).css("width", 'auto')
        $(nhentai_selector).css("maxHeight", 750)
        document.querySelector(selectors.NHENTAI).scrollIntoView()
    })
    // THIS ISN'T AN IDEAL SOLUTION BUT IT WORKS FOR NOW
    document.querySelector("a.next").addEventListener("click", function() {
        document.querySelector(selectors.NHENTAI).style.width = 'auto'
        document.querySelector(selectors.NHENTAI).style.maxHeight = maxImageHeight_Nhentai
        document.querySelector(selectors.NHENTAI).scrollIntoView()
        document.querySelector("a.next").addEventListener("click", function() {
            document.querySelector(selectors.NHENTAI).style.width = 'auto'
            document.querySelector(selectors.NHENTAI).style.maxHeight = maxImageHeight_Nhentai
            document.querySelector(selectors.NHENTAI).scrollIntoView()
        })
    })

    // THIS ISN'T AN IDEAL SOLUTION BUT IT WORKS FOR NOW
    document.querySelector("a.previous").addEventListener("click", function() {
        document.querySelector(selectors.NHENTAI).style.width = 'auto'
        document.querySelector(selectors.NHENTAI).style.maxHeight = maxImageHeight_Nhentai
        document.querySelector(selectors.NHENTAI).scrollIntoView()
        document.querySelector("a.previous").addEventListener("click", function() {
            document.querySelector(selectors.NHENTAI).style.width = 'auto'
            document.querySelector(selectors.NHENTAI).style.maxHeight = maxImageHeight_Nhentai
            document.querySelector(selectors.NHENTAI).scrollIntoView()
        })
    })
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
                $(".recommended-prev a").click()
            } else if (isNhentaiImage) {
                $(selectors.NHENTAI).css("width", 'auto')
                $(selectors.NHENTAI).css("maxHeight", 750)
                $(selectors.NHENTAI)[0].scrollIntoView()
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
                $(".recommended-next a").click()
            } else if (isNhentaiImage) {
                $(selectors.NHENTAI).css("width", 'auto')
                $(selectors.NHENTAI).css("maxHeight", 750)
                $(selectors.NHENTAI)[0].scrollIntoView()
            }
            break
        }

        case favoriteKey:{
            console.log("Key " + favoriteKey + " is pressed")
            if (isChan){
                // DO NOT CONVERT TO JQUERY
                // The computed style is not working properly with jQuery.
                var favorite_icon           = document.querySelector(".favoriteIcon")
                let available_to_favorite   = document.querySelector("#add-to-favs")
                let current_style           = window.getComputedStyle(available_to_favorite) // Check if fav-icon is hidden
                // !!-- Commented to prevent accidental unfavorite, uncomment it to use the unfavorite function --!!
                // if (current_style.getPropertyValue("display") == "none"){ // Check if fav-icon is already favorited 
                //     console.log("Changing favorite value...")
                //     favorite_icon = document.querySelector(".favoriteIcon.clicked")
                // }
                favorite_icon.click()
                // Revert back to default state for repeatability
                favorite_icon = document.querySelector(".favoriteIcon")
                break  

            } else if (isBetaSankakuImage) {
                // Not going to convert this one to jQuery as I don't really have any use for this version as of now.
                let all_buttons = document.querySelectorAll(selectors.SANKAKU_BETA_FAV)
                let favorite_button
                // Current status as of October 19th 2020
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
                // favorite_button.dispatchEvent(new Event('click'));
                favorite_button.dispatchEvent(new MouseEvent("click"));
                break

            } else if (isE621Image){
                $("#add-to-favorites").click()
                break

            } else {
                console.log("Script is not configured to favorite outside Chan / Idol / E621!")
                break
            }
        }

        case downloadKey:{
            console.log("Key " + downloadKey + " is pressed")
            
            // Special function because this beta website is a pain to work with
            if (isBetaSankakuImage){
                // Current status as of October 19th 2020
                let download_button = document.querySelectorAll(selectors.SANKAKU_BETA_DOWN)[3]
                download_button.click()
                break
            }

            if (!alreadyExecutedOnce){
                setSourceAndFolder()
                grab_content(imageSource, folderName) // Calls the download function
                if (singleExecutionOnly) alreadyExecutedOnce = true // Prevents duplicate download
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
            imageSource =$(selectors.BING).currentSrc
            folderName = folderNames.BING
            break
        case addresses.CHAN:
            imageSource = $(selectors.CHAN).currentSrc
            folderName = folderNames.CHAN
            break
        case addresses.CHAN_IDOL:
            imageSource = $(selectors.CHAN).currentSrc
            folderName = folderNames.CHAN_IDOL
            break
        case addresses.REDGIFS:
            imageSource = $(selectors.REDGIFS).currentSrc
            folderName = folderNames.REDGIFS
            break
        case addresses.SANKAKU_WEBSITE:
            folderName = folderNames.SANKAKU_WEBSITE
            autoCloseTabAfterDownload = true
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
        case addresses.HITOMI_LA:
            imageSource = document.querySelector(selectors.HITOMI_LA).currentSrc
            folderName = folderNames.HITOMI_LA
            break
        case addresses.DELTAPORNO:
            imageSource = document.querySelector(selectors.DELTAPORNO).currentSrc
            folderName = folderNames.DELTAPORNO
            break
        case addresses.E621:
            imageSource = document.querySelector(selectors.E621).currentSrc
            folderName = folderNames.E621
            break
        case "www.facebook.com":
            imageSource = document.querySelector("img").currentSrc
            folderName = "facebook"
            break
        case "www.instagram.com":
            imageSource = document.querySelector("article div div div div img").src
            folderName = "instagram"
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
        fileName = document.querySelector("h1").innerHTML.replace('\|', '[').replace('\|', ']').replace(/^.*[\\\/]/, '').replace(/[:\/|&;$%@"<>()+,?]/g, "-").replace(/^\s+/,"").concat(" "+fileName)
        console.log(fileName)
        //console.log(typeof(fileName))
    } else if (isNhentaiImage) {
        let title = document.title
        //console.log(fileName)
        fileName = title.replace(/[|&;$?%@"<>()+,]/g, "-").substring(0, title.indexOf(" - Page")).concat(" "+fileName)
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
    } else if (isTsuminoImage || isHitomiLaImage) {
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
    console.log("File name: " + finalFileName)
    GM_download(downloadArgs)

    // Copies the image link to clipboard for in case something went wrong
    GM_setClipboard(imageSource)

    if (autoCloseTabAfterDownload) {
        window.close()
    }
}

function notify(fileName){
    return GM_notification({
        text:"Download finished " + fileName,
        timeout:timeoutLength
    })
}