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

/////////////////////////////////
/* HOA POWERMAP ANALYZER */
/////////////////////////////////

////// NOT COMPLETED YET !!! ///////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now
import 'get-float-time-domain-data';

import * as numeric from 'numeric';
import * as jshlib from 'spherical-harmonic-transform';

var utils = require('./utils.js');

export default class powermapAnalyser {
    constructor(audioCtx, order, mode) {

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
        
        // Initialise t-Design for power map
        var td_dirs_deg = utils.getTdesign(4 * order);
        this.td_dirs_rad = utils.deg2rad(td_dirs_deg);
        // SH sampling matrix
        this.SHmtx = jshlib.computeRealSH(this.order, this.td_dirs_rad);
        this.mode = mode;
//        this.nCoeffs = (2*this.order+1)*(2*this.order+1)
//        this.powerCoeffs = new Array( this.nCoeffs );
//        this.powerCoeffs.fill(0);
//        // Smoothing coefficient
//        this.smoothCoeff = 0.5;
    }

    updateBuffers() {
        // Get latest time-domain data
        for (let i = 0; i < this.nCh; i++) {
            this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
        }
    }
    
    computePowermap() {
        
        var nDirs = this.td_dirs_rad.length;
        // reconstruction
        var data = numeric.dot(numeric.transpose(this.SHmtx), this.analBuffers);
        // compute directional power
        var powerValues = new Array(nDirs);
        // Accumulators for energies
        for (var i = 0; i < nDirs; i++) {
            for (let n = 0; n < this.fftSize; n++) {
                var tmp_pwr = 0;
                tmp_pwr = tmp_pwr + data[i][n] * data[i][n];
            }
            var tmp_pwr = tmp_pwr/this.fftSize;
            powerValues[i] = [ this.td_dirs_rad[i][0], this.td_dirs_rad[i][1] , tmp_pwr ];
        }
        
        if (this.mode == 0) return powerValues;
        else if (this.mode == 1) {
            // Re-encode directional energy to SH coefficients
            var powerCoeffs = jshlib.forwardSHT(2*this.order, powerValues);
            return powerCoeffs;
        }
        
        //        // Smooth coefficients
//        for (var i = 0; i < this.nCoeffs; i++) this.powerCoeffs[i] = this.smoothCoeff*this.powerCoeffs[i] + (1-this.smoothCoeff)*powerCoeffs[i];
//        
//        return this.powerCoeffs;
    }

}
