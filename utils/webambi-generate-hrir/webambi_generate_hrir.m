%% Convert HRIR to Ambisonic Binaural Impulse Responses (ABIR)
% 
% This script converts any HRIR set from the LISTEN database
% (http://recherche.ircam.fr/equipes/salles/listen/download.html)
% to a set of IRs that can be directly convolved with Ambisonic channels
% for binaural listening.
% 
% The "conversion" is based on a hardcoding of the Ambisonic decoding stage
% into the final IR resulting set, using the virtual speaker approach to
% produce the final binaural rendering.
% 
% designed to support the WebAmbiJS library 
% (https://github.com/polarch/JSAmbisonics)
% 
% Requirements:
%  - Polarch's HOA toolbox (github.com/polarch/Higher-Order-Ambisonics)
% 
% Author: David Poirier-Quinot
% IRCAM-CNRS
% 06/2016

%% Initialization
clear all, close all

% Set current folder to script's location
cd( fileparts( mfilename('fullpath') ) );

% Define IOs paths (where to find HRIR set and save resulting ABIR set)
dirName_in  = fullfile( pwd, 'data_in' );
dirName_out = fullfile( pwd, 'data_out' );

% Define current HRIR set to convert
hrir_base_name    = 'IRC_1008_R_HRIR'; 
filename_in       = fullfile( dirName_in, [hrir_base_name '.mat'] );
filename_out_main = fullfile( dirName_out, hrir_base_name );
 
% Load HRIR set
load( filename_in, 'l_hrir_S', 'r_hrir_S' );
sampling_hz = l_hrir_S.sampling_hz;
LISTEN_RADIUS = 1.95; % m

%% Define virtual speaker array based on HRIR set measurement grid

speakers_pos_sph_v = [ 
    deg2rad( l_hrir_S.azim_v ), ...
    deg2rad( l_hrir_S.elev_v ), ...
    LISTEN_RADIUS * ones( size( l_hrir_S.elev_v ) ) ];

speakers_pos_cart_v = speakers_pos_sph_v;
for i = 1:size( speakers_pos_cart_v, 1 );
    [ x, y, z ] = sph2cart(  ...
    speakers_pos_sph_v(i,1), ...
    speakers_pos_sph_v(i,2), ...
    speakers_pos_sph_v(i,3)  ...
    );
    speakers_pos_cart_v(i,:) = [x,y,z];
end

% Plot measurement / virtual speaker grid
plot3(speakers_pos_cart_v(:,1),speakers_pos_cart_v(:,2),speakers_pos_cart_v(:,3),'.', 'MarkerSize', 16);
title('HRIR measurement / virtual speaker grid', 'Fontsize', 16); grid

%% Get Ambisonic decode matrix

maximumOrder_n = 3;

% Define virtual speaker array based on HRIR set measurement grid        
ls_dirs = rad2deg(speakers_pos_cart_v(:,1:2));

% Get HOA decoding matrix (POLARCH)
method = 'ALLRAD';
rE_WEIGHT = 0;
[ matrix_decode_m, order ] = ambiDecoder ( ls_dirs, method, rE_WEIGHT, maximumOrder_n );



%% Extract HRIRs of each virtual speaker position from input HRIR set
% Note: since the virtual speaker grid is here defined based on said
% HRIR set measurement points, this stage is useless (but may be necessary
% if another virtual speaker grid geometry is to be used).

% predefined equivalents of l_hrir_S.content_m but with only hrir values
% that match virtual speaker's positions
l_hrir_m = zeros( size(matrix_decode_m, 1), size(l_hrir_S.content_m,2) );
r_hrir_m = l_hrir_m;

for i = 1:size( matrix_decode_m, 1 )
    azim_n = round( rad2deg( speakers_pos_sph_v(i,1) ), 3 );
    elev_n = round( rad2deg( speakers_pos_sph_v(i,2) ), 3 );
    
    indices_azim_v = find(l_hrir_S.azim_v == azim_n);
    indices_elev_v = find(l_hrir_S.elev_v == elev_n);
    
    if isempty(indices_azim_v) || isempty(indices_elev_v);
        error('HRTF and speaker position does not match');
    end
    index_match_n = intersect(indices_elev_v, indices_azim_v);
    
    l_hrir_m(i,:) = l_hrir_S.content_m(index_match_n,:);
    r_hrir_m(i,:) = r_hrir_S.content_m(index_match_n,:);
end


%% Combine Ambisonic decoding with HRIRs
% Sum relevant weighted HRIR for each ambisonic channel

n_ambi_channels = size(matrix_decode_m,2);
num_samples_in_hrir = size(l_hrir_S.content_m,2);

l_abir_m = zeros( n_ambi_channels, num_samples_in_hrir);
r_abir_m = l_abir_m;

for index = 1:n_ambi_channels;
    channelGains = repmat( matrix_decode_m(:,index), 1, num_samples_in_hrir );

    weighted_hrir = channelGains .* l_hrir_m;
    l_abir_m( index, : ) = sum(weighted_hrir,1);

    weighted_hrir = channelGains .* r_hrir_m;
    r_abir_m( index, : ) = sum(weighted_hrir,1);
end

%% Shape ABIR to use with JSHlib

% interleave
out_raw = reshape([l_abir_m(:) r_abir_m(:)].',2*size(l_abir_m,1),size(l_abir_m,2));

max_hrir = max(max(max(abs(l_hrir_S.content_m))), max(max(abs(r_hrir_S.content_m))));
max_abir = max(max(abs(out_raw)));
norm_factor = max_abir / max_hrir;

% save as splitted wavefiles
NumChannelPerFile = 8;
for i = 1:size(out_raw,1)/NumChannelPerFile;
    index_low = 1 + (i-1)*NumChannelPerFile;
    index_high = i*NumChannelPerFile;
    
    audio_out_name = [filename_out_main sprintf('_%s-%sch.wav', sprintf('%2.2d',index_low), sprintf('%2.2d', index_high))];
    audio_out = out_raw(index_low:index_high, :) / norm_factor;
    
    % delete current file if exists
    if exist(audio_out_name,'file') == 2; delete(audio_out_name); end

    % write file
    audiowrite(audio_out_name, audio_out.' ,sampling_hz, 'BitsPerSample', 16);
    fprintf('file created: \t %s \n', audio_out_name);
end