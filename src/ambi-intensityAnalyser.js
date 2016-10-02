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
/* PRESSURE-VELOCITY INTENSITY ANALYZER */
//////////////////////////////////////////

// for Safari support where audioContext.Analyser.getFloatTimeDomainData is not defined for now
import 'get-float-time-domain-data';

export default class intensityAnalyser {
    constructor(audioCtx) {

        this.ctx = audioCtx;
        this.fftSize = 2048;
        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        // Gains to go from ACN/N3D to pressure-velocity (WXYZ)
        this.gains = new Array(3);
        for (var i = 0; i < 3; i++) {
            this.gains[i] = this.ctx.createGain();
            this.gains[i].gain.value = 1 / Math.sqrt(3);
        }
        // Initialize analyzer buffers
        this.analysers = new Array(4);
        this.analBuffers = new Array(4);
        for (i = 0; i < 4; i++) {
            this.analysers[i] = this.ctx.createAnalyser();
            this.analysers[i].fftSize = this.fftSize;
            this.analysers[i].smoothingTimeConstant = 0;
            this.analBuffers[i] = new Float32Array(this.fftSize);
        }
        // Create connections
        this.in.connect(this.out, 0, 0);
        this.in.connect(this.analysers[0], 0, 0);
        
        this.in.connect(this.gains[1], 1, 0);
        this.in.connect(this.gains[2], 2, 0);
        this.in.connect(this.gains[0], 3, 0);
        for (i = 0; i < 3; i++) {
            this.gains[i].connect(this.analysers[i+1], 0, 0);
            this.gains[i].connect(this.out, 0, i+1);
        }

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

            iX = iX + this.analBuffers[0][i] * this.analBuffers[1][i];
            iY = iY + this.analBuffers[0][i] * this.analBuffers[2][i];
            iZ = iZ + this.analBuffers[0][i] * this.analBuffers[3][i];
            WW = WW + this.analBuffers[0][i] * this.analBuffers[0][i];
            XX = XX + this.analBuffers[1][i] * this.analBuffers[1][i];
            YY = YY + this.analBuffers[2][i] * this.analBuffers[2][i];
            ZZ = ZZ + this.analBuffers[3][i] * this.analBuffers[3][i];
        }
        I = [iX, iY, iZ]; // intensity
        I_norm = Math.sqrt(I[0]*I[0] + I[1]*I[1] + I[2]*I[2]); // intensity magnitude
        E = (WW + XX + YY + ZZ) / 2; // energy
        Psi = 1 - I_norm / (E + 10e-8); // diffuseness
        azim = Math.atan2(iY, iX) * 180 / Math.PI;
        elev = Math.atan2(I[2], Math.sqrt(I[0] * I[0] + I[1] * I[1])) * 180 / Math.PI;

        var params = [azim, elev, Psi, E];
        return params;
    }
}
