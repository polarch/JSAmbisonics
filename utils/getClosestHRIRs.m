function [hrirs_closest, dirs_closest] = getClosestHRIRs(hrirs, dirsMeas, dirsGet)

nDirsAll = size(dirsMeas,1);
nDirsGet = size(dirsGet,1);

xyz_all = unitSph2cart(dirsMeas);
xyz_get = unitSph2cart(dirsGet);

idx_closest = zeros(nDirsGet,1);
for nd=1:nDirsGet
    [~, idx_closest(nd)] = max(dot(xyz_all, repmat(xyz_get(nd,:),nDirsAll,1), 2));
end
    
    hrirs_closest = hrirs(:,idx_closest,:);
    dirs_closest = dirsMeas(idx_closest,:);
end