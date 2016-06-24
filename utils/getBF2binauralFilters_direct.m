function [h_bf2bin, H_bf2bin] = getBF2binauralFilters_direct(hrirs, dirsAziElev, samplingWeights)
%getBF2binauralFilters_direct Summary of this function goes here
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
%   The B-format convention of [o/sqrt(2) x y z] is assumed, where o is a 
%   unit omnidirectional component, and x,y,z unit normalized dipoles.
%
%   Requires the Spherical Harmonic Transform library for computation of
%   spherical sampling weights, if they are not provided.
%
%   https://github.com/polarch/Spherical-Harmonic-Transform
%
%   Archontis Politis, archontis.politis@aalto.fi
%

if nargin<3
    samplingWeights = getVoronoiWeights(dirsAziElev);
end
nDirs = length(dirsAziElev);

% construct B-format for directions
xyz = zeros(nDirs,3);
[xyz(:,1), xyz(:,2), xyz(:,3)] = sph2cart(dirsAziElev(:,1), dirsAziElev(:,2), 1);
getBF = @(dirs) [ones(size(dirs,1),1)/sqrt(2) xyz];

% go to frequency domain
lhrirs = size(hrirs,1);
HRTFs = fft(hrirs,2^nextpow2(lhrirs),1);
% keep positive frequencies
lhrirs = 2^nextpow2(lhrirs);
nBands = lhrirs/2+1;
HRTFs = HRTFs((1:nBands),:,:);
% get weighted least-squares inversion
BF_meas = getBF(dirsAziElev).';
W_meas = diag(samplingWeights);
pinvBF = W_meas*BF_meas' * inv(BF_meas*W_meas*BF_meas'+10^-8);
nSets = size(HRTFs,3);
H_bf2bin = zeros(nBands, 4, nSets);
for ns = 1:nSets
    H_set = squeeze(HRTFs(:,:,ns));
    H_bf2bin(:,:,ns) = H_set*pinvBF;
end
% get impulse response
tempH = [H_bf2bin; conj(H_bf2bin(end-1:-1:2,:,:))];
h_bf2bin = real(ifft(tempH,[],1));

end
