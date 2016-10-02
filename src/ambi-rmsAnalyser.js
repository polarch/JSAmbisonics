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

//////////////////////////////////////////
/* RMS AMPLITUDE ANALYZER */
//////////////////////////////////////////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now
import 'get-float-time-domain-data';

export default class rmsAnalyser {
    constructor(audioCtx, order) {

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.fftSize = 2048;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createChannelMerger(this.nCh);
        // Initialize analyzer buffers
        this.analysers = new Array(this.nCh);
        this.analBuffers = new Array(this.nCh);
        for (var i = 0; i < this.nCh; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
            // Create connections
            this.in.connect(this.analysers[i], i, 0);
            this.analysers[i].connect(this.out, 0, i);
        }

    }

    updateBuffers() {
        // Get latest time-domain data
        for (let i = 0; i < this.nCh; i++) {
            this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
        }
    }

    computeRMS() {
        
        var rms_values = new Array(this.nCh);
        rms_values.fill(0);
        // Accumulators for energies
        for (var i = 0; i < this.nCh; i++) {
            for (let n = 0; n < this.fftSize; n++) {
                rms_values[i] = rms_values[i] + this.analBuffers[i][n] * this.analBuffers[i][n];
            }
            rms_values[i] = Math.sqrt( rms_values[i]/this.fftSize );
        }
        return rms_values;
    }
}
