////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
//
//  David Poirier-Quinot
//  davipoir@ircam.fr
//
////////////////////////////////////////////////////////////////////
//
//  A JavaScript library that implements
//  the spherical harmonic transform for real spherical harmonics
//  and some useful transformations in the spherical harmonic domain
//
//  The library uses the numeric.js library for matrix operations
//  http://www.numericjs.com/
//
////////////////////////////////////////////////////////////////////

var numeric = require('numeric');
var jshlib = require('spherical-harmonic-transform');
var convexhull = require('convex-hull');

require('./sphTdesigns.js');

var getAmbiBinauralDecMtx = function (hrtf_dirs_rad, order) {
    
    // triangulation
    var vertices = jshlib.convertSph2Cart(hrtf_dirs_rad);
    var triplets = convexhull(vertices);
    var nTri = triplets.length;
    var nHRTFs = hrtf_dirs_rad.length;
    
    // triplet coordinate inversions for VBAP
    var layoutInvMtx = new Array(nTri);
    for (var n=0; n<nTri; n++) {
        
        // get the unit vectors for the current group
        var tempGroup = new Array(3);
        for (var i=0; i<3; i++) {
            tempGroup[i] = vertices[triplets[n][i]];
        }
        // get inverse mtx of current group
        var tempInvMtx = numeric.inv(tempGroup);
        var tempInvVec = []; //vectorize matrix by stacking columns
        for (var i=0; i<3; i++) {
            for (var j=0; j<3; j++) {
                tempInvVec.push(tempInvMtx[j][i]);
            }
        }
        layoutInvMtx[n] = tempInvVec; // store the vectorized inverse as a row the output
    }
    
    // ALLRAD
    // t-value for the t-design
    var t = 2*order + 1;
    // vbap gains for selected t-design
    eval("var td = SPH_T_DESIGNS.TD" + t);
    var td_dirs_rad = td.azimElev;
    var G_td = vbap3(td_dirs_rad, triplets, layoutInvMtx, nHRTFs);
    G_td = numeric.transpose(G_td);
    
    // spherical harmonic matrix for t-design
    var Y_td = jshlib.computeRealSH(order, td_dirs_rad);
    Y_td = numeric.transpose(Y_td);
    // allrad decoder
    var nTD = td_dirs_rad.length;
    var M_dec = numeric.dotMMsmall(G_td, Y_td);
    M_dec = numeric.mul(1/nTD, M_dec);
    return M_dec;
    
}


var vbap3 = function (dirs_rad, triplets, ls_invMtx, ls_num) {

    var nDirs = dirs_rad.length;
    var nLS = ls_num;
    var nTri = triplets.length;
    
    function getMinOfArray(numArray) {
        return Math.min.apply(null, numArray);
    }

    var gainMtx = new Array(nDirs);
    var U = jshlib.convertSph2Cart(dirs_rad);

    for (var ns=0; ns<nDirs; ns++) {
        var u = U[ns];
        var gains = new Array(nLS);
        gains.fill(0);
        
        for (var i=0; i<nTri; i++) {
            var g_tmp = [];
            var v_tmp = [ ls_invMtx[i][0], ls_invMtx[i][1], ls_invMtx[i][2] ];
            g_tmp[0] = numeric.dotVV( v_tmp , u );
            v_tmp = [ ls_invMtx[i][3], ls_invMtx[i][4], ls_invMtx[i][5] ];
            g_tmp[1] = numeric.dotVV( v_tmp , u );
            v_tmp = [ ls_invMtx[i][6], ls_invMtx[i][7], ls_invMtx[i][8] ];
            g_tmp[2] = numeric.dotVV( v_tmp , u );
            if (getMinOfArray(g_tmp) > -0.001) {
                
                norm_g_tmp = Math.sqrt(numeric.sum(numeric.pow(g_tmp,2))); // normalize gains
                g_tmp_normed = numeric.div(g_tmp, norm_g_tmp);
                for (var j=0;j<3;j++) {
                    gains[ triplets[i][j] ] = g_tmp_normed[j];
                }
                break;
            }
        }
        
        norm_gains = Math.sqrt(numeric.sum(numeric.pow(gains,2))); // normalize gains
        gains_normed = numeric.div(gains, norm_gains);
        gainMtx[ns] = gains_normed;
    }
    return gainMtx;
}

// exports
module.exports.getAmbiBinauralDecMtx = getAmbiBinauralDecMtx;