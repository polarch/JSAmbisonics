function h_hoa2bin = getHOA2binauralFilters_virtual(order, hrirs, dirsAziElev, useRawArray)
%getHOA2binauralFilters_virtual Summary of this function goes here
%
%   Converts an HRIR set to a set of IRs that can be directly convolved 
%   with Ambisonic channels for binaural listening.
%   The "conversion" is based on a hardcoding of the Ambisonic decoding 
%   stage into the final IR resulting set, using the virtual speaker
%   approach to produce the final binaural rendering.
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
%   Authors:
%   Archontis Politis, archontis.politis@aalto.fi
%   David Poirier-Quinot, david.poirier-quinot@ircam.fr

%% Handle arguments
if nargin < 4; useRawArray = false; end

%% Get Ambisonic decode matrix

if ~useRawArray;
    % Define virtual speaker array based on HRIR set measurement grid
    [~, ls_dirs_rad_orig] = getTdesign(2*order);

    % Find closest HRIRs in the set and return actual directions
    [hrirs_closest, ls_dirs_rad] = getClosestHRIRs(hrirs.', dirsAziElev, ls_dirs_rad_orig);
    
    rE_WEIGHT = 1;
else
    % Every HRIR in the set is considered as a virtual speaker. Non-optimal
    % method, yet some prefer how the resulting hoa irs sound. use at your
    % own risk.
    hrirs_closest = hrirs.';
    ls_dirs_rad = deg2rad(dirsAziElev);
    rE_WEIGHT = 0;
end

% Get HOA decoding matrix
method = 'ALLRAD';
M_dec = ambiDecoder ( rad2deg(ls_dirs_rad), method, rE_WEIGHT, order );

%% Combine Ambisonic decoding with HRIRs

nHRIR = size(M_dec,2);
lHRIR = size(hrirs_closest,1);
nSets = size(hrirs_closest,3);

h_hoa2bin = zeros(lHRIR, nHRIR, nSets);

for ns = 1:nSets
    h_hoa2bin(:,:,ns) = hrirs_closest(:,:,ns) * M_dec;
end

end
