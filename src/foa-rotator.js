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

//////////////////////
/* B_FORMAT ROTATOR */
//////////////////////

export default class Bformat_rotator {

    constructor(audioCtx) {
        this.initialized = false;

        this.ctx = audioCtx;
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.rotMtx = [ [], [], [] ];
        this.rotMtxNodes = [ [], [], [] ];

        // Input and output nodes
        this.in = this.ctx.createChannelSplitter(4);
        this.out = this.ctx.createChannelMerger(4);
        // Initialize rotation gains to identity matrix
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.rotMtxNodes[i][j] = context.createGain();
                if (i == j) this.rotMtxNodes[i][j].gain.value = 1;
                else this.rotMtxNodes[i][j].gain.value = 0;
            }
        }
        // Create connections
        this.in.connect(this.out, 0, 0);

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.in.connect(this.rotMtxNodes[i][j], j + 1, 0);
                this.rotMtxNodes[i][j].connect(this.out, 0, i + 1);
            }
        }

        this.initialized = true;
    }

    updateRotMtx() {
        var yaw = this.yaw * Math.PI / 180;
        var pitch = this.pitch * Math.PI / 180;
        var roll = this.roll * Math.PI / 180;
        var Rxx, Rxy, Rxz, Ryx, Ryy, Ryz, Rzx, Rzy, Rzz;

        Rxx = Math.cos(pitch) * Math.cos(yaw);
        Rxy = Math.cos(pitch) * Math.sin(yaw);
        Rxz = -Math.sin(pitch);
        Ryx = Math.cos(yaw) * Math.sin(pitch) * Math.sin(roll) - Math.cos(roll) * Math.sin(yaw);
        Ryy = Math.cos(roll) * Math.cos(yaw) + Math.sin(pitch) * Math.sin(roll) * Math.sin(yaw);
        Ryz = Math.cos(pitch) * Math.sin(roll);
        Rzx = Math.sin(roll) * Math.sin(yaw) + Math.cos(roll) * Math.cos(yaw) * Math.sin(pitch);
        Rzy = Math.cos(roll) * Math.sin(pitch) * Math.sin(yaw) - Math.cos(yaw) * Math.sin(roll);
        Rzz = Math.cos(pitch) * Math.cos(roll);

        this.rotMtx = [
            [Rxx, Rxy, Rxz],
            [Ryx, Ryy, Ryz],
            [Rzx, Rzy, Rzz]
        ];

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                this.rotMtxNodes[i][j].gain.value = this.rotMtx[i][j];
            }
        }
    }
}
