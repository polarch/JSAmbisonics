////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//  David Poirier-Quinot
//  davipoir@ircam.fr
////////////////////////////////////////////////////////////////////
//
//  WebAudio_HOA a JavaScript library for higher-order Ambisonics
//  The library implements Web Audio blocks that perform
//  typical ambisonic processing operations on audio signals.
//
////////////////////////////////////////////////////////////////////

///////////////////////////////
/* B_FORMAT BINAURAL DECODER */
///////////////////////////////
export default class Bformat_binDecoder {

    constructor(audioCtx) {
        this.initialized = false;

        this.ctx = audioCtx;
        this.decFilters = new Array(4);
        this.decFilterNodes = new Array(4);
        // input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(2);
        // downmixing gains for left and right ears
        this.gainMid = this.ctx.createGain();
        this.gainSide = this.ctx.createGain();
        this.invertSide = this.ctx.createGain();
        this.gainMid.gain.value = 1;
        this.gainSide.gain.value = 1;
        this.invertSide.gain.value = -1;
        // initialize convolvers
        for (var i = 0; i < 4; i++) {
            this.decFilterNodes[i] = this.ctx.createConvolver();
            this.decFilterNodes[i].normalize = false;
        }
        // initialize filters to plain opposing cardioids
        this.resetFilters();

        // Create connections
        for (var i = 0; i < 4; i++) {
            this.in.connect(this.decFilterNodes[i], i, 0);

            if (i == 2) this.decFilterNodes[i].connect(this.gainSide, 0, 0);
            else this.decFilterNodes[i].connect(this.gainMid, 0, 0);
        }
        this.gainMid.connect(this.out, 0, 0);
        this.gainSide.connect(this.out, 0, 0);

        this.gainMid.connect(this.out, 0, 1);
        this.gainSide.connect(this.invertSide, 0, 0);
        this.invertSide.connect(this.out, 0, 1);

        this.initialized = true;
    }


    updateFilters(audioBuffer) {
        // assign filters to convolvers
        for (var i = 0; i < 4; i++) {
            this.decFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
            this.decFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

            this.decFilterNodes[i].buffer = this.decFilters[i];
        }
    }

    resetFilters() {
        // overwrite decoding filters with plain opposing cardioids
        var cardGains = [0.5 * Math.SQRT2, 0, 0.5, 0];
        for (var i = 0; i < 4; i++) {
            this.decFilters[i] = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
            this.decFilters[i].getChannelData(0).set([cardGains[i]]);

            this.decFilterNodes[i].buffer = this.decFilters[i];
        }
    }
}
