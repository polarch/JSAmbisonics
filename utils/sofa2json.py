# Contributed by Antti Vanne, 4/2017

import h5py
import json
import sys


def sofa2json(sofafilename):
    s = {}
    s["name"] = sofafilename
    sofa = h5py.File(sofafilename)

    leaves = []
    # specify which datasets to convert to json
    leavelist = ["ListenerPosition", "ListenerUp", "ListenerView", "ReceiverPosition", "SourcePosition", "EmitterPosition", "Data.SamplingRate", "Data.Delay", "Data.IR"]

    for leave in leavelist:
        if leave not in sofa.keys():
            raise Exception("Unknown dataset: %s" % leave)
        cur = {}
        cur["name"] = leave
        cur["type"] = sofa[leave].dtype.name  # not a capital F in float64 for example

        attrs = []
        for k in sofa[leave].attrs.keys():
            if k == "DIMENSION_LIST":
                continue
            attrs.append({"name": k, "value": [sofa[leave].attrs[k]]})
        cur["attributes"] = attrs
        cur["shape"] = sofa[leave].shape
        cur["data"] = sofa[leave].value.tolist()
        leaves.append(cur)

    s["leaves"] = leaves

    return json.dumps(s)


if __name__ == "__main__":
    asjson = sofa2json(sys.argv[1])
    open(sys.argv[1] + ".json", "w").write(asjson)
