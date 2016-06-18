////////////////////////////////////////////////////////////////////
//  Archontis Politis
//  archontis.politis@aalto.fi
////////////////////////////////////////////////////////////////////
//
//  JSHlib a JavaScript library that implements 
//  the spherical harmonic transform for real spherical harmonics
//  and some useful transformations in the spherical harmonic domain
//
//  The library uses the numeric.js library for matrix operations
//  http://www.numericjs.com/
//  
////////////////////////////////////////////////////////////////////

// forwardSHT implements the forward SHT on data defined over the sphere
function forwardSHT(N, data, CART_OR_SPH, DIRECT_OR_PINV) {
    
    var Ndirs = data.length, Nsh = (N+1)*(N+1);
    var invY_N;
    var mag = [,];
    if (Nsh>Ndirs)  {
        console.log("The SHT degree is too high for the number of data points")
    }
    
    // Convert cartesian to spherical if needed
    if (CART_OR_SPH==0) data = convertCart2Sph(data);
    for (i=0; i<data.length; i++) {
        mag[i] = data[i][0];
    }
    // SH sampling matrix
    Y_N = computeRealSH(N, data);
    // Direct SHT
    if (DIRECT_OR_PINV==0) {
        invY_N = numeric.mul(1/Ndirs,Y_N);
    }
    else {
        invY_N = pinv_direct(numeric.transpose(Y_N));
    }
    // Perform SHT
    var coeffs = numeric.dotMV(invY_N, mag);
    return coeffs;
}

// inverseSHT implements the inverse SHT from SH coefficients
function inverseSHT(coeffs, aziElev) {
    
    var aziElevR = aziElev;
    var N = Math.sqrt(coeffs.length)-1;
    // SH sampling matrix
    var Y_N = computeRealSH(N, aziElev);
    // reconstruction
    var data = numeric.dotVM(coeffs, Y_N);
    // gather in data matrix
    for (i=0; i<aziElev.length; i++) {
        aziElevR[i][2] = data[i];
    }
    return aziElevR;
}

// xxxxxxxxxxxxxxxxxx
function print2Darray(array2D) {
    for (q=0; q<array2D.length; q++) console.log(array2D[q]);
}

// convertCart2Sph converts arrays of cartesian vectors to spherical coordinates
function convertCart2Sph(xyz, OMIT_MAG) {
    
    var azi, elev, r;
    var aziElevR = new Array(xyz.length);
        
    for (i=0; i<xyz.length; i++) {
        azi = Math.atan2( xyz[i][1], xyz[i][0] );
        elev = Math.atan2( xyz[i][2], Math.sqrt(xyz[i][0]*xyz[i][0] + xyz[i][1]*xyz[i][1]) );
        if (OMIT_MAG==1) {
            aziElevR[i] = [azi,elev];
        }
        else {
            r = Math.sqrt(xyz[i][0]*xyz[i][0] + xyz[i][1]*xyz[i][1] + xyz[i][2]*xyz[i][2]);
            aziElevR[i] = [azi,elev,r];
        }
    }
    return aziElevR;
}

// convertSph2Cart converts arrays of spherical coordinates to cartesian
function convertSph2Cart(aziElevR) {
    
    var x,y,z;
    var xyz = new Array(aziElevR.length);
    
    for (i=0; i<aziElevR.length; i++) {
        x = Math.cos(aziElevR[i][0])*Math.cos(aziElevR[i][1]);
        y = Math.sin(aziElevR[i][0])*Math.cos(aziElevR[i][1]);
        z = Math.sin(aziElevR[i][1]);
        if (aziElevR[0].length==2) xyz[i] = [x,y,z];
        else if (aziElevR[0].length==3) xyz[i] = [aziElevR[i][2]*x,aziElevR[i][2]*y,aziElevR[i][2]*z];
    }
    return xyz;
}

// computeRealSH computes real spherical harmonics up to order N
function computeRealSH(N, data) {
    
    var azi = new Array(data.length);
    var elev = new Array(data.length);
    
        for (i=0; i<data.length; i++) {
            azi[i] = data[i][0];
            elev[i] = data[i][1];
        }
    
    var factorials = new Array(2*N+1);
    var Ndirs = azi.length;
    var Nsh = (N+1)*(N+1);
    var leg_n_minus1 = 0;
    var leg_n_minus2 = 0;
    var leg_n;
    var sinel = numeric.sin(elev);
    var index_n = 0;
    var Y_N = new Array(Nsh);
    var Nn0, Nnm;
    var cosmazi, sinmazi;
    
    // precompute factorials
    for (i = 0; i < 2*N+1; i++) factorials[i] = factorial(i);
    
    for (n = 0; n<N+1; n++) {
        if (n==0) {
            var temp0 = new Array(azi.length);
            temp0.fill(1);
            Y_N[n] = temp0;
            index_n = 1;
        }
        else {
            leg_n = recurseLegendrePoly(n, sinel, leg_n_minus1, leg_n_minus2);
            Nn0 = Math.sqrt(2*n+1);
            for (m = 0; m<n+1; m++) {
                if (m==0) Y_N[index_n+n] = numeric.mul(Nn0,leg_n[m]);
                else {
                    Nnm = Nn0*Math.sqrt( 2 * factorials[n-m]/factorials[n+m] );
                    cosmazi = numeric.cos(numeric.mul(m,azi));
                    sinmazi = numeric.sin(numeric.mul(m,azi));
                    Y_N[index_n+n-m] = numeric.mul(Nnm, numeric.mul(leg_n[m], sinmazi));
                    Y_N[index_n+n+m] = numeric.mul(Nnm, numeric.mul(leg_n[m], cosmazi));
                }
            }
            index_n = index_n+2*n+1;
        }
        leg_n_minus2 = leg_n_minus1;
        leg_n_minus1 = leg_n;
    }
    
    return Y_N;
}

// factorial compute factorial
function factorial(n) {
    if (n === 0) return 1;
    return n * factorial(n - 1);
}

// recurseLegendrePoly computes associated Legendre functions recursively
function recurseLegendrePoly(n, x, Pnm_minus1, Pnm_minus2) {
    
    var Pnm = new Array(n+1);
    switch(n) {
        case 1:
            var x2 = numeric.mul(x,x);
            var P10 = x;
            var P11 = numeric.sqrt(numeric.sub(1,x2));
            Pnm[0] = P10;
            Pnm[1] = P11;
            break;
        case 2:
            var x2 = numeric.mul(x,x);
            var P20 = numeric.mul(3,x2);
            P20 = numeric.sub(P20,1);
            P20 = numeric.div(P20,2);
            var P21 = numeric.sub(1,x2);
            P21 = numeric.sqrt(P21);
            P21 = numeric.mul(3,P21);
            P21 = numeric.mul(P21,x);
            var P22 = numeric.sub(1,x2);
            P22 = numeric.mul(3,P22);
            Pnm[0] = P20;
            Pnm[1] = P21;
            Pnm[2] = P22;
            break;
        default:
            var x2 = numeric.mul(x,x);
            var one_min_x2 = numeric.sub(1,x2);
            // last term m=n
            var k = 2*n-1;
            var dfact_k = 1;
            if ((k % 2) == 0) {
                for (kk=1; kk<k/2+1; kk++) dfact_k = dfact_k*2*kk;
            }
            else {
                for (kk=1; kk<(k+1)/2+1; kk++) dfact_k = dfact_k*(2*kk-1);
            }
            Pnm[n] = numeric.mul(dfact_k, numeric.pow(one_min_x2, n/2));
            // before last term
            Pnm[n-1] = numeric.mul(2*n-1, numeric.mul(x, Pnm_minus1[n-1])); // P_{n(n-1)} = (2*n-1)*x*P_{(n-1)(n-1)}
            // three term recursence for the rest
            for (m=0; m<n-1; m++) {
                var temp1 = numeric.mul( 2*n-1, numeric.mul(x, Pnm_minus1[m]) );
                var temp2 = numeric.mul( n+m-1, Pnm_minus2[m] );
                Pnm[m] = numeric.div( numeric.sub(temp1, temp2), n-m); // P_l = ( (2l-1)xP_(l-1) - (l+m-1)P_(l-2) )/(l-m)
            }
    }
    return Pnm;
}

// pinv_svd computes the pseudo-inverse using SVD
function pinv_svd(A) {
    var z = numeric.svd(A), foo = z.S[0];
    var U = z.U, S = z.S, V = z.V;
    var m = A.length, n = A[0].length, tol = Math.max(m,n)*numeric.epsilon*foo,M = S.length;
    var i,Sinv = new Array(M);
    for(i=M-1;i!==-1;i--) { if(S[i]>tol) Sinv[i] = 1/S[i]; else Sinv[i] = 0; }
    return numeric.dot(numeric.dot(V,numeric.diag(Sinv)),numeric.transpose(U))
}

// pinv_svd computes the left pseudo-inverse
function pinv_direct(A) {
    var AT = numeric.transpose(A);
    return numeric.dot(numeric.inv(numeric.dot(AT,A)),AT);
}

// computes rotation matrices for real spherical harmonics
function getSHrotMtx(Rxyz, L) {
    
    var Nsh = (L+1)*(L+1);
    // allocate total rotation matrix
    var R = numeric.rep([Nsh,Nsh],0);
    
    // initialize zeroth and first band rotation matrices for recursion
    // Rxyz = [Rxx Rxy Rxz
    //         Ryx Ryy Ryz
    //         Rzx Rzy Rzz]
    //
    // zeroth-band (l=0) is invariant to rotation
    R[0][0] = 1;
    
    // the first band (l=1) is directly related to the rotation matrix
    var R_1 = numeric.rep([3,3],0);
    R_1[0][0] = Rxyz[1][1];
    R_1[0][1] = Rxyz[1][2];
    R_1[0][2] = Rxyz[1][0];
    R_1[1][0] = Rxyz[2][1];
    R_1[1][1] = Rxyz[2][2];
    R_1[1][2] = Rxyz[2][0];
    R_1[2][0] = Rxyz[0][1];
    R_1[2][1] = Rxyz[0][2];
    R_1[2][2] = Rxyz[0][0];
    
    R = numeric.setBlock(R, [1,1], [3,3], R_1);
    var R_lm1 = R_1;
    
    // compute rotation matrix of each subsequent band recursively
    var band_idx = 3;
    for (l=2; l<L+1; l++) {
        
        var R_l = numeric.rep([(2*l+1),(2*l+1)],0);
        for (m=-l; m<l+1; m++) {
            for (n=-l; n<l+1; n++) {
                // compute u,v,w terms of Eq.8.1 (Table I)
                var d, denom, u, v, w;
                if (m==0) d = 1;
                else d = 0; // the delta function d_m0
                if (Math.abs(n)==l) denom = (2*l)*(2*l-1);
                else denom = (l*l-n*n);

                u = Math.sqrt((l*l-m*m)/denom);
                v = Math.sqrt((1+d)*(l+Math.abs(m)-1)*(l+Math.abs(m))/denom)*(1-2*d)*0.5;
                w = Math.sqrt((l-Math.abs(m)-1)*(l-Math.abs(m))/denom)*(1-d)*(-0.5);
                
                // computes Eq.8.1
                if (u!=0) u = u*U(l,m,n,R_1,R_lm1);
                if (v!=0) v = v*V(l,m,n,R_1,R_lm1);
                if (w!=0) w = w*W(l,m,n,R_1,R_lm1);
                R_l[m+l][n+l] = u + v + w;
            }
        }
        R = numeric.setBlock(R, [band_idx+1,band_idx+1], [band_idx+2*l+1,band_idx+2*l+1], R_l);
        R_lm1 = R_l;
        band_idx = band_idx + 2*l+1;
    }
    return R;
}

// functions to compute terms U, V, W of Eq.8.1 (Table II)
function U(l,m,n,R_1,R_lm1) {
    
    return P(0,l,m,n,R_1,R_lm1);
}

function V(l,m,n,R_1,R_lm1) {
    
    var p0, p1, ret, d;
    if (m==0) {
        p0 = P(1,l,1,n,R_1,R_lm1);
        p1 = P(-1,l,-1,n,R_1,R_lm1);
        ret = p0+p1;
    }
    else if (m>0) {
        if (m==1) d = 1;
        else d = 0;
        p0 = P(1,l,m-1,n,R_1,R_lm1);
        p1 = P(-1,l,-m+1,n,R_1,R_lm1);
        ret = p0*Math.sqrt(1+d) - p1*(1-d);
    }
    else {
        if (m==-1) d = 1;
        else d = 0;
        p0 = P(1,l,m+1,n,R_1,R_lm1);
        p1 = P(-1,l,-m-1,n,R_1,R_lm1);
        ret = p0*(1-d) + p1*Math.sqrt(1+d);
    }
    return ret;
}

function W(l,m,n,R_1,R_lm1) {
    
    var p0, p1, ret;
    if (m==0) {
        console.error("should not be called");
    }
    else {
        if (m>0) {
            p0 = P(1,l,m+1,n,R_1,R_lm1);
            p1 = P(-1,l,-m-1,n,R_1,R_lm1);
            ret = p0 + p1;
        }
        else {
            p0 = P(1,l,m-1,n,R_1,R_lm1);
            p1 = P(-1,l,-m+1,n,R_1,R_lm1);
            ret = p0 - p1;
        }
    }
    return ret;
}

// function to compute term P of U,V,W (Table II)
function P(i,l,a,b,R_1,R_lm1) {
    
    var ri1, rim1, ri0, ret;
    ri1 = R_1[i+1][1+1];
    rim1 = R_1[i+1][-1+1];
    ri0 = R_1[i+1][0+1];
    
    if (b==-l) {
        ret = ri1*R_lm1[a+l-1][0] + rim1*R_lm1[a+l-1][2*l-2];
    }
    else {
        if (b==l) ret = ri1*R_lm1[a+l-1][2*l-2] - rim1*R_lm1[a+l-1][0];
        else ret = ri0*R_lm1[a+l-1][b+l-1];
    }
    return ret;
}

// yawPitchRoll2Rzyx computes the rotation matrix from ZY'X'' rotation angles
function yawPitchRoll2Rzyx(yaw, pitch, roll) {
    
    var Rx, Ry, Rz;
    if (roll == 0) Rx = [[1,0,0],[0,1,0],[0,0,1]];
    else Rx = [[1, 0, 0], [0, Math.cos(roll), Math.sin(roll)], [0, -Math.sin(roll), Math.cos(roll)]];
    if (pitch == 0) Ry = [[1,0,0],[0,1,0],[0,0,1]];
    else Ry = [[Math.cos(pitch), 0, -Math.sin(pitch)], [0, 1, 0], [Math.sin(pitch), 0, Math.cos(pitch)]];
    if (yaw == 0) Rz = [[1,0,0],[0,1,0],[0,0,1]];
    else Rz = [[Math.cos(yaw), Math.sin(yaw), 0], [-Math.sin(yaw), Math.cos(yaw), 0], [0, 0, 1]];
    
    R = numeric.dotMMsmall(Ry,Rz);
    R = numeric.dotMMsmall(Rx,R);
    return R;
}
