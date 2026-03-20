const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let layers = [];
let selectedLayer = null;

// PRODUCT IMAGE
let productImage = new Image();
productImage.src = "shirt.png"; // or replace with URL

// ADD TEXT
function addText() {
  const layer = {
    type: "text",
    text: "Text",
    x: 150,
    y: 250,
    size: 30,
    color: "#ffffff",
    outline: "#000000",
    outlineWidth: 2,
    font: "Arial",
    align: "left"
  };
  layers.push(layer);
  selectedLayer = layer;
  updateUI();
}

// ADD LOGO
function addLogo() {
  document.getElementById("upload").click();
}

// UPLOAD IMAGE
document.getElementById("upload").addEventListener("change", e => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    let img = new Image();
    img.onload = () => {
      const layer = {
        type: "image",
        img: img,
        x: 120,
        y: 150,
        w: 120,
        h: 120
      };
      layers.push(layer);
      selectedLayer = layer;
      updateUI();
    };
    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

// DRAW
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(productImage, 0, 0, canvas.width, canvas.height);

  layers.forEach(layer => {
    if (layer.type === "text") {
      ctx.font = layer.size + "px " + layer.font;
      ctx.textAlign = layer.align;

      ctx.lineWidth = layer.outlineWidth;
      ctx.strokeStyle = layer.outline;
      ctx.strokeText(layer.text, layer.x, layer.y);

      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, layer.x, layer.y);
    }

    if (layer.type === "image") {
      ctx.drawImage(layer.img, layer.x, layer.y, layer.w, layer.h);
    }
  });
}

// UI
function updateUI() {
  const list = document.getElementById("layers");
  list.innerHTML = "";

  layers.forEach((l, i) => {
    let div = document.createElement("div");
    div.className = "layer-item " + (l === selectedLayer ? "active" : "");
    div.innerText = l.type + " " + (i + 1);

    div.onclick = () => {
      selectedLayer = l;
      updateUI();
    };

    list.appendChild(div);
  });

  draw();
}

// CONTROLS
document.getElementById("textInput").oninput = e => {
  if (selectedLayer?.type === "text") {
    selectedLayer.text = e.target.value;
    draw();
  }
};

document.getElementById("fontSelect").onchange = e => {
  if (selectedLayer?.type === "text") {
    selectedLayer.font = e.target.value;
    draw();
  }
};

document.getElementById("textColor").oninput = e => {
  if (selectedLayer?.type === "text") {
    selectedLayer.color = e.target.value;
    draw();
  }
};

document.getElementById("size").oninput = e => {
  if (selectedLayer?.type === "text") {
    selectedLayer.size = e.target.value;
    draw();
  }
};

document.getElementById("outlineColor").oninput = e => {
  if (selectedLayer?.type === "text") {
    selectedLayer.outline = e.target.value;
    draw();
  }
};

document.getElementById("outlineWidth").oninput = e => {
  if (selectedLayer?.type === "text") {
    selectedLayer.outlineWidth = e.target.value;
    draw();
  }
};

document.getElementById("align").onchange = e => {
  if (selectedLayer?.type === "text") {
    selectedLayer.align = e.target.value;
    draw();
  }
};

// DRAG
let dragging = false;

canvas.onmousedown = () => dragging = true;
canvas.onmouseup = () => dragging = false;

canvas.onmousemove = e => {
  if (dragging && selectedLayer) {
    const rect = canvas.getBoundingClientRect();
    selectedLayer.x = e.clientX - rect.left;
    selectedLayer.y = e.clientY - rect.top;
    draw();
  }
};

// DOWNLOAD
function download() {
  let link = document.createElement("a");
  link.download = "design.png";
  link.href = canvas.toDataURL();
  link.click();
}

productImage.onload = draw;
