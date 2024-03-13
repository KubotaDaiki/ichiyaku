import p5 from "p5";
import { interpolate } from "flubber";
import "./style.css";
import pj from "./processingProjectFile/processedProjectFile.json";

const sketch = (p: p5) => {
  const halfSvgSize = 100;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL); // Y軸での回転を可能にするためWEBGLモードを使用
    p.angleMode(p.DEGREES);
  };

  p.draw = () => {
    const maxTime = pj.slice(-1)[0].time;
    const currentTime = (p.millis() / 1000) % maxTime;
    const currentTimeCount =
      pj.findIndex((item) => item.time > currentTime) - 1;

    // 現在の時間で表示するプロジェクトファイル内のアイテムを取得
    const item = pj[currentTimeCount];
    const nextItem = pj[currentTimeCount + 1];

    // アニメーション用の係数を計算
    const coefficient = easeInOutCirc(
      (currentTime - item.time) / (nextItem.time - item.time)
    );

    // svgから点（座標）を抽出
    const points = extractPointsFromSvg(item.svgs);
    const nextPoints = extractPointsFromSvg(nextItem.svgs);

    p.clear();
    p.scale(1.5);
    p.noStroke();
    p.fill(255);

    // 次の漢字に引き継ぐ部品のアニメーションを描画
    for (let i = 0; i < item.next.length; i++) {
      drawHikitugiBuhin(
        coefficient,
        points[item.next[i]],
        nextPoints[nextItem.prev[i]]
      );
    }

    if (coefficient < 0.5) {
      // 引き継がない部品の退場アニメーションを描画
      p.rotateY(coefficient * 2 * -90);
      for (let i = 0; i < points.length; i++) {
        if (item.next.includes(i)) continue;
        appear(points[i]);
      }
    } else {
      // 引き継がない部品の登場アニメーションを描画
      p.rotateY((1 - (coefficient - 0.5) * 2) * 90);
      for (let i = 0; i < nextPoints.length; i++) {
        if (nextItem.prev.includes(i)) continue;
        appear(nextPoints[i]);
      }
    }
  };

  function easeInOutCirc(x: number): number {
    return x < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
  }

  function extractPointsFromSvg(svgs: string[]) {
    const domParser = new DOMParser();
    const pointsList = svgs.map((svg) => {
      const parsedSVGDoc = domParser.parseFromString(svg, "image/svg+xml");
      const paths = parsedSVGDoc.getElementsByTagName("polygon");
      const points = [...paths].map((path) => {
        return [...path.points].map((point) => [point.x, point.y]);
      });
      return points;
    });
    return pointsList;
  }

  function drawHikitugiBuhin(
    coefficient: number,
    points: number[][][],
    nextPoints: number[][][]
  ) {
    for (let i = 0; i < points.length; i++) {
      p.beginShape();
      const interpolator = interpolate(points[i], nextPoints[i], { string: false });
      const xy = interpolator(coefficient);
      for (let j = 0; j < xy.length; j++) {
        const x = xy[j][0] - halfSvgSize;
        const y = xy[j][1] - halfSvgSize;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }

  function appear(points: number[][][]) {
    for (let i = 0; i < points.length; i++) {
      p.beginShape();
      for (let j = 0; j < points[i].length; j++) {
        const x = points[i][j][0] - halfSvgSize;
        const y = points[i][j][1] - halfSvgSize;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }
};

new p5(sketch);
