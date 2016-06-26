function [h_hoa2bin, H_hoa2bin] = getHOA2binauralFilters_direct(order, hrirs, dirsAziElev, samplingWeights)
%getHOA2binauralFilters_direct Summary of this function goes here
%
%   The HRIRs should be passed as column vectors in the format 
%   hrirs = [h1, h2, ..., hK] 
%   for K measurement points, and the respective directions should be given as
%   dirsAziElev = [azi1 elev1; azi2 elev2; ...; aziK elevK]
%   in radians.
%
%   Multiple sets measured at the same grid (e.g. left and right HRIRs)
%   should be concatanated along the third dimension
%   hrirs(:,:,1) = hrirs_set1;
%   hrirs(;,:,2) = hrirs_set2;
%   etc.
%
%   The HOA convention is for real orthonormalized (N3D) SHs, and can be 
%   found in the function getRSH.m
%
%   Requires the Spherical Harmonic Transform library for computation of
%   spherical sampling weights, if they are not provided.
%
%   https://github.com/polarch/Spherical-Harmonic-Transform
%
%   Archontis Politis, archontis.politis@aalto.fi
%

if nargin < 4
    samplingWeights = getVoronoiWeights(dirsAziElev);
end
nDirs = length(dirsAziElev);
nSH = (order+1)^2;

% go to frequency domain
lhrirs = size(hrirs,1);
HRTFs = fft(hrirs,2^nextpow2(lhrirs),1);
% keep positive frequencies
lhrirs = 2^nextpow2(lhrirs);
nBands = lhrirs/2+1;
HRTFs = HRTFs((1:nBands),:,:);
% get weighted least-squares inversion
SH_meas = getRSH(order, dirsAziElev*180/pi)*sqrt(4*pi);
W_meas = diag(samplingWeights);
pinvSH = W_meas*SH_meas' * inv(SH_meas*W_meas*SH_meas');
nSets = size(HRTFs,3);
H_hoa2bin = zeros(nBands, nSH, nSets);
for ns = 1:nSets
    H_set = squeeze(HRTFs(:,:,ns));
    H_hoa2bin(:,:,ns) = H_set*pinvSH;
end
% get impulse response
tempH = [H_hoa2bin; conj(H_hoa2bin(end-1:-1:2,:,:))];
h_hoa2bin = real(ifft(tempH,[],1));

end
