////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  JSAmbisonics a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

////////////////
/* HOA LOADER */
////////////////

export default class HOAloader {
    constructor(context, order, url, callback) {
        this.context = context;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.nChGroups = Math.ceil(this.nCh / 8);
        this.buffers = new Array();
        this.loadCount = 0;
        this.loaded = false;
        this.onLoad = callback;
        this.urls = new Array(this.nChGroups);

        var fileExt = url.slice(url.length - 3, url.length);
        this.fileExt = fileExt;

        for (var i = 0; i < this.nChGroups; i++) {

            if (i == this.nChGroups - 1) {
                this.urls[i] = url.slice(0, url.length - 4) + "_" + pad(i * 8 + 1, 2) + "-" + pad(this.nCh, 2) + "ch." + fileExt;
            } else {
                this.urls[i] = url.slice(0, url.length - 4) + "_" + pad(i * 8 + 1, 2) + "-" + pad(i * 8 + 8, 2) + "ch." + fileExt;
            }
        }

        function pad(num, size) {
            return ('000000000' + num).substr(-size);
        }

    }

    loadBuffers(url, index) {
        // Load buffer asynchronously
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        var scope = this;

        request.onload = function() {
            // Asynchronously decode the audio file data in request.response
            scope.context.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    scope.buffers[index] = buffer;
                    scope.loadCount++;
                    if (scope.loadCount == scope.nChGroups) {
                        scope.loaded = true;
                        scope.concatBuffers();
                        console.log("HOAloader: all buffers loaded and concatenated")
                        scope.onLoad(scope.concatBuffer);
                    }
                },
                function(error) {
                    alert("Browser cannot decode audio data:  " +  url + "\n\nError: " + error + "\n\n(If you re using Safari and get a null error, this is most likely due to Apple's shady plan going on to stop the .ogg format from easing web developer's life :)");
                }
            );
        }

        request.onerror = function() {
            alert('HOAloader: XHR error');
        }

        request.send();
    }

    load() {
        for (var i = 0; i < this.nChGroups; ++i) this.loadBuffers(this.urls[i], i);
    }

    concatBuffers() {

        if (!this.loaded) return;

        var nCh = this.nCh;
        var nChGroups = this.nChGroups;

        var length = this.buffers[0].length;
        this.buffers.forEach( (b) => {length = Math.max(length, b.length)});
        var srate = this.buffers[0].sampleRate;
        
        // Detect if the 8-ch audio file is OGG, then remap 8-channel files to the correct
        // order cause Chrome and Firefox messes it up when loading. Other browsers have not
        // been tested with OGG files. 8ch Wave files work fine for both browsers.
        var remap8ChanFile = [1,2,3,4,5,6,7,8];
        if (this.fileExt.toLowerCase() == "ogg") {
            console.log("Loading of 8chan OGG files [Chrome/Firefox]: remap channels to correct order!")
            remap8ChanFile = [1,3,2,7,8,5,6,4];
            //remap8ChanFile = [1,3,2,8,6,7,4,5];
        }

        this.concatBuffer = this.context.createBuffer(nCh, length, srate);
        for (var i = 0; i < nChGroups; i++) {
            for (var j = 0; j < this.buffers[i].numberOfChannels; j++) {
                this.concatBuffer.getChannelData(i * 8 + j).set(this.buffers[i].getChannelData(remap8ChanFile[j]-1));
            }
        }
    }
}
