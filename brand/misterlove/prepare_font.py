"""Prepare the approved web font at weight 800 without changing its outlines."""
import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

source, output = map(Path, sys.argv[1:3])
font = TTFont(source)
font = instantiateVariableFont(font, {"wght": 800}, inplace=True)
font.flavor = None
font.recalcTimestamp = False
font.save(output)
cmap = font.getBestCmap()
glyph = font["glyf"][cmap[ord("m")]]
glyph.recalcBounds(font["glyf"])
print(json.dumps({
    "family": "Manrope",
    "weight": 800,
    "unitsPerEm": font["head"].unitsPerEm,
    "lowercaseMHeight": glyph.yMax - glyph.yMin,
    "source": str(source),
}))
