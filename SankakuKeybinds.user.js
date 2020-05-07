// ==UserScript==
// @name         Sankaku Keybinds
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  try to take over the world!
// @author       Rubberband
// @match        https://*.sankakucomplex.com/*
// @grant        GM_download
// @grant        GM_notification
// ==/UserScript==
(function() {
    'use strict';

    //============Personalization config here=================
    var downloadKey = "x" //default: "x"
    var favoriteKey = "v" //default: "v"
    //================Advanced options========================
    var imageSelector = "#image" //default: "#image"
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
                console.log(addToFavs)
                console.log(currStyle.getPropertyValue("display"))
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

                    //calls the download function
                    grab(img, timeoutLength, isCustomFolder, customFolderName)

                    //if not allowed, will not allow this code to run again to prevent duplicate file
                    //..at least, until the page is refreshed
                    if(!allowRepeatDownloads){
                        executedOnce = true
                    }
                } else {
                    console.log("Repeat download is disabled! You have already downloaded this image once")
                }

                break;
            }
        }
    };
})();

//this function handles the download section
function grab(img, timeoutLength, isCustomFolder, customFolderName){
    console.log("Grabber is loaded")

    //gets the current link
    //console.log(img.src)
    let link = img.src

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
        //sets the folder name
        var folderName = "Sankaku Channel/"
        //console.log(folderName)

        if (currentLink.search("idol") != -1){
            folderName = "Idol Complex/"
            console.log("Current site is Idol")
        } else {
            console.log("Current site is Chan")
        }
    }

    //for notification ID purpose, 5 is added because show is 5 letters long. I forgot how to do that but well this worked so far.
    var linkIdentifier = currentLink.substring(currentLink.indexOf("show")+5, currentLink.length)

    //arguments for GM_download function
    var arg = {
        url: link,
        name: folderName + fileName,
        onload: function(){
            //executes the notification
            console.log(GM_notification({
                text:"Download finished " + linkIdentifier,
                timeout:timeoutLength
            }))
        }
    }

    //executes the download
    var download = GM_download(arg)

    //debugging purposes
    //console.log(fileName)
    //console.log(download)
}
