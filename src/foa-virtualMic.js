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
/* B_FORMAT VIRTUAL MICROPHONE */
/////////////////////////////////

export default class Bformat_vmic {

    constructor(audioCtx) {
        this.initialized = false;

        this.ctx = audioCtx;
        this.azi = 0;
        this.elev = 0;
        this.vmicGainNodes = new Array(4);
        this.vmicCoeff = 0.5;
        this.vmicPattern = "cardioid";
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createGain();
        // Initialize vmic to forward facing cardioid
        this.vmicGains = [0.5 * Math.SQRT2, 0.5, 0, 0];
        for (var i = 0; i < 4; i++) {
            this.vmicGainNodes[i] = this.ctx.createGain();
            this.vmicGainNodes[i].gain.value = this.vmicGains[i];
        }
        // Initialize orientation
        this.xyz = [1, 0, 0];
        // Create connections
        for (i = 0; i < 4; i++) {
            this.in.connect(this.vmicGainNodes[i], i, 0);
            this.vmicGainNodes[i].connect(this.out);
        }

        this.initialized = true;
    }

    updatePattern() {
        switch (this.vmicPattern) {
            case "subcardioid":
                this.vmicCoeff = 2 / 3;
                break;
            case "cardioid":
                this.vmicCoeff = 1 / 2;
                break;
            case "supercardioid":
                this.vmicCoeff = (Math.sqrt(3) - 1) / 2;
                break;
            case "hypercardioid":
                this.vmicCoeff = 1 / 4;
                break;
            case "dipole":
                this.vmicCoeff = 0;
                break;
            default:
                this.vmicPattern = "cardioid";
                this.vmicCoeff = 1 / 2;
        }
        this.updateGains();
    }

    updateOrientation() {
        var azi = this.azi * Math.PI / 180;
        var elev = this.elev * Math.PI / 180;

        this.xyz[0] = Math.cos(azi) * Math.cos(elev);
        this.xyz[1] = Math.sin(azi) * Math.cos(elev);
        this.xyz[2] = Math.sin(elev);

        this.updateGains();
    }

    updateGains() {
        var a = this.vmicCoeff;
        var xyz = this.xyz;
        this.vmicGains[0] = a * Math.SQRT2;
        this.vmicGains[1] = (1 - a) * xyz[0];
        this.vmicGains[2] = (1 - a) * xyz[1];
        this.vmicGains[3] = (1 - a) * xyz[2];

        for (var i = 0; i < 4; i++) {
            this.vmicGainNodes[i].gain.value = this.vmicGains[i];
        }
    }
}
