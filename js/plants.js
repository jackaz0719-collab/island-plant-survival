(function () {
  "use strict";

  const categoryLabels = {
    famine: "救荒植物",
    invasive: "外来種",
    poison: "有毒植物",
    native: "在来種"
  };

  const plants = [
    { name: "ヨモギ", category: "famine", note: "切れ込みのある葉と強い香りが特徴。道端や草地で見つかりやすい。" },
    { name: "ノビル", category: "famine", note: "細長い葉を伸ばし、地面の下に小さな丸い部分をつくる。" },
    { name: "スベリヒユ", category: "famine", note: "地面をはうように広がり、厚みのある葉と赤みのある茎をもつ。" },
    { name: "タンポポ", category: "famine", note: "ぎざぎざした葉を地面近くに広げ、黄色い花を咲かせる。" },
    { name: "セリ", category: "famine", note: "水辺に生えやすく、細かく分かれた葉と独特の香りがある。" },
    { name: "カラスノエンドウ", category: "famine", note: "つるを伸ばし、小さな豆のさやをつける身近な野草。" },
    { name: "オオキンケイギク", category: "invasive", note: "鮮やかな黄色い花を多く咲かせ、群れになって広がることがある。" },
    { name: "セイタカアワダチソウ", category: "invasive", note: "背が高く、秋に黄色い花を穂のようにつける。" },
    { name: "アレチウリ", category: "invasive", note: "つるを長く伸ばし、周囲の植物にからみつく。" },
    { name: "オオハンゴンソウ", category: "invasive", note: "大きめの黄色い花をつけ、まとまって生えることがある。" },
    { name: "ナガエツルノゲイトウ", category: "invasive", note: "水辺で茎を長く伸ばし、白い丸い花をつける。" },
    { name: "ワルナスビ", category: "invasive", note: "鋭いとげがあり、紫がかった花と小さな実をつける。" },
    { name: "ドクゼリ", category: "poison", note: "水辺に生え、セリに似た細かい葉をつける。地下部が太く目立つ。" },
    { name: "ヒガンバナ", category: "poison", note: "秋に赤い花を咲かせ、花の時期には葉がほとんど見えない。" },
    { name: "スイセン", category: "poison", note: "細長い葉を束にして伸ばし、白や黄色の花を咲かせる。" },
    { name: "トリカブト", category: "poison", note: "深く切れ込んだ葉と、かぶとのような形の花が特徴。" },
    { name: "オオバコ", category: "native", note: "踏まれやすい道端にも生え、葉脈がはっきりした広い葉をもつ。" },
    { name: "ツユクサ", category: "native", note: "湿った場所で見つかりやすく、青い花を咲かせる。" },
    { name: "カタバミ", category: "native", note: "ハート形の小葉が3枚集まり、小さな黄色い花をつける。" },
    { name: "ツワブキ", category: "native", note: "丸く厚い葉を広げ、黄色い花を茎の先につける。" }
  ];

  window.PlantData = {
    plants,
    categoryLabels,
    byCategory(category) {
      return plants.filter((plant) => plant.category === category);
    },
    imagePath(name) {
      return `Image/${name}.png`;
    }
  };
})();
