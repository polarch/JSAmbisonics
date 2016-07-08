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

/////////////////////////////////
/* HOA POWERMAP ANALYZER */
/////////////////////////////////

////// NOT IMPEMENTED YET !!! ///////

export default class powermapAnalyser {
    constructor(audioCtx, order) {
        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.fftSize = 2048;
        this.analysers = new Array(this.nCh);
        this.analBuffers = new Array(this.nCh);
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize analyzer buffers
        for (let i = 0; i < this.nCh; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        for (let i = 0; i < this.nCh; i++) {
            this.in.connect(this.out, i, i);
            this.in.connect(this.analysers[i], i, 0);
        }

        this.initialized = true;
    }

    updateBuffers() {
        // Get latest time-domain data
        for (let i = 0; i < this.nCh; i++) {
            this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
        }
    }

}
