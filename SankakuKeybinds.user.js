// ==UserScript==
// @name         Sankaku Downloader (Manual)
// @namespace    http://tampermonkey.net/
// @version      0.68b-sankaku
// @description  Added favorite + download keybind for sankaku
// @author       redrubberband
// @match        https://*.sankakucomplex.com/*
// @match        https://*.redgifs.com/*
// @match        https://*.bing.com/images/*
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_setClipboard
// ==/UserScript==
(function() {
    'use strict';

    //============Personalization config here=================
    var downloadKey = "x" //default: "x"
    var favoriteKey = "v" //default: "v"
    //================Advanced options========================
    var imageSelector = "#image" //default: "#image"
    var redImageSelector = ".video.media" //default: ".video.media"
    var bingImageSelector = "img.nofocus" //default: "img.nofocus"
    var sankakuImageSelector = "img" //default: ".shrinkToFit"
    var allowRepeatDownloads = false //default: false
    //================Download options========================
    var timeoutLength = 5000 //default: 5000 //this number is in ms
    var isCustomFolder = false //default: false //it will autodetect idol/chan, sent to your OS download folder
    var customFolderName = "" //default: ""
    //========================================================

    //init setup, don't change vars here please
    var executedOnce = false
    console.log("Script is loaded")

    //detect keyboard press
    document.onkeypress = function (e) {
        e = e || window.event; //I just copied this part and I don't wanna break it because it worked

        //Main program switchcase
        switch(e.key){
            case favoriteKey:{
                console.log("Key " + favoriteKey + " is pressed")

                //locate the favorite icon
                let favicon = document.querySelector(".favoriteIcon")
                let addToFavs = document.querySelector("#add-to-favs")

                //check if fav-icon is hidden
                var currStyle = window.getComputedStyle(addToFavs)
                //console.log(addToFavs)
                //console.log(currStyle.getPropertyValue("display"))
                if (currStyle.getPropertyValue("display") == "none"){
                    console.log("changing value...")
                    favicon = document.querySelectorAll(".favoriteIcon.clicked")[0]
                    console.log(favicon)
                }

                //clicks the fav icon
                favicon.click()

                //revert back to default state for repeatability
                favicon = document.querySelector(".favoriteIcon")

                break;
            }
            case downloadKey:{
                console.log("Key " + downloadKey + " is pressed")

                //checks if download action is already executed once or not
                if (!executedOnce){
                    //gets the current image that you want to download
                    var img = document.querySelector(imageSelector)
                    if (img == null){
                        console.log("yeet")
                        img = document.querySelectorAll(redImageSelector)
                        console.log(typeof(img[0]))
                        if (typeof(img[0]) == "undefined"){
                            console.log("undef")
                            img = document.querySelectorAll(bingImageSelector)
                            if (typeof(img[0]) == "undefined"){
                                console.log("undefv2")
                                img = document.querySelectorAll(sankakuImageSelector)
                            }
                        }
                        console.log(typeof(img))
                        console.log(img)
                        img = img[0]
                    }
                    console.log(typeof(img))
                    console.log("img is "+img)

                    //calls the download function
                    executedOnce = grab(img, timeoutLength, isCustomFolder, customFolderName, allowRepeatDownloads)
                    console.log(executedOnce)

                } else {
                    console.log("Repeat download is disabled! You have already downloaded this image once")
                }

                break;
            }
        }
    };
})();

//this function handles the download section
function grab(img, timeoutLength, isCustomFolder, customFolderName, allowRepeatDownloads){
    console.log("Grabber is loaded")

    //gets the current link
    let link = img.src || img.currentSrc
    console.log("it is "+img)
    console.log("the link is "+link)

    //cleans link for filename
    let fileName = link.replace(/^.*[\\\/]/, '');
    if (fileName.indexOf('?') != -1){
    fileName = fileName.substring(0, fileName.indexOf('?'));
    }

    //check the current site for chan/idol naming and notification feature
    let currentLink = window.location.href

    //check if isCustom tag is used
    if (isCustomFolder){
        folderName = customFolderName+"/"
    } else {
        //initialize the folder name
        var folderName = "Sankaku Website/"

        if (currentLink.search("idol") != -1){
            folderName = "Idol Complex/"
            console.log("Current site is Idol")
        } else if (currentLink.search("chan") != -1){
            folderName = "Sankaku Complex/"
            console.log("Current site is Chan")
        } else if (currentLink.search("redgifs") != -1){
            folderName = "redgifs/"
            console.log("Current site is redgifs")
        } else if (currentLink.search("bing") != -1){
            folderName = "bing/"
            console.log("Current site is bing")
            //console.log(fileName)
            //console.log(fileName.split('.').pop())
            var extension = fileName.split('.').pop()
            //console.log(extension.length)
            if (extension.length > 5){
                console.log("Missing extension! Adding...")
                fileName = fileName.replace(".", "")
                extension = ".jpg"
                fileName = fileName.concat(extension)
            }
            //console.log(fileName)
            //console.log(folderName+""+fileName)
            console.log(link)
        }
    }
    folderName = "SKDownloader/" + folderName

    //not used for now.//
    //for notification ID purpose, 5 is added because show is 5 letters long. I forgot how to do that but well this worked so far.
    //var linkIdentifier = currentLink.substring(currentLink.indexOf("show")+5, currentLink.length)

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

    //executes the download
    //var download = GM_download(arg)
    console.log("Download status:" + GM_download(arg))

    //copies the img link to clipboard
    var copyLink = GM_setClipboard(link)
    //debugging purposes
    //console.log(fileName)
    //console.log(download)

    //if not allowed, will not allow this code to run again to prevent duplicate file
    //..at least, until the page is refreshed
    //console.log(folderName)
    //console.log(folderName == "SKDownloader/redgifs/")
    if(allowRepeatDownloads || folderName == "SKDownloader/redgifs/" || folderName == "SKDownloader/bing/"){
        return false
    } else {
        return true
    }
}
