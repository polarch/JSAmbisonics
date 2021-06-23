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

/////////////////////////////
/* MULTI-CHANNEL CONVOLVER */
/////////////////////////////

export default class convolver {

    constructor(audioCtx, order) {

        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.encFilters = new Array(this.nCh);
        this.encFilterNodes = new Array(this.nCh);
        // input and output nodes
        this.in = this.ctx.createGain();
        this.in.channelCountMode = 'explicit';
        this.in.channelCount = 1;
        this.out = this.ctx.createChannelMerger(this.nCh);
        // convolver nodes
        for (var i = 0; i < this.nCh; i++) {
            this.encFilterNodes[i] = this.ctx.createConvolver();
            this.encFilterNodes[i].normalize = false;
        }
        // create audio connections
        for (var i = 0; i < this.nCh; i++) {
            this.in.connect(this.encFilterNodes[i]);
            this.encFilterNodes[i].connect(this.out, 0, i);
        }

        this.initialized = true;
    }

    updateFilters(audioBuffer) {
        // assign filters to convolvers
        for (var i = 0; i < this.nCh; i++) {
            this.encFilters[i] = this.ctx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
            this.encFilters[i].getChannelData(0).set(audioBuffer.getChannelData(i));

            this.encFilterNodes[i].buffer = this.encFilters[i];
        }
    }


}
