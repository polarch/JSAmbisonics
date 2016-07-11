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

//////////////////////////////////////////
/* PRESSURE-VELOCITY INTENSITY ANALYZER */
//////////////////////////////////////////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now
import 'get-float-time-domain-data';

export default class intensityAnalyser {
    constructor(audioCtx) {
        this.initialized = false;

        this.ctx = audioCtx;
        this.fftSize = 2048;
        this.analysers = new Array(4);
        this.analBuffers = new Array(4);
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        // Initialize analyzer buffers
        for (let i = 0; i < 4; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        for (let i = 0; i < 4; i++) {
            this.in.connect(this.out, i, i);
            this.in.connect(this.analysers[i], i, 0);
        }

        this.initialized = true;
    }

    updateBuffers() {
        // Get latest time-domain data
        for (let i = 0; i < 4; i++) {
            this.analysers[i].getFloatTimeDomainData(this.analBuffers[i]);
        }
    }

    computeIntensity() {
        // Compute correlations and energies of channels
        var iX = 0;
        var iY = 0;
        var iZ = 0;
        var WW = 0;
        var XX = 0;
        var YY = 0;
        var ZZ = 0;
        var I, I_norm, E, Psi, azim, elev;
        // Accumulators for correlations and energies
        for (let i = 0; i < this.fftSize; i++) {

            iX = iX + Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[1][i];
            iY = iY + Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[2][i];
            iZ = iZ + Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[3][i];
            WW = WW + 2 * this.analBuffers[0][i] * this.analBuffers[0][i];
            XX = XX + this.analBuffers[1][i] * this.analBuffers[1][i];
            YY = YY + this.analBuffers[2][i] * this.analBuffers[2][i];
            ZZ = ZZ + this.analBuffers[3][i] * this.analBuffers[3][i];
        }
        I = [iX, iY, iZ]; // intensity
        I_norm = Math.sqrt(I[0] * I[0] + I[1] * I[1] + I[2] * I[2]); // intensity magnitude
        E = (WW + XX + YY + ZZ) / 2; // energy
        Psi = 1 - I_norm / (E + 10e-8); // diffuseness
        azim = Math.atan2(iY, iX) * 180 / Math.PI;
        elev = Math.atan2(I[2], Math.sqrt(I[0] * I[0] + I[1] * I[1])) * 180 / Math.PI;

        var params = [azim, elev, Psi, E];
        return params;
    }
}
