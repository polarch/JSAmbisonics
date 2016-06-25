function [h_hoa2bin_l, h_hoa2bin_r] = getHOA2binauralFilters_virtual(order, hrirs_l, hrirs_r, dirsAziElev)
%getHOA2binauralFilters_virtual Converts HRIRs to HOA HRIRs
% 
%   converts an HRIR set to a set of IRs that can be directly convolved 
%   with Ambisonic channels for binaural listening.
%   The "conversion" is based on a hardcoding of the Ambisonic decoding 
%   stage into the final IR resulting set, using the virtual speaker
%   approach to produce the final binaural rendering.
%
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
%
%   Requires the Higher-Order-Ambisonics library for computation of
%   the Ambisonic decoding matrix
%
%   https://github.com/polarch/Higher-Order-Ambisonics
%
%   Authors:
%   Archontis Politis, archontis.politis@aalto.fi
%   David Poirier-Quinot, david.poirier-quinot@ircam.fr

%% Define virtual speaker array based on HRIR set measurement grid

RADIUS = 1.95; % LISTEN database radius, doesn't matter much though

speakers_pos_sph_v = [ 
    deg2rad( dirsAziElev(:,1) ), ...
    deg2rad( dirsAziElev(:,2) ), ...
    RADIUS * ones( size( dirsAziElev(:,1) ))];

speakers_pos_cart_v = speakers_pos_sph_v;
for i = 1:size( speakers_pos_cart_v, 1 );
    [ x, y, z ] = sph2cart(  ...
    speakers_pos_sph_v(i,1), ...
    speakers_pos_sph_v(i,2), ...
    speakers_pos_sph_v(i,3)  ...
    );
    speakers_pos_cart_v(i,:) = [x,y,z];
end

% % Plot measurement / virtual speaker grid
% plot3(speakers_pos_cart_v(:,1),speakers_pos_cart_v(:,2),speakers_pos_cart_v(:,3),'.', 'MarkerSize', 16);
% title('HRIR measurement / virtual speaker grid', 'Fontsize', 16); grid

%% Get Ambisonic decode matrix

% Define virtual speaker array based on HRIR set measurement grid        
ls_dirs = rad2deg(speakers_pos_sph_v(:,1:2));

% Get HOA decoding matrix
method = 'ALLRAD';
rE_WEIGHT = 0;
[ matrix_decode_m, ~ ] = ambiDecoder ( ls_dirs, method, rE_WEIGHT, order );

%% Extract HRIRs of each virtual speaker position from input HRIR set
% Note: since the virtual speaker grid is here defined based on said
% HRIR set measurement points, this stage is useless (but may be necessary
% if another virtual speaker grid geometry is to be used).

% equivalents input hrir set but with only hrir values
% that match defined virtual speaker positions
l_hrir_m = zeros( size(matrix_decode_m, 1), size(hrirs_l, 2) );
r_hrir_m = l_hrir_m;

for i = 1:size( matrix_decode_m, 1 )
    azim_n = round( rad2deg( speakers_pos_sph_v(i,1) ), 3 );
    elev_n = round( rad2deg( speakers_pos_sph_v(i,2) ), 3 );
    
    indices_azim_v = find(dirsAziElev(:,1) == azim_n);
    indices_elev_v = find(dirsAziElev(:,2) == elev_n);
    
    if isempty(indices_azim_v) || isempty(indices_elev_v);
        error('HRTF and speaker position does not match');
    end
    index_match_n = intersect(indices_elev_v, indices_azim_v);
    
    l_hrir_m(i,:) = hrirs_l(index_match_n,:);
    r_hrir_m(i,:) = hrirs_r(index_match_n,:);
end

%% Combine Ambisonic decoding with HRIRs
% Sum relevant weighted HRIR for each ambisonic channel

n_ambi_channels = size(matrix_decode_m,2);
num_samples_in_hrir = size(hrirs_l,2);

h_hoa2bin_l = zeros( n_ambi_channels, num_samples_in_hrir);
h_hoa2bin_r = h_hoa2bin_l;

for index = 1:n_ambi_channels;
    channelGains = repmat( matrix_decode_m(:,index), 1, num_samples_in_hrir );

    weighted_hrir = channelGains .* l_hrir_m;
    h_hoa2bin_l( index, : ) = sum(weighted_hrir,1);

    weighted_hrir = channelGains .* r_hrir_m;
    h_hoa2bin_r( index, : ) = sum(weighted_hrir,1);
end


end
