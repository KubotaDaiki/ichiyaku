import fs from "fs";
import { Kage, Polygons } from "@kurgm/kage-engine";

class KageCustom extends Kage {
  generateDecomposedSVG(buhin: string) {
    let svgs = [];
    let glyphData = this.kBuhin.search(buhin);
    if (glyphData !== "") {
      let strokesArray = this.getEachStrokes(glyphData);
      strokesArray.forEach((stroke) => {
        const polygon = new Polygons();

        let drawers = this.kFont.getDrawers([stroke]);
        for (let _i = 0, drawers_1 = drawers; _i < drawers_1.length; _i++) {
          let draw = drawers_1[_i];
          draw(polygon);
        }
        svgs.push(polygon.generateSVG());
      });
    }
    return svgs;
  }
}

// 全グリフデータを読み込み、リストに格納
const allGlyphText = fs.readFileSync(
  "./src/processingProjectFile/dump_newest_only.txt",
  "utf-8"
);
const allGlyphList = allGlyphText.split("\n").map((glyph) => {
  return glyph.split("|");
});

// グリフをKageクラスに登録
const kage = new KageCustom();
allGlyphList.forEach((glyph) => {
  if (glyph.length < 3) return;

  const name = glyph[0].trim();
  const data = glyph[2].trim();
  kage.kBuhin.push(name, data);
});

// プロジェクトファイルにsvgデータを追加したJSONを生成
const processedProjectFile: any = [
  {
    time: 0,
    kanji: "",
    prev: [],
    next: [],
    svgs: [""],
  },
];
const projectFile = JSON.parse(
  fs.readFileSync("./src/projectFile.json", "utf-8")
);
projectFile.forEach((glyph: any) => {
  const buhin = "u" + glyph.kanji.codePointAt(0).toString(16);
  const svgs = kage.generateDecomposedSVG(buhin);
  processedProjectFile.push({ ...glyph, svgs: svgs });
});

// 作成したJSONをファイルとして出力
fs.writeFileSync(
  "./src/processingProjectFile/processedProjectFile.json",
  JSON.stringify(processedProjectFile, null, " ")
);
