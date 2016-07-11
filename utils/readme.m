%%  README - How to use Matlab routines
% 
%   This script illustrates how to use the Matlab routines in this folder 
%   to create Ambisonic Head Related Impulse Responses. These IRs are used 
%   in the webaudio ambisonic lib, convolved with Ambisonic channels for 
%   direct Ambisonic to binaural decoding (i.e. listening over headphone 
%   to an audio field encoded as Ambisonic channels.
% 
%   Two approaches are supported to create the Ambisonic HRIRs: 1)
%   projection of the HRIRs on Spherical Harmonics, and 2) binaural
%   listening of the Ambisonic sound field decoded on a set of virtual
%   speakers.
% 
%   Authors:
%   Archontis Politis, archontis.politis@aalto.fi
%   David Poirier-Quinot, david.poirier-quinot@ircam.fr

%% Init

% Set current folder to script's location
cd( fileparts( mfilename('fullpath') ) );

% Select encoding approach
available_approach = {'DIRECT','VIRTUAL'};
ENCODING_APPROACH = available_approach{2};

%% Load HRIR

hrir_base_name = 'IRC_1008_R_HRIR'; % see README.md for download instructions
hrir_filename = fullfile( pwd, [hrir_base_name '.mat'] );
load( hrir_filename, 'l_hrir_S', 'r_hrir_S' );

%% Generate SH HRIR

order = 3;
dirsAziElev  = [l_hrir_S.azim_v, l_hrir_S.elev_v];

switch ENCODING_APPROACH,
    case 'DIRECT',
        hrirs = r_hrir_S.content_m.';
        dirsAziElev(:,1) = 360 - dirsAziElev(:,1); % coordinate system mod
        dirsAziElev = deg2rad(dirsAziElev);
        [h_hoa2bin, H_hoa2bin] = getHOA2binauralFilters_direct(order, hrirs, dirsAziElev);

    case 'VIRTUAL', 
        hrirs_l = l_hrir_S.content_m;
        hrirs_r = r_hrir_S.content_m;
        useRawArray = true;
        h_hoa2bin = getHOA2binauralFilters_virtual(order, hrirs_l, dirsAziElev, useRawArray);
end

%% Save IRs to use with JSHlib

filepath = pwd;
filename = [hrir_base_name '_' ENCODING_APPROACH '.wav'];
fs_in = l_hrir_S.sampling_hz;
sig = h_hoa2bin / max(sum(abs(h_hoa2bin))); % normalization
audiowriteHOA(order, filepath, filename, sig, fs_in);