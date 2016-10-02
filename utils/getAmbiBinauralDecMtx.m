function M_dec = getAmbiBinauralDecMtx(hrtf_dirs, order)

%% triangulation
vertices = unitSph2cart(hrtf_dirs*pi/180);
faces = convhulln(vertices);
Ntri = size(faces, 1);

%% inversion
% pre-calculate inversions of the speaker groups and store into matrix
layoutInvMtx = zeros(Ntri, 9);
for n = 1:Ntri
    
    % get the unit vectors for the current group
    tempGroup = vertices(faces(n,:), :);
    
    % get inverse of current group
    tempInv = eye(3) / tempGroup;
    tempInv = tempInv(:); % vectorise the inverse matrix by stacking columns
    layoutInvMtx(n, :) = tempInv; % store the vectorized inverse as a row the output
end

%% allrad
% t-value for the t-design
t = 2*order + 1;
% vbap gains for selected t-design
[~, t_dirs_rad] = getTdesign(t);
G_td = vbap3(t_dirs_rad, faces, layoutInvMtx).';

% spherical harmonic matrix for t-design
% convert to [azimuth zenith] for SH convention
Y_td = getRSH(order, t_dirs_rad*180/pi).'*sqrt(4*pi);

% allrad decoder
Ntd = size(t_dirs_rad,1);
M_dec = 1/Ntd * G_td * Y_td;

end


%%%%%%%%%%%%%%%%%%%%%%%%%%%
function GainMtx = vbap3(dirs, ls_groups, ls_invMtx)

src_num = size(dirs,1);
ls_num = max(ls_groups(:));

GainMtx = zeros(src_num, ls_num);

for ns=1:src_num
    u = unitSph2cart(dirs(ns,:));
    
    gains = zeros(1,ls_num);
    for i=1:size(ls_groups,1);
        g_tmp(1) = ls_invMtx(i,1:3) * u';
        g_tmp(2) = ls_invMtx(i,4:6) * u';
        g_tmp(3) = ls_invMtx(i,7:9) * u';
        if min(g_tmp) > -0.001
            gains(ls_groups(i,:)) = g_tmp/sqrt(sum(g_tmp.^2));
            break
        end
    end
    
    gains = gains/sqrt(sum(gains.^2));
    
    GainMtx(ns,:) = gains;
end

end
