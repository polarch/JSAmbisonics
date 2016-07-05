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
/* HOA INTENSITY ANALYZER */
/////////////////////////////////

export default class HOA_analyser {
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

    computeIntensity() {
        // Compute correlations and energies of channels
        var iCh = new Array(this.nCh).fill(0); // intensity
        var corrCh = new Array(this.nCh).fill(0); // correlation
        var I_norm, E, Psi, azi, elev;
        // Accumulators for correlations and energies
        for (let i = 0; i < this.fftSize; i++) {
            for (let j = 0; j < this.nCh; j++) {

                if (j==0) {
                    corrCh[j] += 2 * this.analBuffers[j][i] * this.analBuffers[j][i];
                }
                else {
                    corrCh[j] += this.analBuffers[j][i] * this.analBuffers[j][i];
                    iCh[j] += Math.sqrt(2) * this.analBuffers[0][i] * this.analBuffers[j][i];
                }
            }
        }

        let summedInt = 0;
        let summedCorr = 0;
        for (let i = 0; i < iCh.length; i++) {
            if (i != 0) summedInt += iCh[i] * iCh[i];
            summedCorr += corrCh[i];
        }

        // TO UPGRADE: for now the analyser only considers the first 4 channels
        // of the Ambisonic stream
        I_norm = Math.sqrt(summedInt); // intensity magnitude
        E = summedCorr / 2; // energy
        Psi = 1 - I_norm / (E + 10e-8); // diffuseness
        azi = Math.atan2(iCh[1], iCh[3]) * 180 / Math.PI;
        elev = Math.atan2(iCh[2], Math.sqrt(iCh[1] * iCh[1] + iCh[3] * iCh[3])) * 180 / Math.PI;
        var params = [azi, elev, Psi, E];
        return params;
    }
}
