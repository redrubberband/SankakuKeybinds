// ==UserScript==
// @name         Sankaku Downloader (Manual)
// @namespace    http://tampermonkey.net/
// @version      0.68c-textfixing
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
    var downloadKey = "x"                       //default: "x"
    var favoriteKey = "v"                       //default: "v"
    //================Advanced options========================
    var imageSelector = "#image"                //default: "#image"
    var redImageSelector = ".video.media"       //default: ".video.media"
    var bingImageSelector = "img.nofocus"       //default: "img.nofocus"
    var sankakuImageSelector = "img"            //default: ".shrinkToFit"
    var allowRepeatDownloads = false            //default: false
    //================Download options========================
    var timeoutLength = 5000                    //default: 5000         //this number is in ms
    var isCustomFolder = false                  //default: false        //it will autodetect idol/chan, sent to your OS download folder
    var customFolderName = ""                   //default: ""
    //========================================================

    //init setup, don't change vars here please
    var executedOnce = false
    console.log("Script is loaded")

    //detect keyboard press
    document.onkeypress = function (e) {
        e = e || window.event;                                          //I just copied this part and I don't wanna break it because it worked

        //Main program switchcase
        switch(e.key){

            case favoriteKey:{
                console.log("Key " + favoriteKey + " is pressed")

                //locate the favorite icon
                let favicon = document.querySelector(".favoriteIcon")
                let addToFavs = document.querySelector("#add-to-favs")

                //check if fav-icon is hidden
                var currStyle = window.getComputedStyle(addToFavs)

                //check if fav-icon is already favorited 
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

                    //grabs the initial tag
                    var img = document.querySelector(imageSelector)
                    
                    //gets the current image that you want to download
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

                    //debugging
                    console.log(typeof(img))
                    console.log("img is "+img)

                    //calls the download function
                    executedOnce = grab(img, timeoutLength, isCustomFolder, customFolderName, allowRepeatDownloads)
                    console.log("Will only execute once: "+executedOnce)

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
        allowRepeatDownloads){      
    console.log("Grabber is loaded")

    //get the current link
    let link = img.src || img.currentSrc
    console.log("it is "+img)
    console.log("the link is "+link)

    //cleans link for filename
    let fileName = link.replace(/^.*[\\\/]/, '');
    if (fileName.indexOf('?') != -1){
    fileName = fileName.substring(0, fileName.indexOf('?'));
    }

    //check the current site for folder naming feature
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
            folderName = "Sankaku Channel/"
            console.log("Current site is Chan")
        } else if (currentLink.search("redgifs") != -1){
            folderName = "redgifs/"
            console.log("Current site is redgifs")
        } else if (currentLink.search("bing") != -1){
            folderName = "bing/"
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
        }
    }
    folderName = "SKDownloader/" + folderName

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
