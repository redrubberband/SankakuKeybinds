// ==UserScript==
// @name         Sankaku Downloader (Manual)
// @namespace    http://tampermonkey.net/
// @version      0.69-tryingtofixmessycode
// @description  Added favorite + download keybind for sankaku
// @author       redrubberband
// @include      *
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_setClipboard
// ==/UserScript==
(function() {
    'use strict';
    // Default values, do not change.
    var downloadKey = "x"
    var favoriteKey = "v"
    var timeoutLength = 5000
    var usingCustomFolder = false
    var customFolderName = ""
    var allowRepeatDownloads = false
    
    // Another init, but unrelated.
    // Still, do not change the values here.
    var alreadyExecutedOnce = false
    var currentLink = window.location.href
    var currentLocation = location.host
    var isChan = (currentLink.search("chan") != -1) || (currentLink.search("idol") != -1)
    var isSankaku 
    var isBing = currentLink.search("bing") != -1
    var isRedgifs

    const addresses = {
        BING                : "www.bing.com",
        CHAN                : "chan.sankakucomplex.com",
        REDGIFS             : "redgifs.com",
        SANKAKU_WEBSITE     : "www.sankakucomplex.com",
        _6GAMES             : "6gamesonline.com",
        HFLASH              : "h-flash.com"
    }

    const selectors = {
        BING                : "img.nofocus",
        CHAN                : "#image",
        REDGIFS             : ".video.media",
        SANKAKU_WEBSITE     : "img",
        _6GAMES             : "param",
        _6GAMES_ATTRIBUTE   : "value",
        H_FLASH             : "embed"
    }

    // Change this value to false if you want to customize them down below
    var using_default_values        = true
    if (!using_default_values) {
        downloadKey                 = "x"
        favoriteKey                 = "v"
        timeoutLength               = 5000
        usingCustomFolder           = false
        customFolderName            = ""
        allowRepeatDownloads        = false
    }

    console.log("Script is loaded")
    
    // Code begins here.    

    //detect keyboard press
    document.onkeypress = function (e) {
        e = e || window.event;                                          //I just copied this part and I don't wanna break it because it worked

        //Main program switchcase
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

                    let img
                    switch(currentLocation){
                        case addresses.BING:
                            img = document.querySelector(selectors.BING)
                            break
                        case addresses.CHAN:
                            document.querySelector(".favoriteIcon").scrollIntoView()
                            img = document.querySelector(selectors.CHAN)
                            break
                        case addresses.REDGIFS:
                            img = document.querySelector(selectors.REDGIFS)
                            break
                        case addresses.SANKAKU_WEBSITE:
                            img = document.querySelector(selectors.SANKAKU_WEBSITE)
                            break
                        case addresses._6GAMES:
                            img = document.querySelector(selectors._6GAMES).getAttribute(selectors._6GAMES_ATTRIBUTE)
                            break
                        case addresses.H_FLASH:
                            img = document.querySelector(selectors.H_FLASH).src

                    }

                    //debugging
                    console.log(typeof(img))
                    console.log("img is "+img)

                    //calls the download function
                    alreadyExecutedOnce = grab(img, timeoutLength, usingCustomFolder, customFolderName, allowRepeatDownloads, currentLink)
                    console.log("Will only execute once: "+alreadyExecutedOnce)

                } else {
                    console.log("Repeat download is disabled! You have already downloaded this image once")
                }

                break;
            }
        }
    };
})();


function grab(img,                                                      //this function handles the download section
        timeoutLength,
        isCustomFolder,
        customFolderName,
        allowRepeatDownloads,
        currentLink){
    console.log("Grabber is loaded")

    //get the current link
    let link = img.src || img.currentSrc

    if (currentLink.search("6games") != -1){
        link = img
    }else if (currentLink.search("h-flash") != -1){
        link = img
    }

    console.log("it is "+img)
    console.log("the link is "+link)

    //cleans link for filename
    let fileName = link.replace(/^.*[\\\/]/, '');
    if (fileName.indexOf('?') != -1){
    fileName = fileName.substring(0, fileName.indexOf('?'));
    }

    //check if isCustom tag is used
    if (isCustomFolder){
        folderName = customFolderName
    } else {
        //initialize the folder name
        var folderName = "Sankaku Website"

        if (currentLink.search("idol") != -1){
            folderName = "Idol Complex"
            console.log("Current site is Idol")
        } else if (currentLink.search("chan") != -1){
            folderName = "Sankaku Channel"
            console.log("Current site is Chan")
        } else if (currentLink.search("beta.sankaku") != -1){
            folderName = "Sankaku Channel"
            console.log("Current site is Chan")
        } else if (currentLink.search("sankaku") != -1){
            folderName = "Sankaku Website"
            console.log("Current site is Sankaku")
        } else if (currentLink.search("redgifs") != -1){
            folderName = "redgifs"
            console.log("Current site is redgifs")
        } else if (currentLink.search("bing") != -1){
            folderName = "bing"
            console.log("Current site is bing")
            var extension = fileName.split('.').pop()
            if (extension.length > 5){                                  //this one checks for files without extensions, usually media extensions is no longer than 5 characters
                console.log("Missing extension! Adding...")
                fileName = fileName.replace(".", "")                    //replaces weird characters (need to be added later)
                extension = ".jpg"                                      //I just assumed it will be a jpg. Fix it manually later on if it's wrong
                fileName = fileName.concat(extension)
            }
            console.log("Projected path: "+folderName+fileName)
            console.log(link)
        } else {
            folderName = window.location.hostname
        }
    }
    folderName = "SKDownloader/" + folderName + "/"

    //arguments for GM_download function
    var arg = {
        url: link,
        name: folderName + fileName,
        onload: function(){
            //executes the notification
            GM_notification({
                text:"Download finished " + fileName,
                timeout:timeoutLength
            })
        }
    }

    //execute the download
    //var download = GM_download(arg)
    console.log("Download status:" + GM_download(arg))

    //copy the img link to clipboard for backup incase something went wrong
    var copyLink = GM_setClipboard(link)

    if(allowRepeatDownloads ||                                          //this one will prevent the download from repeating for imageboards (preventing duplicates)
            folderName == "SKDownloader/redgifs/" ||                    //...at least, until the page is refreshed.
            folderName == "SKDownloader/bing/"){                        //other websites menitoned here wouldn't work because some of it is dynamic
        return false
    } else {
        return true
    }
}