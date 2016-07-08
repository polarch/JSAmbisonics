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
/* HOA VIRTUAL MICROPHONE */
/////////////////////////////////

import * as jshlib from 'spherical-harmonic-transform';

export default class virtualMic {

    constructor(audioCtx, order) {

        this.initialized = false;

        this.ctx = audioCtx;
        this.order = order;
        this.nCh = (order + 1) * (order + 1);
        this.azim = 0;
        this.elev = 0;
        this.vmicGains = new Array(this.nCh);
        this.vmicGainNodes = new Array(this.nCh);
        this.vmicCoeffs = new Array(this.order + 1);
        this.vmicPattern = "hypercardioid";
        this.in = this.ctx.createChannelSplitter(this.nCh);
        this.out = this.ctx.createGain();

        // Initialize vmic to forward facing hypercardioid
        for (var i = 0; i < this.nCh; i++) {
            this.vmicGainNodes[i] = this.ctx.createGain();
        }
        this.SHxyz = new Array(this.nCh);
        this.SHxyz.fill(0);
        this.updatePattern();
        this.updateOrientation();

        // Create connections
        for (i = 0; i < this.nCh; i++) {
            this.in.connect(this.vmicGainNodes[i], i, 0);
            this.vmicGainNodes[i].connect(this.out);
        }

        this.initialized = true;
    }


    updatePattern() {

        function computeCardioidCoeffs(N) {
            var coeffs = new Array(N + 1);
            for (var n = 0; n <= N; n++) {
                coeffs[n] = Math.sqrt(2*n+1) * jshlib.factorial(N) * jshlib.factorial(N + 1) / (jshlib.factorial(N + n + 1) * jshlib.factorial(N - n)) / (N + 1);
            }
            return coeffs;
        }

        function computeHypercardCoeffs(N) {
            var coeffs = new Array(N + 1);
            var nSH = (N+1)*(N+1);
            for (var n = 0; n <= N; n++) {
                coeffs[n] = Math.sqrt(2*n+1) / nSH;
            }
            return coeffs;
        }

        function computeSupercardCoeffs(N) {
            switch (N) {
                case 1:
                    var coeffs = [0.3660, 0.3660];
                    break;
                case 2:
                    var coeffs = [0.2362, 0.2706, 0.1320];
                    break;
                case 3:
                    var coeffs = [0.1768, 0.2218, 0.1416, 0.0463];
                    break;
                case 4:
                    var coeffs = [0.1414, 0.1883, 0.1394, 0.0653, 0.0161];
                    break;
                default:
                    console.error("Orders should be in the range of 1-4 at the moment.");
                    return;
            }
            return coeffs;
        }

        function computeMaxRECoeffs(N) {
            var coeffs = new Array(N + 1);
            coeffs[0] = 1;
            var leg_n_minus1 = 0;
            var leg_n_minus2 = 0;
            var leg_n = 0;
            for (var n = 1; n < N + 1; n++) {
                leg_n = jshlib.recurseLegendrePoly(n, [Math.cos(2.406809 / (N + 1.51))], leg_n_minus1, leg_n_minus2);
                coeffs[n] = Math.sqrt(2*n+1) * leg_n[0][0];

                leg_n_minus2 = leg_n_minus1;
                leg_n_minus1 = leg_n;
            }
            // compute normalization factor
            var norm = 0;
            for (var n = 0; n <= N; n++) {
                norm += coeffs[n] * Math.sqrt(2*n+1);
            }
            for (var n = 0; n <= N; n++) {
                coeffs[n] = coeffs[n]/norm;
            }
            return coeffs;
        }

        switch (this.vmicPattern) {
            case "cardioid":
                // higher-order cardioid given by: (1/2)^N * ( 1+cos(theta) )^N
                this.vmicCoeffs = computeCardioidCoeffs(this.order);
                break;
            case "supercardioid":
                // maximum front-back energy ratio
                this.vmicCoeffs = computeSupercardCoeffs(this.order);
                break;
            case "hypercardioid":
                // maximum directivity factor
                // (this is the classic plane/wave decomposition beamformer,
                // also termed "regular" in spherical beamforming literature)
                this.vmicCoeffs = computeHypercardCoeffs(this.order);
                break;
            case "max_rE":
                // quite similar to maximum front-back rejection
                this.vmicCoeffs = computeMaxRECoeffs(this.order);
                break;
            default:
                this.vmicPattern = "hypercardioid";
                this.vmicCoeffs = computeHypercardCoeffs(this.order);
        }

        this.updateGains();
    }

    updateOrientation() {

        var azim = this.azim * Math.PI / 180;
        var elev = this.elev * Math.PI / 180;

        var tempSH = jshlib.computeRealSH(this.order, [ [azim, elev] ]);

        for (var i = 0; i < this.nCh; i++) {
            this.SHxyz[i] = tempSH[i][0];
        }

        this.updateGains();
    }

    updateGains() {

        var q;
        for (var n = 0; n <= this.order; n++) {
            for (var m = -n; m <= n; m++) {
                q = n * n + n + m;
                this.vmicGains[q] = this.vmicCoeffs[n] * this.SHxyz[q] / Math.sqrt(2*n+1);
            }
        }

        for (var i = 0; i < this.nCh; i++) {
            this.vmicGainNodes[i].gain.value = this.vmicGains[i];
        }
    }
}
