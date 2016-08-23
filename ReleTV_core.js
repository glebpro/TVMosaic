//================================================================
//                                  SHARED VARS AND FUNCTIONS
//================================================================
var mPlayConfig = {
    endMilSeconds: 4600000000, //this doesn't look good..., gleb
    upToHourOld:   true,
    reload:        false
}

// NOTE: using native mode to just give us back the XML directly
// NOTE: this xml_url_base is set to allow cross development on dreamhost without changing the config
var xml_url_base = document.URL + 'xml2json.php?mode=native&url=';

// for debugging
window.tvmosaic_status = '';    // what TVmosaic is currently doing
window.tvmosaic_allstatus = []; // what TVmosaic has done

var mAllVideosList = [];
                                //NOTE:  mChannelDict and liveVids are defined within  ReleTV_config.js
var mLatestVideoList = [];      // [videoObj,videoObj,...], holds latest ( < cutoff hours old) of the videos, sorted by newest first, used to populate latest left list
var mTrendingVideoList = [];     // [videoObj,videoObj,...], holds the top 50 most trending (highest viewcount) videos, sorted by viewcount used to populate trending left list
var mRecentWatchedList = [];    // [videoObj,videoObj,...], holds videos user has watched, used to populate recently watched stuff
var mVideoDict = {};            // key: channelId, object : [videoObj,videoObj,...] // holds all of the vidoes, organized by channels, for right bottom box
var hardcodedVideosListCopy = hardcodedVideosList;         // going to be making possible additions, so use this copy 
var mCategoryDict = {};         // key: category.category , object : [videoObj,videoObj,...] // holds all of the vidoes, organized by category, for mobile site
var mUTPlayerCounter = 0;
var readyForPlayer = false;     // false if not ready, true if got to end of teleStart()
var incWidth = 0;               // for loading bar
var listicorVids = [];          // in video search, in addionditon to filtering for videos on site, get some more from listicor
var listicorVidsLimit = 25;

// these are all variables for the big youtube player
var mUTPlayer = null ;
var mCurrentVideoId = null ;
var mRollVideoTimer = null ;
var mEndVideoTimer = null ; 
var mLastPlayerState = -100;

// TODO: would it make sense to shove this into the promise as well?
// callback specified in the invocation of https://www.youtube.com/iframe_api?
// must have the player API ready before we can try to use it
// onYouTubeIframeAPIReady() is a keyworded function, the YT player api loading call in teleStart() goes here after it's done
function onYouTubeIframeAPIReady() {
    updateStatus('onYouTubeIframeAPIReady() called');
    if (YT && typeof YT.Player == 'function') {
        if(jQuery.isReady){ // is this safe?
            setupPlayer();
        }else{
            updateStatus("   onYouTubeIframeAPIReady() YT loaded, but DOM is not ready, reloading onYouTubeIframeAPIReady after 150ms....");
            setTimeout(onYouTubeIframeAPIReady, 150);
        }
    } else {
        updateStatus("   onYouTubeIframeAPIReady() YT failed to load, reloading page after 60000ms....");
        setTimeout(window.location.reload, 60000);
    }
}
function setupPlayer() {
    updateStatus('Called setupPlayer()');
    mUTPlayerCounter+=1;
    var loadInto = '';
    if(checkIfMobile() == true){
        loadInto = 'utplayerdivmobile';
    }else{
        loadInto = 'utplayerdivdesktop';
    }
    if (null == mUTPlayer && YT) {
        mUTPlayer = new YT.Player(loadInto,{// embed in this element
            playerVars: {
                rel: 0,
                enablejsapi: 1,
                modestbranding: 1,
                showinfo: 0,
            },
            events: {
                'onStateChange': onPlayerStateChange,
                'onReady': onReadyVideo
            },
        });
    }
}
function resetEverything() {
    updateStatus('Called resetEverything()');
    mLastPlayerState = -100;
    mRollVideoTimer = null ;
    mEndVideoTimer = null ;
    mCurrentVideoId = null ;
    mChannelDict = {};
    mVideoDict = {};
    mLatestVideoList = [];
    mUpdateVideoCount = 0;
    mChannelListTimer = null ;
}
function playNext() {
    if(getCookie('autoplayVideoToggle') == 'disable'){
        return;
    }
    cancelRollover('playNext');
    cancelEnd();
    for (var i = 0; i < mCurrentList.length; i++) {
        if (mCurrentList[i].watched == false) {
            video2play(mCurrentList[i].videoId);
            break;
        }
    }
}
function cancelRollover(fname) {
    if (mRollVideoTimer != null ) {
        // console.log("    "+fname+"()  mRollVideoTimer canceled");
        clearTimeout(mRollVideoTimer);
        mRollVideoTimer = null ;
    }
}
function cancelEnd() {
    if (mEndVideoTimer != null ) {
        clearTimeout(mEndVideoTimer);
        mEndVideoTimer = null ;
    }
}
function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED) {
        // console.log("   PlayState() ENDED called.");
        mLastPlayerState = YT.PlayerState.ENDED;
        playNext();
    } else if (event.data == -1) {
        mLastPlayerState = -1;
        // console.log("   PlayState() -1 called.");
        cancelRollover('PlayState(-1)');
        mRollVideoTimer = setTimeout(function() {
            if (mLastPlayerState == -1) {
                playNext();
            }
        }, 5000);
    } else if (event.data == 1) {
        // playing
        cancelRollover('PlayState(1)');
        // console.log("   PlayState() Playing called. SEt timer");
        cancelEnd();
        mEndVideoTimer = setTimeout(playNext, mPlayConfig.endMilSeconds);
    } else {
        mLastPlayerState = event.data;
        if (event.data == 3) {
            // Buffering start
            cancelEnd();
            mEndVideoTimer = setTimeout(playNext, mPlayConfig.endMilSeconds);
        }
        // console.log("   PlayState() Changed. data="+event.data);
    }
}
function video2play(videoId) {
    updateStatus('Called video2play('+videoId+')');
    
    // playback
    if (mUTPlayer && mUTPlayer.loadVideoById) {
        
        var currVid = '';
        for(var ch in mVideoDict){
            for(var v in mVideoDict[ch]){
                if(mVideoDict[ch][v].videoId == videoId){
                    mVideoDict[ch][v].watched = true;
                    if(containsVid(videoId, mRecentWatchedList) == -1){
                        mRecentWatchedList.unshift(mVideoDict[ch][v]);
                    }             
                    currVid = mVideoDict[ch][v];
                    break;
                }
            }
        }
        
        if(checkIfMobile() == false){
            // load vid display info
            // meaining it's not a listicor video
            if(currVid != ''){
                $('#currentVideoChannelThumbnail').css('background-image', 'url('+mChannelDict[currVid.chid].thumbnail+')');
                $('#currentVideoTitle').text(currVid.title);
                $('#currentVideoChannelTitleAndTime').text(mChannelDict[currVid.chid].title + ' | ' + currVid.updated.ago + ' | ' + currVid.viewcount + ' views');
            }else{
            
                for(var v in listicorVids){
                    if(listicorVids[v].videoId == videoId){
                        currVid = listicorVids[v];
                        break;
                    }
                }
        
                $('#currentVideoChannelThumbnail').css('background-image', 'url('+logo_icon+')');
                $('#currentVideoTitle').text(currVid.title);
                $('#currentVideoChannelTitleAndTime').text(currVid.chtitle + ' | ' + currVid.updated.ago);
            } 
        }else{
            //ch, vid ,true
            loadInduvidualVideo(currVid.chid, currVid.videoId, true)
        }
        
        //actually play the video
        mUTPlayer.loadVideoById(videoId);
        mCurrentVideoId = videoId;
        
        //highlight
        highlightCurrentVideo(mCurrentVideoId);
    }
}

// will trigger once the YT.player has loaded
// will only play video if teleStart() has finished and readyForPlayer is flagged
// if it's not, call onReadyVideo again, hopefully telestart is done after a second
// if mUTPlayer loading has failed, try to setupPlayer() again
// if setupPlayer() called more than 8 times, reload the page
var setUpPlayerCounter = 0;
function onReadyVideo() {
    updateStatus('Called onReadyVideo()');
    
    // don't auto play first video on mobile
    if(checkIfMobile() == true){
        return;
    }
    if (mUTPlayer) { // redundent, but just in case
        if (mUTPlayer.loadVideoById){
            if(readyForPlayer == true){
                if($('#loadingScreen').attr('display') != 'none'){ // if for whatever reason it's not hidden yet, hide it here
                    hideLoadingScreen();
                }
                
                if(mLatestVideoList.length == 0){
                    setCurrentList('trending');
                    video2play(mTrendingVideoList[0].videoId);   
                }else{
                    setCurrentList('latest');
                    video2play(mLatestVideoList[0].videoId);
                }

            }else{
                updateStatus("   mUTPlayer.loadVideoById() is READY, but readyForPlayer not true, reload onReadyVideo in 1000ms");
                setTimeout(onReadyVideo, 1000);
            }
        } else {
            setUpPlayerCounter+=1;
            if(setUpPlayerCounter < 8){
                updateStatus("   mUTPlayer loading FAILED in onReadyVideo(), run setUpPlayer() in 500ms...");
                setTimeout(setupPlayer, 500);
            }else{
                updateStatus("   mUTPlayer loading FAILED in onReadyVideo() more than 8 times, window.reload in 150ms...");
                setTimeout(window.location.reload(), 150);
            }
        }
    }
}

// set what list of videos to play through
// mCurrentList initilized to mLatestVideoList in teleStart()
// set to channel list if clicked on channel related thing
function setCurrentList(id){
    var currentPlaylist = [];
    if(id == 'latest'){
        mCurrentList = mLatestVideoList;
    }else if(id == 'trending'){
        mCurrentList = mTrendingVideoList;
    }else if(id == 'listicorResults'){
        mCurrentList = listicorVids;
    }else{
        mCurrentList = mVideoDict[id];
    }
  
    /*
    for(var v in mCurrentList){
        currentPlaylist.push(mCurrentList[v].videoId);
    }
    mUTPlayer.loadPlaylist(currentPlaylist);
    */
    
    mCurrentChannel = id;

}

//=================================================
// THIS SECTION HANDLES GETTING OF VIDEOS
//=================================================

// Generate a promise for each channelID, and promise for each playlistID, to get it's videos
// from : teleStart()
// returns : array of promises to get videos for channels 
function promiseToGetVideos(addToTimeout){
    updateStatus('Called promiseToGetVideos()');
    var promises = [];
    
    var cookiedChannels = getCookie('savedChannels');
    if(cookiedChannels != ""){
        cookiedChannels = cookiedChannels.split(',');
    }

    for (var ch in mChannelDict) {
        
        // generate promise to get videos
        var url = xml_url_base + encodeURIComponent('https://www.youtube.com/feeds/videos.xml?channel_id='+mChannelDict[ch].id);
        var getP = Promise.resolve($.get(url)).then(function(data){
            return convertFeedEntryToVid(data, '');
        }).then(function(videos){
            if(videos.length != 0){ // meaing it didn't time out
                // put in all videos
                mAllVideosList = mAllVideosList.concat(videos);
                // put in mVideoDict (organized by channel)
                mVideoDict[videos[0].chid] = mVideoDict[videos[0].chid].concat(videos);   
                // put in mCategoryDict (organized by category, ex: for 'live' videos)
                mCategoryDict[mChannelDict[videos[0].chid].category] = mCategoryDict[mChannelDict[videos[0].chid].category].concat(videos);   

                return videos[0].chid;
            }else{
                return 'timeout';
            }
        }).then(function(chid){
            //if on desktop version, and didn't timeout display the channel 
            if(chid != 'timeout' && checkIfMobile() == false){
                appendChannelListing(chid);
            }

            incrementLoadingBar();

        });
        
        // check if it's in the savedChannels cookie, if so, don't include a timeout for it, force it to load
        if($.inArray(mChannelDict[ch].id, cookiedChannels) != -1){
            promises.push(getP);
        }else{
            var timerP = new Promise(function(resolve, reject){
                setTimeout(resolve, timeouts.getVideoTimeout+addToTimeout, 'skip');
            }); // timer promise

            // race them, which ever one is faster will constitute the resolved promise in the Promise.all() line in telestart(), incrementing it to the next one
            // if one wins, it doesn't cancel the other, they both will eventually resolve!
            promises.push(Promise.race([timerP, getP]));
        }

    }
    
    for(var p in mPlaylistDict){
        var url = xml_url_base + encodeURIComponent('https://www.youtube.com/feeds/videos.xml?playlist_id='+mPlaylistDict[p].id);
        
        var getP = Promise.resolve($.get(url)).then(function(data){
            return convertFeedEntryToVid(data, true);
        }).then(function(videos){
            mAllVideosList = mAllVideosList.concat(videos);

            for(var v in videos){
                // put live videos in the front
                if(videos[v].updated.ago == 'LIVE'){
                    mVideoDict[videos[v].chid].unshift(videos[v]);   
                }else{
                    mVideoDict[videos[v].chid].push(videos[v]);   
                }
                mCategoryDict[mChannelDict[videos[v].chid].category].push(videos[v]);   

            }
            incrementLoadingBar();     
        });

          
        promises.push(getP);

    }
    
    updateStatus('Finished promiseToGetVideos()');
    return promises;
}

// given feed data, extract it and convert to videoObjs
// from : promiseToGetVideos()
// parameters : data, youtube feed xml data, isLive, flag if it's a live video
// returns : array of videoObj for a particular channel
function convertFeedEntryToVid(data, isLive){
    
    // convert an xml document tree into a native javascript option 
    // recursively traverse the xml tree
    function xmlToJson(xml) {

        //TODO: put in some guards against empty xml

        // Create the return object
        var obj = {};

        if (xml.nodeType == 1) { // element
        // do attributes
            if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                for (var j = 0; j < xml.attributes.length; j++) {
                    var attribute = xml.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } else if (xml.nodeType == 3) { // text
            obj = xml.nodeValue;
        }

        // do children
        if (xml.hasChildNodes()) {
            for(var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (typeof(obj[nodeName]) == "undefined") {
                    obj[nodeName] = xmlToJson(item);
                } else {
                    if (typeof(obj[nodeName].push) == "undefined") {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(xmlToJson(item));
                }
            }
        }
        return obj;
    }
    
    var v;
    var vids = [];
    var pData = xmlToJson(data).feed; //var pData = xmlToJson($.parseXML(data.contents)).feed;
   
    for(var vid in pData.entry){
        v = {};
        
        if(pData.entry[vid]['yt:channelId'] == null){ // this seems to happend sometimes?
            continue;
        }
        // if it's not from a channel we care about, skip
        if(Object.keys(mChannelDict).indexOf(pData.entry[vid]['yt:channelId']['#text']) <= 0){
            continue;
        // if it's a duplicate, skip it
        }else if(containsVid(pData.entry[vid].id['#text'].slice(9), mAllVideosList) > -1){
            continue;
        }else{          
            v.chid = pData.entry[vid]['yt:channelId']['#text'];
            v.description = pData.entry[vid]['media:group']['media:description']['#text'];
            v.thumbnail = pData.entry[vid]['media:group']['media:thumbnail']['@attributes'].url;
            v.title = pData.entry[vid]['media:group']['media:title']['#text'];
            
            // when getting videos from the feeds, (not hardcoded videos), there is no way of determining if the video is live or not
            // but it will usually have the word 'live' in the title
            // TODO: this is bad
            if(v.title.toLowerCase().indexOf(' live ') >= 0){
                v.updated = timeSince(pData.entry[vid].published['#text'], true);
            }else{
                v.updated = timeSince(pData.entry[vid].published['#text'], isLive);
            }
            
            v.videoId = pData.entry[vid].id['#text'].slice(9);
            v.viewcount = parseInt(pData.entry[vid]['media:group']['media:community']['media:statistics']['@attributes'].views);
            v.watched = false;
            vids.push(v);
        }
    }
    return vids;
}

// basically do teleStart() again, but instead of initlizing
// if any new vidoes found, add them to the correct places
// returns : promise to get more videos and organize
function teleUpdate(){
    
    updateStatus('Called teleUpdate()');
    
    mLatestVideoList = [];
    mTrendingVideoList = [];
    
    var prom = promiseToGetVideos(timeouts.updateVideoTimeout);
    
    return Promise.all(prom).then(function() {
        updateStatus('all teleUpdate() promises resolved');

        //vidoes are organized in mVideoDict and mCategoryDict as their promises resolve in promiseToGetVideos()

        // organize latest videos 
        for(var v in mAllVideosList){
            // if it's less than an cutoff hours old, put in in the latestVideosList
            if(mAllVideosList[v].updated.olderThanCutoff == false){
                mLatestVideoList.push(mAllVideosList[v]);
            }    
        }
        mLatestVideoList.sort(byPublishedDate);

        // organize most trending videos
        mTrendingVideoList = mLatestVideoList.slice(0);
        mTrendingVideoList.sort(byViewCount);
        mTrendingVideoList = mTrendingVideoList.slice(0, 50);  
        
    });
}

// main function to run the site on first page load
// calls promiseToGetVideos() to get videos
// once those promises resolve, consolidates video data
// from : document.ready()
// returns : promise to get videos and organize them
function teleStart(){

    updateStatus('Called teleStart()');
    
    var prom = promiseToGetVideos(0);
    
    prom.push(loadScript('https://www.youtube.com/iframe_api'));

    // initilize mCategoryDict
    for(var c in categories){
        mCategoryDict[categories[c].category] = [];
    }
    
    // initilize the mVideoDict
    for(var m in mChannelDict){
        mVideoDict[m] = [];
        
        // if channel has a hardcoded live video from video_lists.js, add it in
        for(var lv in hardcodedVideosListCopy){
            if (hardcodedVideosListCopy[lv].chid == m) {
                mVideoDict[m].push(hardcodedVideosListCopy[lv]);
            } 
            
            // TVMosaic specific, add in hardcoded live videos to category
            if(hardcodedVideosListCopy[lv].updated.ago == 'LIVE' && (containsVid(hardcodedVideosListCopy[lv].videoId, mCategoryDict['live']) == -1)){
                mCategoryDict['live'].push(hardcodedVideosListCopy[lv]);           
            }
        }
        
        
    }
    
    return Promise.all(prom).then(function() {  // NOTE: this is only run once
     
        updateStatus('teleStart() get video promises all resolved');
        
        //vidoes are organized in mVideoDict and mCategoryDict as their promises resolve in promiseToGetVideos()

        // organize latest videos 
        for(var v in mAllVideosList){
            // if it's less than an cutoff hours old, put in in the latestVideosList
            if(mAllVideosList[v].updated.olderThanCutoff == false){
                mLatestVideoList.push(mAllVideosList[v]);
            }    
        }
        mLatestVideoList.sort(byPublishedDate);
        
        // organize most trending videos
        mTrendingVideoList = mLatestVideoList.slice(0);
        mTrendingVideoList.sort(byViewCount);
        mTrendingVideoList = mTrendingVideoList.slice(0, 50);
        
        // sort all videos by newest published to oldest published
        // would make sense just to sort mLatestVideoList, but the videos in the channel listings
        // wouldn't be ordered by published date (?)
       // mAllVideosList.sort(byPublishedDate);
                
        // initilize first playlist
        if(mLatestVideoList.length != 0){
            mCurrentList = mLatestVideoList;
        }else{
            mCurrentList = mTrendingVideoList;
        }

        // flag ready for player to play
        // will not launch big youtube player from here
        // instead, big youtube player will launch when it's 'onReady' event is fired in setupPlayer()
        // if readyForPlayer is true when 'onReady' fired, it will remove loading screen and launch site
        // if 'onReady' fired before this function finished, onReadyVideo() will loop until readyForPlayer is true
        // if mLatestVideoList is empty, will reload the page
        // that probably means the timeouts.getVideoTimeout variable is too small
        if(mAllVideosList.length > 0){
            readyForPlayer = true; 
            updateStatus('teleStart() finished with at least 1 video');
        }else{
            updateStatus('teleStart() finished with 0 videos, reloading page after 150ms....');
            setTimeout(window.location.reload(), 150);
        }
        
    });
}

// check if a list of video objects has a certain video object
// if it does, it returns index of said object
// if not returns -1
function containsVid(videoIdToCheck, list) {
    
    for(var i = 0; i < list.length; i++) {
        if (list[i].videoId == videoIdToCheck) {
            return i;
        }
    }
    return -1;
}
    
// convert minutes to milliseconds 
function minToMilli(time){
    return time*60000;
}

// convert youtube data published time to something useful
/* returns : { 
            'ago': time ago as readable string, 
            'published' : when video was published (the YT published date string)
            'olderThanCutoff': true if, false if not
            }
*/
function timeSince(date, isLive) {

    var sinceDate = (new Date() - Date.parse(date));
    var timeSince = {};
    var cutoff = sinceDate > timeouts.latestVideoHourCutoff * 60 * 60 * 1000;
    
    if(isLive == true){
        return {
            ago: 'LIVE',
            published: date,
            olderThanCutoff: cutoff
        };
    }
    
    var seconds = Math.floor(sinceDate / 1000);

    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return {
            ago: interval + " years ago",
            published: date,
            olderThanCutoff: cutoff
        };
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return {
            ago: interval + " months ago",
            published: date,
            olderThanCutoff: cutoff
        };
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return {
            ago: interval + " days ago",
            published: date,
            olderThanCutoff: cutoff
        };
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return {
            ago: interval + " hours ago",
            published: date,
            olderThanCutoff: cutoff
        };
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return {
            ago: interval + " minutes ago",
            published: date,
            olderThanCutoff: cutoff
        };
    }
    return {
        ago: Math.floor(seconds) + " seconds ago",
        published: date,
        olderThanCutoff: cutoff
    };
}

// for debugging purposes
function updateStatus(newStatus){
    window.tvmosaic_status = newStatus;
    window.tvmosaic_allstatus.push(newStatus);
    //console.log(newStatus);
}

// sort videos, from newest to oldest
function byPublishedDate(a, b) {
    return ( a.updated.published < b.updated.published ? 1 : -1);
}

// sort videos, highest viewcount to lowest
function byViewCount(a, b) {
    return ( a.viewcount < b.viewcount ? 1 : -1);
}
        
// bake a cookie
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

// take cookie out of the jar
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// check if the use is on mobile or not
// true if on mobile, false if on desktop
function checkIfMobile(){
    var isMobile = {
        Android:    function() { return navigator.userAgent.match(/Android/i);          },
        BlackBerry: function() { return navigator.userAgent.match(/BlackBerry/i);       },
        iOS:        function() { return navigator.userAgent.match(/iPhone|iPad|iPod/i); },
        Opera:      function() { return navigator.userAgent.match(/Opera Mini/i);       },
        Windows:    function() { return navigator.userAgent.match(/IEMobile/i);         },
        any:        function() {
            return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
        }
    };

    return (typeof window.orientation !== 'undefined' ? true : (isMobile.any() !== null) );
}

function setColorClasses(){
    for(var c in colorConfig){
        $('.'+c).css(colorConfig[c][0], colorConfig[c][1]);
    }
}

// return promise to load script
// url can be 1 url or array
function loadScript(url) {

    if(Array.isArray(url)) {
        var self = this, prom = [];
        url.forEach(function(item) {
            prom.push(self.loadScript(item));
        });
        return Promise.all(prom);
    }

    return new Promise(function (resolve, reject) {
        var r = false,
            t = document.getElementsByTagName("script")[0],
            s = document.createElement("script");

        s.type = "text/javascript";
        s.src = url;
        s.async = true;
        s.onload = s.onreadystatechange = function () {
            if (!r && (!this.readyState || this.readyState == "complete")) {
                r = true;
                resolve(this);
            }
        };
        s.onerror = s.onabort = reject;
        t.parentNode.insertBefore(s, t);
    });

}

function checkBrowserVersion(){
    var ua= navigator.userAgent, tem, 
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return M.join(' ');
}

//hide the loading screen by animating it off the screen
// from : releAuth() 
function hideLoadingScreen() {
    $('#loadingScreen').fadeOut( 1000, "linear" );
// console.log('hide loading called');
}

// increment the loading bar while the 'GET videos' request working
function incrementLoadingBar() {
    var c = $('#loadingProgress').width();
   // console.log('CURRENT WIDTH = '+c);
    $('#loadingProgress').hide().show().width(c + incWidth + 'px');
}

// when inital DOM loads
$(document).ready(function(){
        
    // calculate width to increment loading progress (relative to screen size, so done after DOM loads)
    incWidth = ((2*$('#loadingBar').width())-$('#loadingBar').outerWidth())/(Object.keys(mChannelDict).length);
    
    updateStatus('document.ready() called');
        
    if(checkIfMobile() == false){ // meaning to load desktop stuff
    
        /* currently done by a script tag in index.html
        // load addional scripts if in IE
        var bv = checkBrowserVersion();
        if(bv == "IE 11" || bv == "MSIE 10" || bv == "MSIE 9" || bv == "MSIE 10"){
            var iepromisetag = document.createElement('script');
            tag.src = "promise.js";
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);        
        }
        if(bv == "IE 8"){
            var ie8promisetag = document.createElement('script');
            tag.src = "promise_ie8.js";
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);       
            var ie8bindtag = document.createElement('script');
            tag.src = "bind.js";
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);       
        }
        */

        // show desktop HTML
        $('#ReleTVDesktopWrapper').show();

        // initilize pretty scrollbars
        $('.fakeScroll').fakeScroll();
            
        // setup various UI elements
        $('#mosaicWrapper').hide();
        $('#allChannelsBox').hide();
        $('#videoSearchBox').hide();
        $('#leftListLatestTab').addClass('colTabSelected');
        $('#leftListTrending').hide();
        configureAds();
        var w = loadChannelCategories();

        Tooltip.init();
        $('#loadingLogo').css('background-image', 'url("'+logo+'")');
        $('#leftListLogo').css('background-image', 'url("'+logo+'")');
        $('#homeChannelButton').addClass('selectedChannelControlButton');
        $('#allChannelsButton').removeClass('selectedChannelControlButton');

        // if an ad loaded, show extra buttons
        if($('.atf728x90').has('iframe').length != 0){
            $('#refreshButtonTwo').show();
            $('#searchButtonTwo').show();
            $('.atf728x90').css('padding', '8px 0 8px 0');
        }
        
        delegateDesktopControls();
        
        $('.colTab[count='+w+']').click();

        updateStatus('document.ready() finished');
    
        // having the videos and the DOM load at the same time makes sense, but leads too all 
        // sorts of complications with the loading squence
        // need to figure out how to make document.ready() into a promise, so it can be added
        // to the Promise.all() thing in teleStartDesktop()
        teleStartDesktop();
    

    }else{ // meaing to load mobile stuff
    
        // first load addional mobile scripts
        loadScript(['jquery.mobile-1.4.5.min.js','pep.js']).then(function(){
    
            var tag = document.createElement('link');
            tag.rel = "jquery.mobile-1.4.5.min.css";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
            // show mobile HTML
            $('body').attr('id', 'mobileBody');
            $('#ReleTVMobileWrapper').show();
        
            // setup various UI elements
            $('#induvidualVideo').hide();
            $('#loadingLogo').css('background-image', 'url("'+logo+'")');
            $('#logo').css('background-image', 'url("'+logo+'")');

            // load 'pull to refresh'
            $('#mainListTitle').pep({
                axis: "y",
                easeDuration: 0, 
                cssEaseString: 'cubic-bezier(0.875, 0.215, 0.600, 0.815)',
                useCSSTranslation: false,
                removeMargins: false,
                constrainTo: 'parent',
                startPos: {left: null, top: 0},
                drag: handlePull,
                stop: function(ev, obj){ hidePull(ev, obj); }, 
            //  rest: function(ev, obj){ returnToTop(ev, obj) }
            });
              
            delegateMobileControls();
        
            // deal with orientation if changed
            $(window).on("orientationchange",function(event){
                if($('#ReleTVMobileWrapper').hasClass('landscape')){
                    $('#ReleTVMobileWrapper').removeClass('landscape');
                    $('#ReleTVMobileWrapper').addClass('portrait');
                }else{
                    $('#ReleTVMobileWrapper').removeClass('portrait');
                    $('#ReleTVMobileWrapper').addClass('landscape');
                }
            }); 
        
            // get initial orientation
            try {
                if (window.screen.orientation === undefined) {
                    window.screen.orientation = {};   //lets initialize them
                }
                window.screen.orientation.angle = window.orientation;
                switch(window.screen.orientation.angle)
                {  
                    case -90:
                    case  90:
                        $('#ReleTVMobileWrapper').addClass('landscape');
                        break;
                    default:
                        $('#ReleTVMobileWrapper').addClass('portrait');
                        break;
                }
            }catch (e) { console.log('ALERT: unable to determine screen orientation'); } //ignore -- if this option does not exist
      

            updateStatus('document.ready() finished');

            // having the videos and the DOM load at the same time makes sense, but leads too all 
            // sorts of complications with the loading squence
            // need to figure out how to make document.ready() into a promise, so it can be added
            // to the Promise.all() thing in teleStartMobile()
            teleStartMobile();
            
        }); // end .then of mobile script loading promise
    } // end if/else of desktop/mobile 
    
    

}); // end document.ready()

//================================================================
//                                  DESKTOP VARS AND FUNCTIONS 
//================================================================

var livePlayers = [];                // hold the YT.player objects used in the mosaic 
var livePlayerTiles = [];            // holds all the DOM tiles that hold the YT.players used in the mosaic
var playingID = null;                // current mosiac tile being played
var numberOfTilePlayers =   -1;      // counter for creating mosiac players
var initialnumberOfTilePlayers = 14; // total number of players to initially make, 0 to 14, meaning there are 15 players
var updateVideoIntervalTimer = '';   // timer to hold updating of videos interval
var mCurrentList = [];               // list of videos to playlist through
var mCurrentChannel = '';            // current channel being viewed, 'latest' if watching leftListLatest videos, 'trending' if leftListTrending vidoes

// from : called every updateVideoInterval cookie period, interval set in teleStartDesktop()
// from : click on 'refresh' button in control box to left of channel listings
function teleUpdateDesktop(){
    
    updateVideoIntervalTimer = clearInterval(updateVideoIntervalTimer); // pause interval
    $('#refreshButton').prop("disabled",true);
    $('#refreshButtonTwo').prop("disabled",true);
    $('#refreshButton > p').text('Updating');
    $('#refreshButton > i').addClass('fa-spin');
    $('#refreshButtonTwo > i').addClass('fa-spin');

    teleUpdate().then(function(){
    
        fillLeftLists();
        
        // update channel listings
        updateChannelListingsColumn();
        
        highlightCurrentVideo(mCurrentVideoId);

        // fill all channels box
        fillAllChannelsBox();

        //enable all show mosaic buttons if mosaic loaded
        if(numberOfTilePlayers >= initialnumberOfTilePlayers){
            $('.channelBoxShowmore').addClass('channelBoxShowmoreLoaded');
        }
      
        $('#refreshButtonTwo > i').removeClass('fa-spin');
        $('#refreshButton > i').removeClass('fa-spin');
        $('#refreshButton > p').text('Update');
        $('#refreshButton').prop("disabled",false);
        $('#refreshButtonTwo').prop("disabled",false);
        
        // reset timer
        if(getCookie('updateVideoInterval') != '' && getCookie('updateVideoIntervalToggle') == 'enable'){
            updateVideoIntervalTimer = setInterval(teleUpdateDesktop, minToMilli(getCookie('updateVideoInterval')));
        }

    });
}

function teleStartDesktop(){
    teleStart().then(function(){
               
        //display vidoes in left lists
        fillLeftLists();

        // if latest is empty, show trending left list instead
        if(mLatestVideoList.length == 0){
            $('#leftListTrendingTab').click();
        }
        
        // fill channel listings, with column format, gleb
       // fillChannelListingsColumn();

        // fill all channels box
        fillAllChannelsBox();

        //load the back mosaic
        setTimeout(loadInitialMosaicCallback, 150);

        // load cookied settings
        // set theme (is this the best place to do this?)
        if(getCookie('lightToggle') == 'dark'){
            adjustLights();
            $('#lightToggle').prop('checked', true);
        }
        
        // set how often to call video update
        // updateVideoInterval cookie stores update interval time in minutes
        // set defaults
        updateVideoIntervalTimer = setInterval(teleUpdateDesktop, minToMilli(timeouts.updateVideoInterval)); 
        $('#updateVideoIntervalSetting').val(timeouts.updateVideoInterval);
        if(getCookie('updateVideoIntervalToggle') == ''){
            setCookie('updateVideoIntervalToggle', 'enable', 3600);
        }
        
        // set timer cookie value if present
        if(getCookie('updateVideoInterval') != ''){
            updateVideoIntervalTimer = setInterval(teleUpdateDesktop, minToMilli(getCookie('updateVideoInterval')));
            $('#updateVideoIntervalSetting').val(getCookie('updateVideoInterval'));
        }
                
        //if timer is disabled, disable stuff
        if(getCookie('updateVideoIntervalToggle') == 'disable'){
            $('#updateVideoIntervalToggle').prop('checked', false);
            $('#updateVideoIntervalSettingOption').hide();
            updateVideoIntervalTimer = clearInterval(updateVideoIntervalTimer);
        }
        
        // load latest mosaic first toggle, not complete
        if(getCookie('latestMosaicToggle') == 'enable'){
            $('#latestMosaicToggle').prop('checked', true);
            if(mCurrentVideoId != null){
                loadLatestMosaic();
            }
        }
        
        // auto play video toggle
        // default to it being on 
        $('#autoplayVideoToggle').prop('checked', true);
        if(getCookie('autoplayVideoToggle') == 'disable'){
            $('#autoplayVideoToggle').prop('checked', false);
        }

    });
}

// toggle having a channel saved in cookie
// toggle it's heart button/text being selected
// toggle it appearing in the saved channels tab
// from : click on save button in .channelBox
function toggleSaveAChannel(channelId){
    var cookie = getCookie('savedChannels');
    
    if(cookie == ""){
        setCookie('savedChannels', channelId, 3600); // add saved channel to cookie
        var ch = makeChannelListing(channelId);
        $('#favoritesColumn > .innerChannelBoxColumn > .scrollWrap > .scrollContent').append(ch); //append the constructed string
        if(numberOfTilePlayers > initialnumberOfTilePlayers){ // if mosaic is loaded, enable show mosaic button
            $('.channelBoxShowmore').addClass('channelBoxShowmoreLoaded');
        }
        $('.channelBox[chboxid='+channelId+']').find('.channelBoxSaveChannelTitle').text('Remove');
        $('.channelBox[chboxid='+channelId+']').find('.channelBoxSaveChannelButton').removeClass('extraText'); // highlight heart button
    }else{
        var cookies = cookie.split(','); 
        if($.inArray(channelId, cookies) == -1){ // add saved channel, dont' allow duplicates
            cookies.push(channelId);
            var ch = makeChannelListing(channelId);
            $('#favoritesColumn > .innerChannelBoxColumn > .scrollWrap > .scrollContent').append(ch); //append the constructed string
            if(numberOfTilePlayers > initialnumberOfTilePlayers){ // if mosaic is loaded, enable show mosaic button
                $('.channelBoxShowmore').addClass('channelBoxShowmoreLoaded');
            }
            $('.channelBox[chboxid='+channelId+']').find('.channelBoxSaveChannelTitle').text('Remove');
            $('.channelBox[chboxid='+channelId+']').find('.channelBoxSaveChannelButton').removeClass('extraText'); // highlight heart button
        }else{
            cookies.splice(cookies.indexOf(channelId), 1); //remove saved channel from cookie        
            $('.channelBox[chboxid='+channelId+']').find('.channelBoxSaveChannelTitle').text('Favorite');
            $('.channelBox[chboxid='+channelId+']').find('.channelBoxSaveChannelButton').addClass('extraText'); // de-highlight heart button
            $('#favoritesColumn > .innerChannelBoxColumn > .scrollWrap > .scrollContent > .channelListing[clistid='+channelId+']').remove();
        }
        setCookie('savedChannels', cookies.join(','), 3600);
    }
    
}

//mini jQuery 'plugin' to click toggle between two functions
jQuery.fn.clickToggle = function(a, b) {
    function cb() {
        [b, a][this._tog ^= 1].call(this);
    }
    return this.on("click", cb);
}

// fills the 'All Channels' box
// displayed when the 'All Channels' Button clicked in left control bar
// from : document.ready(), teleUpdateDesktop()
function fillAllChannelsBox(){
    for(var ch in mChannelDict){
        if(mVideoDict[ch].length != 0 && $('.allChannelListing[clistid='+ch+']').length == 0){
            // some data
            var chdata = mChannelDict[ch];

            var allChannelListing = '';
            allChannelListing += '<li class="allChannelListing tileColor" clistid="'+chdata.id+'">'
                            +     '<div class="allChannelBox" chboxid="'+chdata.id+'">'
                            +        '<div class="allChannelBoxLeft">'
                            +           '<img src="'+chdata.thumbnail+'" class="allChannelImage">'
                            +        '</div><div class="allChannelBoxRight">'
                            +           '<p class="allChannelTitle mainText">'+chdata.title+'</p>'
                            +        '</div>'
                            +     '</div>'
                            +     '<div class="channelBoxShowmore">'
                            +       '<div class="channelShowmoreButton subText">&#x25a0;&#x25a0;&#x25a0;<br />&#x25a0;&#x25a0;&#x25a0;<br />&#x25a0;&#x25a0;&#x25a0;</div>'
                            +       '<p class="channelShowmoreTitle subText">Show Mosaic</p>'
                            +     '</div>'
                            +     '</li>';
            $('#allChannelsBoxList > div.scrollWrap > div').append(allChannelListing);
        }
    }

}

// add logic on controls to 'search' from right bottom control box
// from : document.ready()
function searchForVideos(searchValue){
    
    function generateVideoSearchResult(vid, typeOfResult){
        var searchResult = '';
        if(typeOfResult == 'ReleTVResult'){
            searchResult = '<li class="videoSearchResult tileColor '+typeOfResult+'" vid="'+vid.videoId+'" chid="'+vid.chid+'">'+
                        '<div class="videoSearchResultThumbnailWrapper">'+
                            '<img class="videoSearchResultThumbnail" src="'+vid.thumbnail+'">'+
                        '</div>'+
                        '<div class="videoSearchResultRight">'+
                            '<p class="videoSearchResultTitle mainText">'+vid.title+'</p>'+
                            '<p class="videoSearchResultDate subText">'+vid.updated.ago+' | '+mChannelDict[vid.chid].title+'</p>'+
                        '</div>';
        }else{
            searchResult = '<li class="videoSearchResult tileColor '+typeOfResult+' " vid="'+vid.videoId+'">'+
                        '<div class="videoSearchResultThumbnailWrapper">'+
                            '<img class="videoSearchResultThumbnail" src="'+vid.thumbnail+'">'+
                        '</div>'+
                        '<div class="videoSearchResultRight">'+
                            '<p class="videoSearchResultTitle mainText">'+vid.title+'</p>'+
                            '<p class="videoSearchResultDate subText">'+vid.updated.ago+' | '+vid.chtitle+'</p>'+
                        '</div>';
        }
        searchResult+= '<div class="videoSearchResultTip">'
                            +       '<p class="channelTipTitle mainText">'+vid.title+'</p>'
                            +       '<div class="tipThumbnailWrap">'
                            +               '<img class="tipThumbnail" src="'+vid.thumbnail+'"/>'
                            +       '</div>'
                            +       '<p class="tipDesc mainText">'+vid.description+'</p>'
                            +    '</div>'
                            + '</div>'
                            +'</li>';
        $('#videoSearchBoxList > div.scrollWrap > div').append(searchResult);
    }
    // take value in search box, hide all channels boxes with value not in title
    if(searchValue != ""){
            listicorVids = [];
           $('#videoSearchBoxList > div.scrollWrap > div').empty();
           
            // first, see if there are any matching videos already on the site
            for(var v in mAllVideosList){
                var textCheck = mAllVideosList[v].title.indexOf(searchValue);
                if(mAllVideosList[v].description){
                    textCheck += mAllVideosList[v].description.indexOf(searchValue);
                }
                if((textCheck >= 0)){
                    generateVideoSearchResult(mAllVideosList[v], 'ReleTVResult');
                }

            }
            
            // next, try to grab some videos from listicor
            var getURL = 'https://listicor.com/listicles_api?q='+searchValue+'+tag%3A__d__youtube&l='+listicorVidsLimit+'&video=1';
            var getP = Promise.resolve($.get(getURL)).then(function(data){
                for(var d in data.res_list){
                    var listicorVideo = {};
                    //listicorVideo.chid = data[d].uu.substring(0, data[d].uu - 24);
                    listicorVideo.chtitle = data.res_list[d].un;
                    listicorVideo.description = data.res_list[d].s;
                    listicorVideo.thumbnail = data.res_list[d].iu;
                    listicorVideo.title = data.res_list[d].t;
                    listicorVideo.updated = timeSince(data.res_list[d].pu, false);
                    listicorVideo.videoId = data.res_list[d].au.substring(data.res_list[d].au.length - 11, data.res_list[d].au.length);
                    //listicorVideo.viewcount = data[d];
                    listicorVids.push(listicorVideo);
                    generateVideoSearchResult(listicorVideo, 'listicorResult');
                }
                // load colors
                
            }); 
        

            // load colors
            
        }
    

}

// construct the category tabs from the 'categories' in config.js
// construct the category columns from the 'categories' in config.js
// from : document.ready()
// TODO: add controls to scale size of tabs depending on how many there are
//          currently only 7 max fit on standard desktop size
function loadChannelCategories(){
    
    // construct
    var counter = 0;
    var whichToShowFirst = 0;
    for(var c in categories){
        var tabinfo = categories[c];
        
        // get which one to show first
        if(tabinfo.showFirst == 'true'){
            whichToShowFirst = counter;
        }
        
        var tabTitleClass = 'extraText';
        if(tabinfo.category == 'live'){
            tabTitleClass = '';
        }
        var tab = '<div id="'+tabinfo.category+'Tab" class="colTab secondLevel" count="'+counter+'" category="'+tabinfo.category+'" style="z-index: '+(categories.length - counter)+';">'+
                    '<div class="colTitleTitle">'+
                        '<p class="'+tabTitleClass+'">'+tabinfo.title+'</p>'+
                        '<img src="'+tabinfo.icon+'">'+
                    '</div>'
                  '</div>';
        $('#channelsBoxTabs').append(tab);
       
        // if the category has not box (as in this category will not store on channels), mark tab, skip making channel box
        if(tabinfo.nobox != 'false'){
            $('#'+tabinfo.category+'Tab').attr('onclick', tabinfo.nobox+'()');
            counter+=1;
            continue;
        }

        var additional = '';

        // extra thing for favorites
        if(tabinfo.category == 'favorites'){
            additional = '<p id="noChannelsSaved">You have no channels saved!</p>';
        }
        
        var column = '<div id="'+tabinfo.category+'Column" class="channelBoxColumn" count="'+counter+'" category="'+tabinfo.category+'">'+
                        '<ul class="innerChannelBoxColumn fakeScroll">'+additional+'<!--Channel Listings will load here--></ul>'+
                     '</div>';
       
        $('#channelsBox').append(column);
        counter+=1;
    }

    // initilize the pretty scroll bar in each column
    $('.fakeScroll').fakeScroll();
    
    // first category displayed only
    return whichToShowFirst;
}

// as a promiseToGetVideos promise to get videos for a channel resolves, display it in right channel box
// from : promiseToGetVideos()
function appendChannelListing(c){
    if (mVideoDict[c].length != 0) {
        var chdata = mChannelDict[c];
        var ch = makeChannelListing(c);
                
        // add it to correct channel column 
        $('#' + chdata.category + 'Column > .innerChannelBoxColumn > .scrollWrap > .scrollContent').append(ch); //append the constructed string
    
        // check if it's in the savedChannels cookie, if so, highlight it's heart button and add to saved column
        var cookiedChannels = getCookie('savedChannels');
        if(cookiedChannels != ""){
            cookiedChannels = cookiedChannels.split(',');
            if($.inArray(c, cookiedChannels) != -1){
            $('#favoritesColumn > .innerChannelBoxColumn > .scrollWrap > .scrollContent').append(ch); //append the constructed string
                $('.channelBox[chboxid='+c+']').find('.channelBoxSaveChannelButton').removeClass('extraText');  // highlight heart button
                $('.channelBox[chboxid='+c+']').find('.channelBoxSaveChannelTitle').text('Remove');
            }
        }
    }
}

// makechannel listings (row that includes channel title box + first 4 channel videos)
// if channel has a live stream, will make it the first video box
// parameters : channelId, channel to make listing for
// from : fillChannelListingsColumn
// returns : DOM element .channelListing (row in right bottom box);
function makeChannelListing(channelId) {

    // some data
    var chdata = mChannelDict[channelId]; 

        var channelListing = '';
        channelListing += '<li class="channelListing" clistid="'+chdata.id+'">'
                       +     '<div class="channelBox secondLevel" chboxid="'+chdata.id+'">'
                       +        '<div class="channelBoxLeft">'
                       +           '<img src="'+chdata.thumbnail+'" class="channelImage">'
                       +        '</div><div class="channelBoxRight">'
                       +           '<p class="channelTitle">'+chdata.title+'</p>'
                       +        '</div>'
                       +        '<div class="channelBoxSaveChannel"><i class="fa fa-heart channelBoxSaveChannelButton extraText" aria-hidden="true"></i><p class="channelBoxSaveChannelTitle extraText">Favorite</p></div>'
                       +        '<div class="channelBoxShowmore">'
                       +            '<div class="channelShowmoreButton extraText">&#x25a0;&#x25a0;&#x25a0;<br />&#x25a0;&#x25a0;&#x25a0;<br />&#x25a0;&#x25a0;&#x25a0;</div>'
                       +            '<p class="channelShowmoreTitle extraText">Show Mosaic</p>'
                       +        '</div>'
                       +     '</div><div class="channelVideos">';
        for (var vi = 0; vi < 4; vi++) {
            if (mVideoDict[channelId] && mVideoDict[channelId][vi]) {
                var the_video     = mVideoDict[channelId][vi];
                var is_live_icon  = '';
                var is_live_class = '';
 
                if (the_video.updated.ago == 'LIVE') {
                    is_live_icon  = ' \u25CF';
                    is_live_class = 'channelLiveStream ';
                }else{
                    is_live_class = 'mainText';
                }

                channelListing += '<div chlistvidid="'+the_video.videoId+'" class="channelVideoForListing backgroundColor">'
                                +    '<div class="channelVideoForListingTip">'
                                +       '<p class="channelTipTitle mainText">'+the_video.title+'</p>'
                                +       '<div class="tipThumbnailWrap">'
                                +               '<img class="tipThumbnail" src="'+the_video.thumbnail+'"/>'
                                +       '</div>'
                                +       '<p class="tipDesc mainText">'+the_video.description+'</p>'
                                +    '</div>'
                                +    '<p class="'+is_live_class+' channelVideoTitleForListing">'+the_video.title + is_live_icon+'</p>'
                                +    '<p class="channelVideoForListingWatched mainText">Watched</p>'
                                + '</div>';             
            }
        }
        channelListing +='</div><div class="scrollChannelListing secondLevel"><i class="fa fa-angle-up extraText scrollChannelListingUp" aria-hidden="true"></i><i class="fa fa-angle-down extraText scrollChannelListingDown" aria-hidden="true"></i></div>';
    channelListing += '</li>'; // closing div.channelVideos && the li.channelListing

    return channelListing;
}

// from the updated video data from teleUpdateDesktop()
// update the current channel listings
// from : teleUpdateDesktop()
function updateChannelListingsColumn(){
    for (var c in mChannelDict) { //grabs each key in mChannelDict name as c
          if (mVideoDict[c].length != 0) {
              
            // if it's a new channel listing, that timeed out on page load, make new one and append
            // otherwise, update it's first 4 vidoes display
            if($('.channelListing[clistid="'+c+'"]').length == 0){
                appendChannelListing(c);
            }else{
                updateChannelListingsVideos(c);
            }
        }
    }
}

// from updateChannelListingsColumn
// to update the first 4 videos in already exsissting channel listings
function updateChannelListingsVideos(channelId){

    $('.channelListing[clistid="'+channelId+'"]').find('.channelVideos').empty();
    var newChannelVideos = '';
    for (var vi = 0; vi < 4; vi++) {
        if (mVideoDict[channelId] && mVideoDict[channelId][vi]) {
            var the_video     = mVideoDict[channelId][vi];
            var is_live_icon  = '';
            var is_live_class = '';
            if (the_video.updated.ago == 'LIVE') {
                is_live_icon  = ' \u25CF';
                is_live_class = 'channelLiveStream ';
            }else{
                is_live_class = 'mainText';
            }
            var ifWatched = '';
            if(the_video.watched == true){
                ifWatched = 'display: block;';
            }  
            newChannelVideos += '<div chlistvidid="'+the_video.videoId+'" class="channelVideoForListing backgroundColor">'
                            +    '<div class="channelVideoForListingTip">'
                            +       '<p class="channelTipTitle mainText">'+the_video.title+'</p>'
                            +       '<div class="tipThumbnailWrap">'
                            +               '<img class="tipThumbnail" src="'+the_video.thumbnail+'"/>'
                            +       '</div>'
                            +       '<p class="tipDesc mainText">'+the_video.description+'</p>'
                            +    '</div>'
                            +    '<p class="'+is_live_class+' channelVideoTitleForListing">'+the_video.title + is_live_icon+'</p>'
                            +    '<p class="channelVideoForListingWatched mainText" style="'+ifWatched+'">Watched</p>'
                            + '</div>';
                                
            if(the_video.watched == true){
                $(newChannelVideos).find('.channelVideoForListingWatched').show();
            }                
        }
    }
    $('.channelListing[clistid="'+channelId+'"]').find('.channelVideos').append(newChannelVideos);
        
}

// stop all videos in mosaic, hide it, show big player
function closeMosaic(){
    
    // close the mosaic
    if($('#mosaic').css('display') != 'none'){
        // there might be a faster way to do this...
        for (var p=0; p<livePlayers.length; p++) {
            if(livePlayers[p].getPlayerState() == 1 || livePlayers[p].getPlayerState() == 3){
                livePlayers[p].pauseVideo();
            }
        }
        $('.tile').show();
        $('#mosaicWrapper').hide();
        $('#utplayerdivdesktopWrapper').show();
    }
    
    // reset show mosaic buttons
    $('.channelShowmoreTitle').text('Show Mosaic');
}

// load the live videos into a mosaic
function loadLiveMosaic(){ 
    loadMosaic('live');
} 

// load latest videos into a mosaic
function loadLatestMosaic(){
    loadMosaic('latest');
}

// load recenently watched videos into a mosaic
function loadRecentlyWatched(){
    loadMosaic('recentWatched');
}

// load and display a mosaic for a particular channel
// from : click on channel box in right bottom channel listings
// parameters : channelId, channel to generate mosaic for
//              'latest' if for latest, 'trending' for trending, 'recentWatched' for recenently wathced, 'live' for live
function loadMosaic(channelId){
     
    //setup
    var listToLoad = [];
    $('.tile').hide(); 
    $('#mosaicTitle > p').removeClass('liveMosaicTitle');
    $('.channelShowmoreTitle').text('Show Mosaic');

    if(channelId == 'latest'){
        $('#mosaicTitle > p:nth-child(2)').text('Latest');
        listToLoad = mLatestVideoList;
    }else if(channelId == 'trending'){
        $('#mosaicTitle > p:nth-child(2)').text('Trending');
        listToLoad = mTrendingVideoList;
    }else if(channelId == 'recentWatched'){
        $('#mosaicTitle > p:nth-child(2)').text('Just Watched');
        listToLoad = mRecentWatchedList;
    }else if(channelId == 'live'){
        $('.tile').attr('vid','');
        $('#mosaicTitle > p:nth-child(2)').text('Live Now \u25CF').addClass('liveMosaicTitle');
        listToLoad = mCategoryDict['live'];
    }else{
        // set clicked button text 
        $('.channelBox[chboxid='+channelId+']').find('.channelShowmoreTitle').text('Hide Mosaic');
        $('.allChannelListing[clistid='+channelId+']').find('.channelShowmoreTitle').text('Hide Mosaic');
        $('#mosaicTitle > p:nth-child(2)').text(mChannelDict[channelId].title);
        listToLoad = mVideoDict[channelId];
    }


    for(var v in listToLoad){
        var tile = livePlayerTiles[v];
        tile.attr('vid', listToLoad[v].videoId);
        tile.attr('chid', listToLoad[v].chid);
        tile.children('.tileTimeAgo').text(listToLoad[v].updated.ago);
        tile.children('.tileViewCount').text(listToLoad[v].viewcount + ' views');
        if(listToLoad[v].updated.ago == 'LIVE'){
            tile.children('.tileViewCount').text('');
        }
        tile.children('.tileTitle').text(listToLoad[v].title);
        tile.children('.tileChannelImg').attr('src', mChannelDict[listToLoad[v].chid].thumbnail);
        if(listToLoad[v].watched == true){
            tile.children('.tileWatched').show();
        }
        livePlayers[v].cueVideoById(listToLoad[v].videoId);
    }
        
    for(var i = 0; i < listToLoad.length; i++){
        if($('.tile[count='+i+']').attr('vid') != ''){
            $('.tile[count='+i+']').show();
        }
    }
        
    mUTPlayer.pauseVideo();
    $('#utplayerdivdesktopWrapper').hide();
    $('#mosaicWrapper').show();
}

// generate a mosiac tile and YT player inside it
// appends it to #mosaic and increments numberOfTilePlayers
// from : loadInitialMosaicCallback(), loads initialnumberOfTilePlayers number of players
// from : loadMosaic() or loadLiveMosaic() if addional tiles need to be loaded
// parameters : thisManyMore, how many more mosaic tiles to load
// returns : array of promises to load given amount of tiles
// TODO: this function is useful, consolidate with loadInitialMosaicCallback
// TODO: this function makes me worry about it's stability, not tested very well
function loadMoreMosaicTiles(thisManyMore){
    var promises = [];
    for(var i = 0; i < thisManyMore; i++){
        var p = new Promise(function(resolve, reject){
            numberOfTilePlayers+=1;
            var tile = $(document.createElement('div')).addClass('tile').attr('id', 'mosaicTile'+numberOfTilePlayers).attr('count', numberOfTilePlayers).attr('vid','').click(function(){
                setCurrentList($(this).attr('chid'));
                video2play($(this).attr('vid'));
                //if the mosaic is open, close it
                closeMosaic();
            });
            var tileTitle = $(document.createElement('p')).addClass('tileTitle');
            var tileChannelImg = $(document.createElement('img')).addClass('tileChannelImg');
            //.attr('width', '385').attr('height', '230') <- width+height have to be set to avoid POSTmessage error
            var mosaicTilePlayerHolder = $(document.createElement('div')).attr('id', 'mosaicTilePlayer'+numberOfTilePlayers).addClass('mosaicTilePlayerHolder').attr('frameborder', '0');
            tile.append(mosaicTilePlayerHolder);
            tile.append(tileChannelImg);
            tile.append(tileTitle);
            livePlayerTiles.push(tile);
            tile.hide();
            $('#mosaic > .scrollWrap > .scrollContent').append(tile);

            // put a Youtube player and some controls into each tile
            livePlayers[numberOfTilePlayers] = new YT.Player('mosaicTilePlayer'+numberOfTilePlayers,{
                playerVars: {
                    rel: 0,
                    wmode: 'Opaque',
                    enablejsapi: 1,
                    showinfo: 0,
                    controls: 0,
                    autoplay: 0,
                    modestbranding: 1
                },
                events:{
                    'onReady':resolve
                }
            }); 
            livePlayerTiles[numberOfTilePlayers].mouseover(function() { // assigning a callback for this event
                var currentHoveredElement = $(this).attr('count');
                if (playingID){
                    livePlayers[playingID].stopVideo();
                }
                livePlayers[currentHoveredElement].playVideo();
                playingID = currentHoveredElement;
            });
        
            livePlayerTiles[numberOfTilePlayers].mouseleave(function(){
                    var currentHoveredElement = $(this).attr('count');
                    livePlayers[currentHoveredElement].stopVideo();
            });
        });
        promises.push(p);
   }
   return promises;

}

// load the initial mosaic, tiles and video players in them
// does it via a callback loop, instead of loading all at once, will load sequentially
// will enable 'watch live now', and 'show mosaic' buttons when done loading
// hidden on page load, reveal on channelbox click or watch live now click
// from : teleStartDesktop()
function loadInitialMosaicCallback(){
    
    if(!YT.Player){
        setTimeout(loadInitialMosaicCallback, 1000);
    }else{
    if(numberOfTilePlayers > initialnumberOfTilePlayers){
        
        // enable showing of mosaic buttons
        $('.channelBoxShowmore').addClass('channelBoxShowmoreLoaded');

        // enable 'watching live now' button
        // TODO: this is specific to TVmosaic
        // personally I think it's dumb to have the tabs that don't correspond to channel boxes
        $('#liveTab').addClass('mosaicTabLoaded');
        $('#latestTab').addClass('mosaicTabLoaded');
        $('#recentWatchedTab').addClass('mosaicTabLoaded');

        return;
    }else{
        
        numberOfTilePlayers+=1;
        
        // if 'latestMosaicToggle' toggled, factor in loading of tiles on loading screen
        if(getCookie('latestMosaicToggle') == 'enable'){
            incrementLoadingBar();
        }
        
        // TODO: update to plain text creation, instead of document.createElement
        var tile = $(document.createElement('div')).addClass('tile').addClass('tileColor').attr('id', 'mosaicTile'+numberOfTilePlayers).attr('count', numberOfTilePlayers).attr('vid','').attr('chid','').click(function(){
            setCurrentList($(this).attr('chid'));
            video2play($(this).attr('vid'));
            //if the mosaic is open, close it
            closeMosaic();
        });
        
        var tileTitle = $(document.createElement('p')).addClass('tileTitle').addClass('mainText');
        var tileWatched = $(document.createElement('p')).addClass('tileWatched').addClass('mainText').text('Watched');
        var tileTimeAgo = $(document.createElement('p')).addClass('tileTimeAgo').addClass('subText');
        var tileViewCount = $(document.createElement('p')).addClass('tileViewCount').addClass('subText');
        var tileChannelImg = $(document.createElement('img')).addClass('tileChannelImg');
        //.attr('width', '385').attr('height', '230') <- width+height have to be set to avoid POSTmessage error, I think
        var mosaicTilePlayerHolder = $(document.createElement('div')).attr('id', 'mosaicTilePlayer'+numberOfTilePlayers).addClass('mosaicTilePlayerHolder').attr('frameborder', '0');
        tile.append(mosaicTilePlayerHolder);
        tile.append(tileChannelImg);
        tile.append(tileTitle);
        tile.append(tileWatched);
        tile.append(tileViewCount);
        tile.append(tileTimeAgo);
        livePlayerTiles.push(tile);
        tile.hide();
        $('#mosaic > .scrollWrap > .scrollContent').append(tile);

        // put a Youtube player and some controls into each tile
        livePlayers[numberOfTilePlayers] = new YT.Player('mosaicTilePlayer'+numberOfTilePlayers,{
            playerVars: {
                rel: 0,
                wmode: 'Opaque',
                enablejsapi: 1,
                showinfo: 0,
                controls: 0,
                autoplay: 0,
                modestbranding: 1
            },
            events:{
                'onReady':loadInitialMosaicCallback
            }
        }); 
        
        livePlayerTiles[numberOfTilePlayers].mouseenter(function() { // assigning a callback for this event
            var currentHoveredElement = $(this).attr('count');
            if (playingID){
                 livePlayers[playingID].stopVideo();
            }
            livePlayers[currentHoveredElement].playVideo();
            playingID = currentHoveredElement;
        });
        
        livePlayerTiles[numberOfTilePlayers].mouseleave(function(){
                var currentHoveredElement = $(this).attr('count');
                livePlayers[currentHoveredElement].stopVideo();
        });
   }
    }
}

// construct and display the videos to be shown in the left list
// from : teleStartDesktop()
function fillLeftLists() {

    $('#leftListsWrapper ul > div > div').find('.chldiv').remove();
    
    // make tile and append to given list
    // vobj: video object, ch: channel object, whichList: 'leftListLatest' or 'leftListtrending'
    function appendLeftListTile(vobj, ch, whichList, order){
        var dd = vobj.description;
        if (vobj.description) {
            if (vobj.description.length > 250) {
                dd = vobj.description.substring(0, 250) + '...';
            }
        }
        var chld = '<li leftlistvidid="'+vobj.videoId+'" class="chldiv tileColor" style="order:'+order+'">'
                    +    '<div class="thumbnailBox">'
                    +        '<img src="'+vobj.thumbnail+'" class="thumbnailimg">'
                    +        '<p class="leftListWatched extraText">Watched</p>'
                    +    '</div>'
                    +    '<div class="chldMiddle">'
                    +        '<div class="chlimgcell">'
                    +            '<img src="'+ch.thumbnail+'" chid="'+ch.id+'" class="chlimg" chid="'+ch.id+'">'
                    +        '</div>'
                    +        '<div class="videotitle mainText">'+vobj.title+'</div>'
                    +    '</div>'
                    +    '<div class="videodesc subText">'+dd+'</div>'
                    +    '<div class="hoursago subText">'+vobj.updated.ago+'</div>'
                    +    '<div class="leftListViewCount subText">'+vobj.viewcount+' views</div>'
                    +'</li>';
                    
        if(vobj.watched == true){
            $(chld).find('.leftListWatched').show();
        }
        $('#'+whichList+' > .scrollWrap > .scrollContent').append(chld);
    }


    // fill latest left list
    // tiles should wrap themselves around the 300x250 ads defined in the DOM
    // since the 'order' property of the ads in calculated before these vidoes are added
    // flexbox takes care of wrapping videos correctly around the ads
    // ex: leftListAd1 is defined with order=2, the tile added here with order=2 will appear right after leftListAd1
    // also with the rules defined in configureAds()
    for (var i=0; i < mLatestVideoList.length; i++) {  
        appendLeftListTile(mLatestVideoList[i], mChannelDict[mLatestVideoList[i].chid], 'leftListLatest', i);
    } 

    // fill trending left list
    for (var i=0; i < mTrendingVideoList.length; i++) {
        appendLeftListTile(mTrendingVideoList[i], mChannelDict[mTrendingVideoList[i].chid], 'leftListTrending', i);
    }
    
    
} 

// scroll channelListing to current channel being played <- not completed
// highlight channel listing video box and title too
// also a convient play to highlight video's 'watched' display
function highlightCurrentVideo(videoId) {
    
    // update videos 'watched' display
    // in channel listings
    $('div[chlistvidid='+videoId+']').find('.channelVideoForListingWatched').show();
    // in the mosaics
    $('.tile[vidid='+videoId+']').find('.mosaicTileWatched').show();

    // remove previous styling
    //from left lists
    $('.chldiv.secondLevel').find('.videotitle').removeClass('extraText').addClass('mainText');
    $('.chldiv.secondLevel').find('.videodesc').removeClass('extraText').addClass('mainText');
    $('.chldiv.secondLevel').find('.hoursago').removeClass('extraText').addClass('mainText');
    $('.chldiv.secondLevel').find('.leftListViewCount').removeClass('extraText').addClass('mainText');
    $('.chldiv.secondLevel').addClass('tileColor').removeClass('secondLevel');;

    //from channel listing
    $('.channelListing').removeClass('highlightChannelListing');
    $('.channelVideoForListing.secondLevel').removeClass('secondLevel').addClass('backgroundColor');

    // add new styling
    //to channel listing
    $('div[chlistvidid='+videoId+']').removeClass('backgroundColor').addClass('secondLevel');
    $('div[chlistvidid='+videoId+']').closest('.channelListing').addClass('highlightChannelListing');

    //to left list
    if($('li[leftlistvidid='+videoId+']').length != 0){
        
        //highligth
        $('li[leftlistvidid='+videoId+']').removeClass('tileColor').addClass('secondLevel');
        $('li[leftlistvidid='+videoId+']').find('.videotitle').removeClass('mainText').addClass('extraText');
        $('li[leftlistvidid='+videoId+']').find('.videodesc').removeClass('mainText').addClass('extraText');
        $('li[leftlistvidid='+videoId+']').find('.hoursago').removeClass('mainText').addClass('extraText');
        $('li[leftlistvidid='+videoId+']').find('.leftListViewCount').removeClass('mainText').addClass('extraText');
        
        // updated watched display   
        $('li[leftlistvidid='+videoId+']').find('.leftListWatched').show();
        
        // scroll left list to vid
        var list = $('li[leftlistvidid='+videoId+']').closest('.scrollContent');
        $(list[0]).animate({
            scrollTop: $('#leftListLatest > div > div > li[leftlistvidid='+videoId+']').offset().top - $(list[0]).offset().top + $(list[0]).scrollTop()
        }, 'slow');
        $(list[1]).animate({
            scrollTop: $('#leftListTrending > div > div > li[leftlistvidid='+videoId+']').offset().top - $(list[1]).offset().top + $(list[1]).scrollTop()
        }, 'slow');
    }

}

// apply CSS classes to elements to give 'dark' theme
function adjustLights(){
    $('#leftSearchBox').toggleClass('darkenBack');
    $('#resultCount'  ).toggleClass('darkenBack');
    $('#rightBox'     ).toggleClass('darkenBack');
    $('.channelBoxColumn'  ).toggleClass('darkenBack');
    $('.channelVideoForListingTip').toggleClass('darkenBack');
    $('#allChannelsBoxSearch'  ).toggleClass('darkenBack');  
    $('.fakeScroll').toggleClass('darkenBack');
    $('#leftListsWrapper').toggleClass('darkenBack');
    $('#mosaicTitle').toggleClass('darkenBack');
    $('#videoSearchBoxSearch').toggleClass('darkenBack');
    $('.channelVideoForListing').toggleClass('darkenBack');
    $('.tile'  ).toggleClass('greyenBack');
    $('.chldiv').toggleClass('greyenBack');
    $('.allChannelListing').toggleClass('greyenBack');
    $('#utplayerdivdesktopWrapper').toggleClass('greyenBack');

    $('.videotitle'     ).toggleClass('whitenText');
    $('.videodesc'      ).toggleClass('whitenText');
    $('.tileTitle'      ).toggleClass('whitenText');
    $('.channelVideoTitleForListing').toggleClass('whitenText');
    $('.channelVideoForListingTip p').toggleClass('whitenText');
    $('#noChannelsSaved').toggleClass('whitenText');
    $('#leftListTitle').toggleClass('whitenText');
    $('#currentVideoTitle').toggleClass('whitenText');
    $('#mosaicTitle p').toggleClass('whitenText');

    $('.channelVideoTitleForListing::after').toggleClass('channelVideoTitleForListingDarkTheme');
}

// load the ad surronding the video player / mosaic
// if rightBoxAd1Flag == true, load 160x600 ad to the left of big player and mosiac NOTE: currently not implemented
// if rightBoxAd2Flag == true, load 160x600 ad to the right of big player and mosiac 
// if rightBoxBottomFlag == true, attempt to load 728x90 ad beneath video player and mosiac
// from : document.ready()
function configureAds(){
    // destroy 300x250ads if needed
    // TODO: generelize this to any amount of ads
    switch(adConfig.leftListAdMAX) {
        case 0:
            $('.leftListAd').remove();
            break;
        case 1:
            $('#leftListAd2').remove();
            $('#leftListAd3').remove();
            break;
        case 2:
            $('#leftListAd3').remove();
            break;
        default:
            break;
    }
    
    // configure leftListAd ordering
    $('.leftListAd').each(function(i){ 
        $(this).css('order', (i * adConfig.leftListAdEvery) + adConfig.leftListOffset);
    });    
    
    // destory 160x600ads if needed
    if (adConfig.rightBoxAd1Flag == false){
       // not defined in index.html yet $('#videoPlayerAdLeft').remove();
    }
    if (adConfig.rightBoxAd2Flag == false){
        $('#videoPlayerAdRight').remove();
    }
    
    // adjust video player/mosaic wrapper size
    if (adConfig.rightBoxAd1Flag ^ adConfig.rightBoxAd2Flag){ // if one 160x600 ad turned on
        $('#videoContentWrapper').addClass('one160x600AdEnabled');
    }
    if (adConfig.rightBoxAd1Flag == true && adConfig.rightBoxAd2Flag == true){ // if both 160x600 ads turned on
        $('#videoContentWrapper').addClass('two160x600AdEnabled');
    }

    //PBJS invocation for the 728x90 placement
    if (window.pbjs) {pbjs.que.push(function(){pbjs.getAdUnit('.atf728x90');});}
}

// group is the class selector for all tabs in group
// assumes that there is 1 'p' tag in each tab that is the title text
// specific tab is the tab to highlight
function toggleTab(group, specific){

    $(group+'.backgroundColor').find('p').removeClass('mainText');
    $(group+'.backgroundColor').find('p').addClass('extraText');
    $(group+'.colTabGradient').find('p').removeClass('mainText');
    $(group+'.colTabGradient').find('p').addClass('extraText');
    $(group).css('background','');
    $(group+'.backgroundColor').removeClass('backgroundColor').addClass('secondLevel');
    $(group+'.colTabGradient').addClass('secondLevel');
    $(group).removeClass('colTabSelected');
    $(group).removeClass('colTabGradient');
    
    $(specific).removeClass('secondLevel').addClass('backgroundColor');
    $(specific).find('p').removeClass('extraText');
    $(specific).find('p').removeClass('mainText');
    $(specific).addClass('colTabSelected');
    
    // so the tab icon is stil viewable
    if($(specific).hasClass('colTab')){
        $(specific).removeClass('backgroundColor');
        $(specific).addClass('colTabGradient');
        var back = $('.backgroundColor').css('background-color')
        var front = $('.secondLevel').css('background-color')
        var grad = 'linear-gradient(to right, '+back+' 0%, '+back+' 66%, '+front+' 98%, '+front+' 100%)';
        $(specific).css('background', grad);
    }
}

// function to hold all click events on desktop version
function delegateDesktopControls(){
    
    //~~~~~~~~~~~~~~~~~left list tab controls
    $('#leftListLatestTab').on('click', function(e){
        toggleTab('.leftListTab', this);
        $('#leftListTrending').hide();
        $('#leftListLatest').show();
        
    });
    $('#leftListTrendingTab').on('click', function(e){
        toggleTab('.leftListTab', this);
        $('#leftListLatest').hide();
        $('#leftListTrending').show();
    });
        
    //~~~~~~~~~~~~~~~~~~~Channel listings controls
    $('#channelsBox').on('click', 'div.channelBox', null, function(e){
        if($(e.target).hasClass('channelBoxSaveChannelTitle') || $(e.target).hasClass('channelBoxSaveChannelButton')){
            e.preventDefault();
            toggleSaveAChannel($(this).attr('chboxid'));
        }else{
            if(numberOfTilePlayers > initialnumberOfTilePlayers){
                if($(this).find('.channelShowmoreTitle').text() == 'Hide Mosaic'){
                    closeMosaic();
                    mUTPlayer.playVideo();
                }else{
                    loadMosaic($(this).attr('chboxid'));
                }
            }
        }
        /*
        if($(e.target).hasClass('channelBoxShowmoreLoaded')){

        }*/
  
                
    });
    $('#channelsBox').on('click', 'div.channelVideoForListing', null, function() {
        setCurrentList($(this).closest('.channelListing').attr('clistid'));
        video2play($(this).attr('chlistvidid'));
        //if the mosaic is open, close it
        closeMosaic();
    });

    $( '.channelVideos' ).bind( 'mousewheel DOMMouseScroll', function ( e ) {
        e.preventDefault();
    });
   
   //set universal DELEGATED binds for videos in the leftLists
    $('#leftListLatest > div.scrollWrap > div').on('click', 'li.chldiv', null, function() {
        setCurrentList('latest');
        video2play($(this).attr('leftlistvidid'));
        //if the mosaic is open, close it
        closeMosaic();
    });    
    $('#leftListTrending > div.scrollWrap > div').on('click', 'li.chldiv', null, function() {
        setCurrentList('trending');
        video2play($(this).attr('leftlistvidid'));
        //if the mosaic is open, close it
        closeMosaic();
    });    
    
    $('#channelsBox').on('mouseenter', 'div.channelVideoForListing', null, function(e){
        doTooltip(e, $(this).children('.channelVideoForListingTip')[0].outerHTML);
    });
    $('#channelsBox').on('mouseleave', 'div.channelVideoForListing', null, function(){
        hideTip();
    });

    //~~~~~~~~~~~~~~~~ extra buttons around 728x90 ad controls
    $('#refreshButtonTwo').click(function(){
         $('#refreshButton').click();
    });
    $('#searchButtonTwo').click(function(){
        $('#searchButton').click();
    });
    //~~~~~~~~~~~~~~~~channel tab controls
    $('.colTab').click(function(){
        if(!$(this).attr('onclick')){ // if category has channels associated with it
            toggleTab('.colTab', this);

            $('#homeChannelButton').addClass('selectedChannelControlButton');
            $('#allChannelsButton').removeClass('selectedChannelControlButton');
            $('#searchButton').removeClass('selectedChannelControlButton');
            $('#channelsBox').show();
            $('#allChannelsBox').hide();
            $('#videoSearchBox').hide();

            $('.channelBoxColumn').hide();
            $('#'+$(this).attr('category')+'Column').show();
        }
    });
        
    //~~~~~~~~~~~~~~~~~~~~~Mosaic controls
    $('#mosaicBackButton').click(function(){
        closeMosaic();
    });
        
    //~~~~~~~~~~~~~~right bottom box controls
    $('#homeChannelButton').click(function(){
        // get which tab was last selected to apply selected tab class to it
        $('.channelBoxColumn').each(function(i){ 
            if($(this).css('display') != 'none'){
                $('#'+$(this).attr('category')+'Tab').addClass('colTabSelected');
            }
        });
        $('#allChannelsButton').removeClass('selectedChannelControlButton');
        $('#searchButton').removeClass('selectedChannelControlButton');
        $(this).addClass('selectedChannelControlButton');
        $('#videoSearchBox').hide();
        $('#allChannelsBox').hide();
        $('#channelsBox').show();
    });
    $('#allChannelsButton').click(function(){
        $('#homeChannelButton').removeClass('selectedChannelControlButton');
        $('#searchButton').removeClass('selectedChannelControlButton');
        $(this).addClass('selectedChannelControlButton');
        $('.colTab').removeClass('colTabSelected');
        $('#videoSearchBox').hide();
        $('#channelsBox').hide();
        $('#allChannelsBox').show();
    });
    $('#searchButton').click(function(){
        $('#homeChannelButton').removeClass('selectedChannelControlButton');
        $('#allChannelsButton').removeClass('selectedChannelControlButton');
        $(this).addClass('selectedChannelControlButton');
        $('.colTab').removeClass('colTabSelected');
        $('#channelsBox').hide();
        $('#allChannelsBox').hide();
        $('#videoSearchBox').show();
    });
    $('#refreshButton').click(function(){
        teleUpdateDesktop();
    });
    
    //~~~~~~~~~~~~~~channel map controls
    // if hit enter in search box, click magnify glass
    $('#allChannelsBoxSearch > input[type="search"]').keypress(function(e) {
         if(e.which == 13) {
             e.preventDefault();
             $("#allChannelsBoxSearch > button:nth-child(2)").click();
          }
    });
    // take value in search box, hide all channels boxes with value not in title
    $('#allChannelsBoxSearch > button:nth-child(2)').click(function(){
        var searchValue = $('#allChannelsBoxSearch > input[type="search"]').val().toLowerCase();
        if(searchValue == ""){
            $('.allChannelListing').show();
        }else{
            $('.allChannelListing').each(function(i){ 
                var t = $(this).children('.allChannelBox').children('.allChannelBoxRight').children('.allChannelTitle').text().toLowerCase();
                if(t.indexOf(searchValue) < 0){
                    $(this).hide();
                }else{
                    $(this).show();
                }
            });
        }
    });
    // if clear button clicked, show all boxes against
    $('#allChannelsSearchClear').click(function(){
        $('#allChannelsBoxSearch > input[type="search"]').val('');
        $('.allChannelListing').show();
    });
    $('#allChannelsBox').on('click', 'li.allChannelListing', null, function() {
        loadMosaic($(this).attr('clistid'));
    });
    
    //~~~~~~~~~~~~~~video search controls
    $('#videoSearchBoxList > div.scrollWrap > div').on('click', 'li.videoSearchResult', null, function() {
        if($(this).hasClass('ReleTVResult')){
            setCurrentList($(this).attr('chid'));
            video2play($(this).attr('vid'));
        }else{
            setCurrentList('listicorResults');
            video2play($(this).attr('vid'));
        }
        closeMosaic();
    });
    $('#videoSearchBoxClear').click(function(){
        $('#videoSearchBoxSearch > input[type="search"]').val('');
        $('#videoSearchBoxList > div.scrollWrap > div').empty();
    });
    $('#videoSearchBoxSearch > input[type="search"]').keypress(function(e) {
         if(e.which == 13) {
             e.preventDefault();
             $("#videoSearchBoxSearch > button:nth-child(2)").click();
          }
    });
    $('#videoSearchBoxSearch > button:nth-child(2)').click(function(){
        searchForVideos($('#videoSearchBoxSearch > input[type="search"]').val().toLowerCase());
    });
    $('#videoSearchBoxList').on('mouseenter', 'li.videoSearchResult', null, function(e){
        doTooltip(e, $(this).children('.videoSearchResultTip')[0].outerHTML);
    });
    $('#videoSearchBoxList').on('mouseleave', 'li.videoSearchResult', null, function(){
        hideTip();
    });
    
    //~~~~~~~~~~~~~~settings controls
    // open settings
    $('#settingsButton').click(function() {
        $('#settingsWrap').toggle();
    });
    // close settings
    // click on the 'x', or click anywhere outside the settings box
    $('#closeSettingsButton').click(function() {
        $('#settingsWrap').toggle();
    });
    $('#greyOut').click(function() {
        $('#settingsWrap').toggle();
    });
    // load 'Latest' mosaic first toggle
    $('#latestMosaicToggle').click(function(){
        if(getCookie('latestMosaicToggle') == 'disable' || getCookie('latestMosaicToggle') == ''){
            setCookie('latestMosaicToggle', 'enable', 3600);
        }
        else if(getCookie('latestMosaicToggle') == 'enable'){
            setCookie('latestMosaicToggle', 'disable', 3600);
        }
    });
    // auto play video toggle
    $('#autoplayVideoToggle').click(function(){
        if(getCookie('autoplayVideoToggle') == 'disable' || getCookie('autoplayVideoToggle') == ''){
            setCookie('autoplayVideoToggle', 'enable', 3600);
        }
        else if(getCookie('autoplayVideoToggle') == 'enable'){
            setCookie('autoplayVideoToggle', 'disable', 3600);
        }
    });
    // toggle video update control
    $('#updateVideoIntervalToggle').click(function(){
        if(getCookie('updateVideoIntervalToggle') == 'disable'){
            setCookie('updateVideoIntervalToggle', 'enable', 3600);
            $('#updateVideoIntervalSettingOption').show();
            updateVideoIntervalTimer = setInterval(teleUpdateDesktop, minToMilli(getCookie('updateVideoInterval'))); 
        }
        else if(getCookie('updateVideoIntervalToggle') == 'enable'){
            setCookie('updateVideoIntervalToggle', 'disable', 3600);
            $('#updateVideoIntervalSettingOption').hide();
            updateVideoIntervalTimer = clearInterval(updateVideoIntervalTimer);
        }
    });
    // video update interval controls
    $('#updateVideoIntervalSetting').on('input', function() {
        updateVideoIntervalTimer = setInterval(teleUpdateDesktop, minToMilli($('#updateVideoIntervalSetting').val())); 
        setCookie('updateVideoInterval', $('#updateVideoIntervalSetting').val(), 3600);  
    });
    //theme toggle button --TODO: there is probably a much simpler way to handle this, adding 1 parent class to the body tag somewhere maybe?
    $('#lightToggle').click(function() {
        
        adjustLights();
        
        // toggle cookie
        if(getCookie('lightToggle') == "" || getCookie('lightToggle') == 'light'){ // toggle dark cookie one
            setCookie('lightToggle', 'dark', 3600);
        }else if(getCookie('lightToggle') == 'dark'){
            setCookie('lightToggle', 'light', 3600);
        }
    });
}

// tool tip controls
function doTooltip(LOC_e, LOC_msg){
  Tooltip.show(LOC_e, LOC_msg);
}
function hideTip(){
  Tooltip.hide();
}

// share the current video and link back to ReleTV site
function shareOnFacebook(){
    var url = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(document.URL) + '&t=' + encodeURIComponent(document.URL)
    popupShareLink(url, 'Facebook Share', '500', '400')

}
function shareOnTwitter(){
    var url = 'https://twitter.com/intent/tweet?text=' 
        + 'Look at what I found on ' + encodeURIComponent(document.URL) + ' !:%20'  
        + 'https://www.youtube.com/watch?v='+mCurrentVideoId;
    popupShareLink(url, 'Share on Twitter', '500', '400')

}
function shareOnGooglePlus(){
    var url = 'https://plus.google.com/share?url=' + encodeURIComponent(document.URL);
    popupShareLink(url, 'Google+ Share', '500', '400')
}
function popupShareLink(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }
}

//================================================================
//                                  MOBILE VARS AND FUNCTIONS 
//================================================================

// refreshing causes all channels to check for new vidoes, not just what page the refresh was issued on
function teleUpdateMobile(){ 
    $('#refreshIconMobile').addClass('fa-spin');
    $('#refreshIconMobileLandscape').addClass('fa-spin');
    $("#mainListTitle").css("pointer-events", "none");
    $("#refreshIconMobileLandscape").css("pointer-events", "none");

   
    teleUpdate().then(function(){
        
        if($('#mainList').attr('currList') == 'latest'){
            fillMainList($('#mainListTitle').text(), 'latest',mLatestVideoList.slice(0, 25));
        }else if($('#mainList').attr('currList') == 'live'){
            fillMainList($('#mainListTitle').text(), 'live', mCategoryDict['live'].slice(0, 25));
        }else{
            fillMainList($('#mainListTitle').text(), $('#mainList').attr('currList'), mVideoDict[$('#mainList').attr('currList')]);
        }
        
        fillNavigation();
        $('#refreshIconMobile').removeClass('fa-spin');
        $('#refreshIconMobileLandscape').removeClass('fa-spin');
        $("#mainListTitle").css("pointer-events", "auto");
        $("#refreshIconMobileLandscape").css("pointer-events", "auto");

        // load colors
        
        
        returnToTop();

    });
}

function teleStartMobile(){
    teleStart().then(function(){
        
        // load colors
        
        
        //then display        
        fillMainList('Latest', 'latest', mLatestVideoList);
        fillNavigation();
    });

}

// function to hold all delegated tap/swipe controls
function delegateMobileControls(){
    
    //~~~~~~~~~~~ both landscape and portrait controls
        
    // open/close left menu (also done by tapping hamburger)
    $('#listWrapper').on('swipeleft', function() {
        $("#nav-trigger").prop("checked", true);
    });
    $('#listWrapper').on('swiperight', function() {
        $("#nav-trigger").prop("checked", false);
    });
        
    // delegate left menu controls
    // TODO: I think that there is a better way of doing this
    $('.leftMenu').off('tap').on('tap', 'li', null, function(e) { 
    
        e.preventDefault();
        
        var target = $(e.target).closest('li');
        
        if(target.attr('cat') == 'live'){
            $("#nav-trigger").prop("checked", false);
            fillMainList('Live', 'live', mCategoryDict['live'].slice(0,25));
        }else if(target.attr('cat') == 'latest'){
            $("#nav-trigger").prop("checked", false);
            fillMainList('Latest', 'latest', mLatestVideoList);
        }else if(target.attr('cat') == 'recentWatched'){
            $("#nav-trigger").prop("checked", false);
            fillMainList('Just Watched', 'recentWatched', mRecentWatchedList);
        }else if(target.hasClass('hasChannels')){
            $('.leftMenuChannels[cat='+target.attr('cat')+']').toggleClass('showLeftMenuChannels');
        }else if(target.hasClass('leftMenuChannelItem')){
            $("#nav-trigger").prop("checked", false);
            $(this).parent().removeClass('showLeftMenuChannels');
            fillMainList(mChannelDict[$(this).attr('chid')].title, $(this).attr('chid'), mVideoDict[$(this).attr('chid')]);
        }
        
    });
        
    // from main list, load induvidual video
    // if tap on thumbnail, auto play video
    // if tap on right side, don't auto play video
    // TODO: this doesn't seem to be the right way to delegate controls
    $('#mainList').off('tap').on('tap', 'li.mainListing', null, function(e) {
        if($(e.target).hasClass('mainListingThumbnail')){
            setCurrentList($('#mainList').attr('currlist'));
            loadInduvidualVideo($(this).attr('chid'), $(this).attr('vid'), true);
        }else{
            setCurrentList($('#mainList').attr('currlist'));
            loadInduvidualVideo($(this).attr('chid'), $(this).attr('vid'), false);
            e.preventDefault();
        }
    });   

    // from induvidual video, close it and show previous main list (portait)
    $('#induvidualVideoBack').off('tap').on('tap', function() {
        mUTPlayer.stopVideo();
        $('#induvidualVideo').hide();
        $('#listWrapper').show();
    });   
        
    // from induvidual video, close it and show previous main list (landscape)
    $('#topBar').off('tap').on('tap', '.landscapeInduvidualBackButton', null, function() {
        mUTPlayer.stopVideo();
        $('#mainListTitleLandscape').removeClass('landscapeInduvidualBackButton');
        $('#mainListTitleLandscape').empty();
        var catTitle = '';
        for(var c in categories){
            if(categories[c].category == $('#mainList').attr('currlist')){
                catTitle = categories[c].title;
            }
        }
        if(catTitle == ''){
            for(var c in mChannelDict){
                if(mChannelDict[c].id == $('#mainList').attr('currlist')){
                    catTitle = mChannelDict[c].title;
                }
            }
        }
        $('#mainListTitleLandscape').text(catTitle);   
        $('#induvidualVideo').hide();
        $('#listWrapper').show();
    });
    $('#induvidualVideo').on('swipeleft', function() {
        mUTPlayer.stopVideo();
        $('#mainListTitleLandscape').removeClass('landscapeInduvidualBackButton');
        $('#mainListTitleLandscape').empty();
        var catTitle = '';
        for(var c in categories){
            if(categories[c].category == $('#mainList').attr('currlist')){
                catTitle = categories[c].title;
            }
        }
        if(catTitle == ''){
            for(var c in mChannelDict){
                if(mChannelDict[c].id == $('#mainList').attr('currlist')){
                    catTitle = mChannelDict[c].title;
                }
            }
        }
        $('#mainListTitleLandscape').text(catTitle);
        $('#induvidualVideo').hide();
        $('#listWrapper').show();
    });  
        
    // when induvidual video and leftMenu viewable controls 
    $('#induvidualVideo').on('swiperight', function() {
        $("#nav-trigger").prop("checked", false);
    });
    $('#induvidualVideo').off('tap').on('tap', function() {
        $("#nav-trigger").prop("checked", false);
    });
    
    // when in landscape, just tap on refresh button to refresh
    $('#refreshIconMobileLandscape').off('tap').on('tap', function(){
        teleUpdateMobile();
    });

}

// fill the main list full of video listings
// parameters : title, title to put on top of list,
//              videoList, list of videos to list
//              channelId, id of channel being loaded, 'latest' if latest vids, 'live' if live vids, 'recentWatched' if recently watched
// from : teleStartMobile(), click on channel in leftMenu
function fillMainList(title, channelId, videoList){
    
    // set title
    $('#mainList').empty();
    $('#mainList').attr('currList', channelId);
    $('#mainListTitle > p').text(title);
    $('#mainListTitleLandscape').removeClass('landscapeInduvidualBackButton');
    $('#mainListTitleLandscape').empty();
    $('#mainListTitleLandscape').text(title);
    
    // scroll the list
    $('#mainList').scrollTop(0); 

    // generate all video listings
    for(var v in videoList){
        var vid = videoList[v];
        var listing = '<li class="mainListing tileColor" vid="'+vid.videoId+'" chid="'+vid.chid+'">'+
                        '<div class="mainListingThumbnailWrapper">'+
                            '<img class="mainListingThumbnail" src="'+vid.thumbnail+'">'+
                            '<p class="mainListingWatched mainText">Watched</p>'+
                        '</div>'+
                        '<div class="mainListingRight">'+
                            '<p class="mainListingTitle mainText">'+vid.title+'</p>'+
                            '<p class="mainListingInfo subText">'+vid.updated.ago+' | '+mChannelDict[vid.chid].title+'</p>'+
                        '</div>'+
                      '</li>';
        $('#mainList').append(listing);
        if(vid.watched){
            $('#mainList').find('li[vid='+vid.videoId+']').find('.mainListingWatched').show();
        }
    }
    
    $('#listWrapper').show();
    $('#induvidualVideo').hide();
}

// fill the leftMenu with the categories and channels
// from : document.ready(), teleUpdateMobile
function fillNavigation(){
    
    $('.leftMenu').empty();
    
    // construct and append category listings
    for(var c in categories){
        var cat = categories[c];

        if(cat.category == 'favorites'){
            continue;
        }
        var additional = '';
        // TVMosaic specific
        if(cat.category != 'latest' &&  cat.category != 'live' && cat.category != 'recentWatched'){
            additional = '<i class="fa fa-angle-double-down extraText" aria-hidden="true"></i>';
        }
         
         
        var catListing = '<li class="leftMenuCategoryItem thirdLevel" cat="'+cat.category+'">'+
                            '<div cat="'+cat.category+'" class="leftMenuTrigger">'+
                                '<p class="leftMenuCategoryTitle extraText">'+cat.title+'</p>'+'<img class="leftMenuCategoryIcon" src="'+cat.icon+'">'+
                                additional +
                            '</div>'+
                          '</li>';
        $('.leftMenu').append(catListing);
        
        // TVMosaic specific
        if(cat.category == 'latest' ||  cat.category == 'live'){
            continue;
        }
         
        // for each category, load the channels for it
        $('.leftMenuCategoryItem[cat='+cat.category+']').addClass('hasChannels');
        $('.leftMenu').append('<ul class="leftMenuChannels" cat="'+cat.category+'"></ul>');
                       
        for(var ch in mChannelDict){
            if(mChannelDict[ch].category == cat.category && mVideoDict[ch].length != 0){
                var channelListing = '<li class="leftMenuChannelItem secondLevel" chid="'+ch+'">'+ 
                                        '<img class="leftMenuChannelIcon" src="'+mChannelDict[ch].thumbnail+'">'+
                                        '<p class="leftMenuChannelTitle extraText">'+mChannelDict[ch].title+'</p>'+
                                    '</li>';
                $('.leftMenuChannels[cat='+cat.category+']').append(channelListing);
            }
        }
                
        
    }
}


// load the induvidual video page
// from : click on video in #mainList
function loadInduvidualVideo(channelId, videoId, autoplay){
    
    // if in landscape, have the title in the top bar act as the back button (or swipe left), to return to main list
    $('#mainListTitleLandscape').addClass('landscapeInduvidualBackButton');
    $('#mainListTitleLandscape').html('<p>Back</p><i class="fa fa-angle-double-right" aria-hidden="true">');
    
    // get the vid
    var vid = '';
    for(var v in mVideoDict[channelId]){
        if(mVideoDict[channelId][v].videoId == videoId){
            vid = mVideoDict[channelId][v];
            mVideoDict[channelId][v].watched = true;
            if(containsVid(videoId, mRecentWatchedList) == -1){
                mRecentWatchedList.unshift(mVideoDict[channelId][v]);
            }
            break;
        }
    }
    
    // cue video
    if(autoplay){
        mUTPlayer.cueVideoById(videoId);

        /* auto play is disabled for the youtube player on mobile devices, 
            this is an attempt at a hack to mimic autoplay */
        // mUTPlayer.loadVideoById(videoId);
        // mobileAutoplayHackTimer = setInterval($('.html5-video-player').click(), 500);
    }else{
        mUTPlayer.cueVideoById(videoId);
    }
    mCurrentVideoId = videoId;
    
    $('#induvidualVideoTitle').text(vid.title);
    $('#induvidualVideoChannelThumbnail').attr('src', mChannelDict[channelId].thumbnail);
    $('#induvidualVideoChannelTitle').text(mChannelDict[channelId].title);
    $('#induvidualVideoUpdated').text(vid.updated.hour);
    $('#induvidualVideoDescription').text(vid.description);

    $('#listWrapper').hide();
    $('#induvidualVideo').show();
    
    if(vid.watched){
        $('#mainList').find('li[vid='+vid.videoId+']').find('.mainListingWatched').show();
    }
}

// pull to refresh controls
function returnToTop(){       
    $('#mainListTitle').css({ top: 0 });
    $('#mainListTitleWrapper').removeClass('elevatePullToRefresh');

   // console.log('rest')
}
// constanly called as pull to refresh is being dragged
function handlePull(ev,obj){    
    // console.log('pulling');
    $('#mainListTitleWrapper').addClass('elevatePullToRefresh');
}   
// when the pull to refresh is let go
function hidePull(ev, obj){
    //console.log('stop');
             
    // if the title was dragged, but not all the way down, check for that and reset
    var whereIsWrapper = $('#mainListTitleWrapper').position().top + $('#mainListTitleWrapper').outerHeight(true);
    var whereIsTitle = $('#mainListTitle').position().top + $('#mainListTitle').outerHeight(true);
    if(whereIsWrapper > whereIsTitle){
        returnToTop();
    }
                
    // if got pulled all the way down, start the updated
    else{
        teleUpdateMobile();
    }
}

//DUMMY FUNCTION IGNORE
window.create_ad = window.create_ad || function(){};
